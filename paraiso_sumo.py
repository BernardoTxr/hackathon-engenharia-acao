#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
 SIMULACAO PARAISO NO SUMO  -  Alocador Dinamico de Recursos Urbanos
====================================================================
Um caminhao sai da subprefeitura e atende buracos ao longo de 8h.
Como (deslocamento + servico) de TODOS excede a jornada, e preciso
ESCOLHER. Comparamos 3 politicas e animamos a vencedora no sumo-gui.

  aleatorio   -> ordem aleatoria (baseline)
  fifo        -> por denuncia, mais antigas primeiro (o que a prefeitura faz)
  maxpontos   -> nosso metodo: maximiza prioridade capturada por tempo gasto

O bairro vira grafo com peso por hora: 8 horas x 3 repeticoes = 24 grafos
(a media das 3 reps). O peso e o tempo real de deslocamento no SUMO.

--------------------------------------------------------------------
COMO RODAR: veja o guia GUIA_PARAISO.txt (passo a passo, do OSM ate a animacao).
--------------------------------------------------------------------
"""
import os, sys, json, random
import numpy as np

# ---- garante que as libs do SUMO estao no path (precisa de SUMO_HOME) ----
if 'SUMO_HOME' in os.environ:
    sys.path.append(os.path.join(os.environ['SUMO_HOME'], 'tools'))
else:
    sys.exit("ERRO: variavel SUMO_HOME nao definida. Veja o passo 1 do guia.")
import sumolib
import traci

# ============================ CONFIG ============================
NET_FILE    = "paraiso.net.xml"       # rede gerada no passo 3 do guia
SUBPREF     = (-46.6415, -23.5715)    # (lon, lat) da subprefeitura - TROQUE p/ a real
N_POT       = 40                      # buracos (alto: nao da p/ tapar todos)
TS_MIN      = 22                      # tempo de servico por buraco (min)
JORNADA_H   = 8
MARGEM      = 0.85
REPS_HORA   = 3                       # 8h x 3 = 24 grafos
SEED        = 42
CONG        = [1.9, 1.6, 1.2, 1.0, 1.0, 1.1, 1.4, 1.8]   # congestionamento por hora
GUI_DELAY   = 60                      # ms por passo na animacao (maior = mais lento)
# ===============================================================

T_BUDGET = JORNADA_H*3600*MARGEM
TS_SEG   = TS_MIN*60
POLS     = ['aleatorio', 'fifo', 'maxpontos']
NOME     = {'aleatorio': 'Aleatorio', 'fifo': 'Por denuncia (FIFO)',
            'maxpontos': 'Max prioridade (nosso)'}
COR      = {'aleatorio': (130,153,174,255), 'fifo': (246,169,59,255),
            'maxpontos': (63,208,201,255)}


# --------------------------- rede / buracos ---------------------------
def carregar_rede():
    if not os.path.exists(NET_FILE):
        sys.exit(f"ERRO: nao achei '{NET_FILE}'. Gere a rede primeiro (passos 2-3 do guia).")
    return sumolib.net.readNet(NET_FILE)

def aresta_mais_proxima(net, lon, lat):
    x, y = net.convertLonLat2XY(lon, lat)
    cands = [(e, d) for e, d in net.getNeighboringEdges(x, y, r=400) if e.allows("passenger")]
    if not cands:
        sys.exit("ERRO: nenhuma rua transitavel perto da subprefeitura. Ajuste SUBPREF.")
    return min(cands, key=lambda ed: ed[1])[0].getID()

def sortear_buracos(net, seed):
    rng = random.Random(seed)
    edges = [e for e in net.getEdges()
             if e.allows("passenger") and e.getLength() > 20 and not e.getID().startswith(":")]
    chosen = rng.sample(edges, min(N_POT, len(edges)))
    return [dict(id=i, edge=e.getID(), pos=e.getLength()/2.0, P=rng.randint(1, 10),
                 s=TS_SEG, idade_dias=rng.uniform(0, 30)) for i, e in enumerate(chosen)]


# --------------------------- 24 grafos (matrizes de tempo) ---------------------------
def matriz_base(net, node_edges):
    """Tempo de deslocamento livre (s) entre as arestas-no, via sumolib."""
    objs = [net.getEdge(e) for e in node_edges]
    N = len(objs); M = np.full((N, N), 1e9); np.fill_diagonal(M, 0.0)
    for i in range(N):
        for j in range(N):
            if i == j: continue
            r = net.getShortestPath(objs[i], objs[j], vClass="passenger")
            if r and r[1] is not None and r[1] > 0: M[i, j] = r[1]
    return M

def matrizes_horarias(base, seed):
    """8 matrizes (uma por hora), cada uma = media de REPS_HORA versoes = 24 grafos."""
    rng = np.random.default_rng(seed); mats = []
    for h in range(JORNADA_H):
        acc = np.zeros_like(base)
        for _ in range(REPS_HORA):
            ruido = np.clip(rng.normal(1.0, 0.08, base.shape), 0.7, 1.4)
            acc += base * CONG[h] * ruido
        mats.append(acc/REPS_HORA)
    return mats


# --------------------------- politicas ---------------------------
def simular(pot, mats, policy, seed):
    rng = random.Random(seed); rem = list(range(len(pot)))
    if policy == 'aleatorio': rng.shuffle(rem)
    if policy == 'fifo': rem.sort(key=lambda i: pot[i]['idade_dias'], reverse=True)
    t, cur, order = 0.0, 0, []
    while rem:
        h = min(int(t//3600), JORNADA_H-1); M = mats[h]
        if policy == 'maxpontos':
            nxt = max(rem, key=lambda i: pot[i]['P']/(M[cur][i+1] + pot[i]['s']))
        else:
            nxt = rem[0]
        tt = M[cur][nxt+1]
        if t + tt + pot[nxt]['s'] <= T_BUDGET:
            t += tt + pot[nxt]['s']; cur = nxt+1; order.append(nxt)
        rem.remove(nxt)
    pts = sum(pot[i]['P'] for i in order)
    ct = sum(1 for x in pot if x['P'] >= 8); cs = sum(1 for i in order if pot[i]['P'] >= 8)
    return dict(order=order, pts=pts, n=len(order),
                pct_crit=round(100*cs/max(ct, 1)), tmin=round(t/60))


# --------------------------- animacao (sumo-gui via TraCI) ---------------------------
def animar(net, depot_edge, pot, order, policy):
    binary = sumolib.checkBinary("sumo-gui")
    traci.start([binary, "-n", NET_FILE, "--start", "--quit-on-end",
                 "--delay", str(GUI_DELAY), "--step-length", "0.5"])

    # marca os buracos (amarelo = normal, vermelho = critico; tamanho ~ P)
    for p in pot:
        lane = net.getEdge(p['edge']).getLanes()[0]; sh = lane.getShape()
        x, y = sh[len(sh)//2]
        cor = (255,80,80,255) if p['P'] >= 8 else (240,210,60,255)
        try: traci.poi.add(f"b{p['id']}", x, y, color=cor, layer=8,
                           width=4+p['P'], height=4+p['P'])
        except traci.TraCIException: pass

    traci.route.add("r0", [depot_edge])
    traci.vehicle.add("caminhao", "r0", typeID="DEFAULT_VEHTYPE")
    traci.vehicle.setColor("caminhao", COR[policy])
    traci.vehicle.setParameter("caminhao", "has.rerouting.device", "true")

    for i in order:
        alvo = pot[i]['edge']
        try: traci.vehicle.changeTarget("caminhao", alvo)
        except traci.TraCIException: continue
        g = 0
        while traci.vehicle.getRoadID("caminhao") != alvo and g < 300000:
            traci.simulationStep(); g += 1
            if "caminhao" not in traci.vehicle.getIDList(): break
        if "caminhao" not in traci.vehicle.getIDList(): break
        # conserto: para o caminhao (tempo comprimido) e apaga o buraco
        traci.vehicle.setSpeed("caminhao", 0.0)
        for _ in range(int(pot[i]['s']/20)): traci.simulationStep()
        try: traci.poi.remove(f"b{i}")
        except traci.TraCIException: pass
        traci.vehicle.setSpeed("caminhao", -1.0)
    traci.close()


# --------------------------- main ---------------------------
def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--anima", nargs="?", const="maxpontos", default=None, choices=POLS,
                    help="anima a rota desta politica no sumo-gui")
    args = ap.parse_args()

    net = carregar_rede()
    depot = aresta_mais_proxima(net, *SUBPREF)
    pot = sortear_buracos(net, SEED)
    node_edges = [depot] + [p['edge'] for p in pot]
    print(f"Rede: {NET_FILE} | subprefeitura na aresta {depot} | {len(pot)} buracos")

    print(f"Montando os 24 grafos ({JORNADA_H}h x {REPS_HORA} reps)...")
    base = matriz_base(net, node_edges)
    mats = matrizes_horarias(base, SEED)

    print(f"\n{'Politica':<26}{'Pontos':>8}{'% crit':>9}{'# buracos':>11}{'tempo':>8}")
    print('-'*62)
    res = {}
    for p in POLS:
        r = simular(pot, mats, p, SEED); res[p] = r
        print(f"{NOME[p]:<26}{r['pts']:>8}{r['pct_crit']:>8}%{r['n']:>11}{r['tmin']/60:>7.1f}h")
    json.dump({p: res[p]['order'] for p in POLS}, open("ordens.json", "w"))
    print("\nOrdens salvas em ordens.json")

    if args.anima:
        print(f"\nAnimando '{args.anima}' no sumo-gui (feche a janela p/ terminar)...")
        animar(net, depot, pot, res[args.anima]['order'], args.anima)


if __name__ == "__main__":
    main()
