# Alocador Diário de Recursos Urbanos

## 1. Objetivo

O problema consiste em selecionar e ordenar, **uma única vez no começo do dia**, as demandas urbanas que serão atendidas por uma equipe de manutenção. A rota deve respeitar a duração da jornada e equilibrar três objetivos:

1. evitar que demandas prioritárias e antigas continuem abertas;
2. maximizar a prioridade total das demandas atendidas;
3. reduzir o número estimado de pessoas afetadas pelas obras escolhidas.

O resultado do planejamento é uma rota fixa para o dia. Não há reotimização durante a jornada. Demandas recebidas depois da alocação entram, por padrão, no planejamento do dia seguinte.

---

## 2. Rede urbana

A cidade é representada por um grafo:

$$
G=(V,E),
$$

em que `V` é o conjunto de cruzamentos e pontos operacionais, e `E` é o conjunto de conexões viárias.

Cada aresta `e ∈ E` possui exatamente duas propriedades relevantes para o modelo:

$$
e=(n_e,\tau_e),
$$

em que:

- `n_e ≥ 0`: estimativa de pessoas afetadas caso uma obra seja executada na aresta;
- `τ_e ≥ 0`: tempo estimado para a equipe atravessar a aresta.

Os dois valores são definidos antes da alocação diária e permanecem fixos durante a otimização. Assim, não há discretização por faixa horária nem funções dependentes do instante de passagem.

Uma rua bidirecional pode ser representada por dois arcos, `(u,v)` e `(v,u)`, caso o tempo de deslocamento seja diferente em cada sentido. Se os dois sentidos forem equivalentes, os valores podem ser iguais.

É importante distinguir o uso das propriedades:

- `τ_e` é contabilizado quando a equipe **percorre** a aresta;
- `n_e` é contabilizado quando a equipe **executa uma demanda** localizada na aresta, e não apenas quando passa por ela.

---

## 3. Demandas

Seja o conjunto de demandas abertas no começo do dia:

$$
D=\{d_1,d_2,\ldots,d_N\}.
$$

Cada demanda é descrita por:

$$
d_i=(p_i,s_i,e_i,r_i),
$$

em que:

- `p_i > 0`: prioridade da demanda;
- `s_i > 0`: duração estimada do serviço;
- `e_i ∈ E`: aresta em que a demanda está localizada;
- `r_i`: instante em que a demanda foi aberta.

Se `t₀` é o instante da alocação no começo do dia, a idade da demanda é:

$$
t_i=t_0-r_i.
$$

Todos os valores usados pelo otimizador são uma fotografia do sistema no instante `t₀`.

---

## 4. Penalidade por prioridade e tempo em aberto

Para dar peso crescente às demandas antigas, define-se a penalidade individual:

$$
g_i=p_i t_i^2.
$$

O termo quadrático faz a penalidade crescer mais rapidamente conforme a demanda envelhece, enquanto `p_i` faz com que demandas mais prioritárias envelheçam com maior custo operacional.

Se `x_i=1` quando a demanda é selecionada e `x_i=0` quando ela fica aberta, a penalidade das demandas não atendidas é:

$$
P_{\text{abertas}}
=
\sum_{i\in D}p_i t_i^2(1-x_i).
$$

Esse termo deve ser minimizado. Aplicar `p_i t_i²` a todas as demandas sem considerar `x_i` produziria uma constante e não mudaria a solução.

Para uma alocação feita em um único instante, minimizar a expressão acima é equivalente a maximizar:

$$
\sum_{i\in D}p_i t_i^2x_i,
$$

pois `Σ_i p_i t_i²` é constante. A primeira forma, porém, deixa mais clara a intenção: penalizar demandas prioritárias e antigas que permanecerão abertas após o planejamento.

Essa penalidade reduz o risco de adiamento contínuo, mas não garante sozinha um prazo máximo. Se essa garantia for necessária, deve-se acrescentar uma regra de atendimento obrigatório.

---

## 5. Variáveis de decisão e rota

A solução é uma sequência:

$$
R=(i_1,i_2,\ldots,i_m),
\qquad 0\leq m\leq N,
$$

na qual cada demanda aparece no máximo uma vez.

A variável binária de seleção é:

$$
x_i=
\begin{cases}
1, & \text{se a demanda }i\text{ estiver na rota};\\
0, & \text{caso contrário.}
\end{cases}
$$

A decisão determina:

- quais demandas serão atendidas;
- a ordem de atendimento;
- o caminho percorrido entre os atendimentos.

O cronograma é consequência da rota, dos tempos `τ_e` e das durações de serviço `s_i`; ele não é replanejado ao longo do dia.

---

## 6. Deslocamento

Seja:

$$
\Delta(u,v)
$$

o menor tempo de deslocamento entre `u` e `v`, calculado pela soma de `τ_e` nas arestas do caminho. Como os tempos são fixos durante o planejamento, pode-se usar o algoritmo de Dijkstra convencional.

Para simplificar a notação, seja `v_i` o ponto operacional usado para acessar a demanda `i` em sua aresta `e_i`, e `v₀` a posição inicial da equipe. O tempo total de deslocamento da rota é:

$$
T_{\text{desl}}(R)
=
\Delta(v_0,v_{i_1})
+
\sum_{k=2}^{m}\Delta(v_{i_{k-1}},v_{i_k}).
$$

Se a intervenção puder ser acessada por qualquer extremidade da aresta, a implementação deve escolher a extremidade que produz o menor percurso viável e manter essa escolha consistente com a rota.

---

## 7. Pessoas afetadas

O impacto populacional da rota é a soma da estimativa associada às arestas das demandas atendidas:

$$
N_{\text{afetadas}}(R)
=
\sum_{i\in D}n_{e_i}x_i.
$$

Essa formulação pressupõe que `n_e` representa o impacto de executar uma obra na aresta durante o dia planejado.

Se duas demandas na mesma aresta afetarem as mesmas pessoas, a soma poderá contar parte da população mais de uma vez. Esse comportamento precisa ser definido como regra de negócio: impacto por demanda, por obra simultânea ou por aresta única atendida no dia.

---

## 8. Restrição de jornada

Há uma única equipe, uma posição inicial `v₀` e uma duração máxima de jornada `T`. A rota deve satisfazer:

$$
T_{\text{desl}}(R)
+
\sum_{i\in D}s_i x_i
\leq T.
$$

Caso o retorno à base seja obrigatório, acrescenta-se o deslocamento da última demanda até `v₀`:

$$
T_{\text{desl}}(R)
+
\Delta(v_{i_m},v_0)
+
\sum_{i\in D}s_i x_i
\leq T.
$$

---

## 9. Função objetivo

Uma formulação simples é maximizar:

$$
\max_R
\left[
-w_A\,\overline{P}_{\text{abertas}}
+w_P\,\overline{P}_{\text{atendida}}(R)
-w_N\,\overline{N}_{\text{afetadas}}(R)
\right],
$$

sujeito à restrição de jornada e à visita de cada demanda no máximo uma vez.

Os termos representam:

- `P_abertas`: penalidade `Σ_i p_i t_i²(1-x_i)` das demandas que permanecem abertas;
- `P_atendida`: prioridade total `Σ_i p_i x_i` das demandas selecionadas;
- `N_afetadas`: estimativa de pessoas afetadas pelas demandas selecionadas;
- `w_A`, `w_P` e `w_N`: pesos não negativos definidos pela política operacional.

Como valores maiores de `p_i` representam prioridades maiores, `P_atendida` entra com sinal positivo. As demandas abertas e as pessoas afetadas entram com sinal negativo, pois são penalidades. O deslocamento não faz parte da função objetivo: ele é calculado para definir a melhor ordem de cada conjunto de demandas e continua consumindo o tempo disponível na restrição de jornada.

Como penalidade acumulada, prioridade e pessoas têm escalas diferentes, os termos devem ser normalizados. Uma possibilidade é:

$$
\overline{P}_{\text{abertas}}
=
\frac{P_{\text{abertas}}}{P_{\text{ref}}},
\qquad
\overline{P}_{\text{atendida}}
=
\frac{\sum_i p_i x_i}{\sum_i p_i},
\qquad
\overline{N}_{\text{afetadas}}
=
\frac{N_{\text{afetadas}}}{N_{\text{ref}}}.
$$

Os valores de referência podem ser percentis calculados sobre dados históricos. A calibração dos pesos deve ser validada com rotas reais, pois um peso excessivo para pessoas afetadas pode levar o modelo a evitar sistematicamente regiões movimentadas.

---

## 10. Entrada e saída

### Entrada

1. Grafo `G=(V,E)`.
2. Para cada aresta, estimativa de pessoas afetadas `n_e` e tempo de deslocamento `τ_e`.
3. Demandas abertas `D`, contendo `p_i`, `s_i`, `e_i` e `r_i`.
4. Posição inicial `v₀`, instante de planejamento `t₀` e duração da jornada `T`.
5. Pesos da função objetivo e eventual regra de prazo máximo.

### Saída

Uma rota diária fixa:

$$
\widehat D=(d_{i_1},d_{i_2},\ldots,d_{i_m}),
$$

acompanhada de:

- ordem das demandas;
- horários previstos de chegada, início e término;
- caminho entre os atendimentos;
- penalidade evitada pelo atendimento das demandas escolhidas;
- estimativa de pessoas afetadas;
- tempo total de deslocamento e serviço;
- demandas que permanecerão abertas.

---

## 11. Pipeline diário

```text
1. No começo do dia, obter todas as demandas abertas.
2. Calcular a idade t_i de cada demanda.
3. Carregar n_e e τ_e de cada aresta.
4. Associar cada demanda à sua aresta e ao ponto de acesso.
5. Calcular os menores tempos de deslocamento necessários.
6. Resolver conjuntamente a seleção e a ordem das demandas.
7. Publicar a rota e o cronograma do dia.
8. Executar a rota sem nova alocação durante a jornada.
9. Levar demandas novas ou não atendidas para o planejamento seguinte.
```

Uma mudança durante o dia — como atraso, interdição ou emergência — não dispara automaticamente uma nova otimização. O tratamento dessas exceções deve seguir uma regra operacional externa ao alocador diário.

---

## 12. Estratégia de solução

Para poucas demandas, podem ser enumerados subconjuntos e ordens, o que facilita validar a função objetivo. Para uma quantidade maior, podem ser usados:

- programação inteira mista;
- busca local com inserção, remoção e troca de demandas;
- *Large Neighborhood Search*;
- algoritmo genético;
- agrupamento geográfico seguido de otimização dentro dos grupos.

Como `τ_e` é fixo no dia, uma matriz de menores tempos entre a base e os pontos de atendimento pode ser pré-calculada antes da otimização.

---

## 13. Decisões em aberto

1. `t_i` deve ser medido em horas ou dias?
2. A prioridade `p_i` usa qual escala e valores maiores significam maior prioridade?
3. `n_e` representa pessoas únicas afetadas, pessoa-hora ou um índice de impacto?
4. Quando houver mais de uma demanda na mesma aresta, `n_e` deve ser contado uma vez por demanda ou uma vez por aresta atendida no dia?
5. A equipe precisa retornar à base ao final da jornada?
6. Uma demanda localizada em uma aresta pode ser acessada por qualquer extremidade ou existe um ponto de acesso definido?
7. Demandas acima de uma idade limite devem ser obrigatórias, independentemente dos pesos?
8. Qual exceção permite abandonar a rota fixa durante o dia: emergência, inviabilidade física ou nenhuma?

---

## 14. Especificação resumida

**Problema:** no começo do dia, selecionar e ordenar uma única rota para atender parte das demandas abertas.

**Arestas:** cada aresta possui uma estimativa de pessoas afetadas `n_e` e um tempo de deslocamento `τ_e`.

**Objetivo:** maximizar um valor que penaliza as demandas não atendidas por `p_i t_i²`, recompensa a prioridade total atendida e penaliza o impacto populacional das obras selecionadas.

**Restrições principais:** uma equipe, uma alocação por dia, cada demanda atendida no máximo uma vez e duração total limitada por `T`.

**Saída:** lista ordenada de demandas, caminho, cronograma e indicadores da rota diária.

---

## 15. Notebook de exemplo

O arquivo `alocador_diario_mock.ipynb` contém uma implementação executável com 20 vértices e 10 demandas mockadas. O exemplo usa programação dinâmica para encontrar a solução exata, compara o resultado com heurísticas gulosas e 1.000 construções aleatórias, gera o cronograma e salva as visualizações em `outputs/`.

Para abrir o notebook no ambiente local:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/jupyter lab alocador_diario_mock.ipynb
```
