import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Bell, Check,
  ChevronDown, CircleAlert, Clock3, MapPin, Menu, MoreHorizontal,
  Plus, Route, Search, Settings2, SlidersHorizontal, Sparkles,
  Users, Wrench, X
} from 'lucide-react'
import './styles.css'

const demands = [
  { id: '5423', type: 'Buraco na via', address: 'R. Garcia, 128 · Paraíso', date: '18 ago, 08:42', priority: 'Crítica', points: 94, time: '1h 20min', status: 'Selecionada' },
  { id: '2345', type: 'Tampa danificada', address: 'Av. Jabaquara, 720', date: '17 ago, 15:10', priority: 'Alta', points: 86, time: '50min', status: 'Selecionada' },
  { id: '1234', type: 'Sinalização', address: 'R. Vergueiro, 1860', date: '16 ago, 11:25', priority: 'Alta', points: 79, time: '1h 10min', status: 'Selecionada' },
  { id: '8763', type: 'Asfalto irregular', address: 'R. Tutóia, 412 · Jardins', date: '15 ago, 09:06', priority: 'Média', points: 71, time: '1h 40min', status: 'Selecionada' },
  { id: '4325', type: 'Meio-fio danificado', address: 'R. Cubatão, 94 · Vila Mariana', date: '14 ago, 17:32', priority: 'Média', points: 64, time: '45min', status: 'Em análise' },
  { id: '9850', type: 'Buraco na via', address: 'Av. Paulista, 940', date: '14 ago, 10:14', priority: 'Baixa', points: 58, time: '1h', status: 'Em análise' },
]

const teams = [
  { name: 'Equipe 01', zone: 'Centro · Sul', color: '#e53935', total: '3h 25min', jobs: ['#5423 · Buraco na via', '#2345 · Tampa danificada', '#5612 · Sinalização'] },
  { name: 'Equipe 02', zone: 'Oeste', color: '#1e62d0', total: '2h 50min', jobs: ['#1234 · Sinalização', '#7790 · Asfalto irregular'] },
  { name: 'Equipe 03', zone: 'Leste', color: '#11865f', total: '4h 10min', jobs: ['#8763 · Asfalto irregular', '#4325 · Meio-fio danificado', '#9850 · Buraco na via'] },
]

function BrandMark() {
  return <div className="brand-mark" aria-label="Prefeitura de São Paulo">
    <svg viewBox="0 0 40 44" aria-hidden="true">
      <path d="M7 6h26v20c0 8-6 13-13 16C13 39 7 34 7 26V6Z" fill="#fff" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M9 9h22v8H9z" fill="currentColor"/><path d="M10 23l20-7v7l-20 7z" fill="#e53935"/>
      <path d="M5 5h30M10 2v6M20 1v7M30 2v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  </div>
}

function Header({ active, setActive }) {
  const nav = [
    ['classificacao', 'Classificação'],
    ['divisao', 'Divisão de serviço'],
    ['lista', 'Lista de demanda'],
    ['variaveis', 'Variáveis'],
  ]
  return <header>
    <div className="topbar">
      <div className="brand" onClick={() => setActive('classificacao')}>
        <BrandMark />
        <div><strong>SP Urbanismo</strong><span>Prefeitura de São Paulo</span></div>
      </div>
      <nav>{nav.map(([key, label]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>{label}</button>)}</nav>
      <div className="header-actions">
        <button className="icon-btn"><Search size={19}/></button>
        <button className="icon-btn bell"><Bell size={19}/><i /></button>
        <div className="avatar">LM</div>
      </div>
      <button className="mobile-menu"><Menu /></button>
    </div>
  </header>
}

function Pill({ children, tone='neutral' }) { return <span className={`pill ${tone}`}>{children}</span> }

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro">
    <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
    {action}
  </div>
}

function Classification() {
  const [priority, setPriority] = useState('Alta')
  const [serviceTime, setServiceTime] = useState('1h 30min')
  return <main>
    <PageIntro eyebrow="Operação de hoje · 22 de agosto" title="Classificação de demandas" description="Priorize ocorrências com base no impacto urbano e no tempo em aberto." action={<button className="primary"><Sparkles size={17}/> Recalcular ranking</button>} />
    <section className="summary-grid">
      <article className="stat-card"><div className="stat-icon red"><CircleAlert/></div><div><span>Demandas abertas</span><strong>24</strong><small><b>+3</b> desde ontem</small></div></article>
      <article className="stat-card"><div className="stat-icon amber"><Clock3/></div><div><span>Tempo médio em aberto</span><strong>3,8 dias</strong><small><b className="good"><ArrowDown size={12}/> 12%</b> nesta semana</small></div></article>
      <article className="stat-card"><div className="stat-icon green"><Check/></div><div><span>Previstas para hoje</span><strong>8</strong><small>6h 25min de operação</small></div></article>
      <article className="stat-card"><div className="stat-icon blue"><Users/></div><div><span>Equipes em campo</span><strong>3 de 4</strong><small>1 equipe disponível</small></div></article>
    </section>

    <section className="classify-grid simple">
      <article className="panel incident-card">
        <div className="incident-image">
          <img src="/pothole.jpeg" alt="Buraco em via pública"/>
          <Pill tone="urgent">Alta prioridade</Pill>
          <button className="photo-nav left">‹</button><button className="photo-nav right">›</button>
          <span className="photo-count">1 / 3</span>
        </div>
        <div className="incident-body">
          <div className="incident-title"><div><span>Demanda #5423</span><h2>Buraco na via</h2></div><button className="icon-btn"><MoreHorizontal/></button></div>
          <p className="location"><MapPin size={17}/><span><b>Rua Garcia, 128</b><small>Paraíso · São Paulo, SP</small></span></p>
          <div className="incident-meta"><span><Clock3/> Aberta há <b>4 dias</b></span><span><Wrench/> Reparo asfáltico</span></div>
        </div>
      </article>

      <article className="panel scoring">
        <div className="panel-head"><div><p className="eyebrow">Classificação</p><h2>Defina o atendimento</h2></div></div>
        <p className="form-helper">Escolha a urgência e o tempo necessário para concluir o serviço.</p>
        <div className="simple-field">
          <label>1. Prioridade</label>
          <div className="choice-grid priority-choices">
            {['Baixa','Média','Alta','Crítica'].map(item => <button key={item} className={priority === item ? 'selected' : ''} onClick={() => setPriority(item)}>{priority === item && <Check size={15}/>} {item}</button>)}
          </div>
        </div>
        <div className="simple-field">
          <label>2. Tempo de serviço</label>
          <div className="choice-grid time-choices">
            {['30min','1h','1h 30min','2h','3h','4h+'].map(item => <button key={item} className={serviceTime === item ? 'selected' : ''} onClick={() => setServiceTime(item)}><Clock3 size={15}/> {item}</button>)}
          </div>
        </div>
        <div className="selection-summary"><span>Resumo</span><div><b>{priority}</b><i/><b>{serviceTime}</b> estimados</div></div>
        <button className="primary full">Salvar classificação <ArrowRight size={17}/></button>
      </article>
    </section>
  </main>
}

function DemandList() {
  const [query, setQuery] = useState('')
  const filtered = demands.filter(d => `${d.id} ${d.type} ${d.address}`.toLowerCase().includes(query.toLowerCase()))
  return <main>
    <PageIntro eyebrow="Banco de ocorrências" title="Lista de demandas" description="Acompanhe, filtre e organize todas as solicitações recebidas." action={<button className="primary"><Plus size={17}/> Nova demanda</button>} />
    <section className="panel table-panel">
      <div className="table-tools"><div className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar protocolo, serviço ou endereço"/></div><button className="secondary"><SlidersHorizontal size={17}/> Filtros <span>2</span></button><button className="secondary">Mais recentes <ChevronDown size={16}/></button></div>
      <div className="table-meta"><b>24 demandas</b><span>8 selecionadas para hoje</span></div>
      <div className="table-wrap"><table><thead><tr><th><input type="checkbox"/></th><th>Protocolo</th><th>Tipo e localização</th><th>Recebida em</th><th>Prioridade</th><th>Pontos</th><th>Tempo</th><th>Status</th><th></th></tr></thead>
      <tbody>{filtered.map(d=><tr key={d.id}><td><input type="checkbox"/></td><td><b>#{d.id}</b></td><td><div className="demand-name"><span className="mini-icon"><MapPin/></span><span><b>{d.type}</b><small>{d.address}</small></span></div></td><td>{d.date}</td><td><Pill tone={d.priority==='Crítica'?'urgent':d.priority==='Alta'?'warning':'neutral'}>{d.priority}</Pill></td><td><b>{d.points}</b></td><td>{d.time}</td><td><span className={`status-dot ${d.status==='Selecionada'?'green':''}`}/>{d.status}</td><td><MoreHorizontal size={18}/></td></tr>)}</tbody></table></div>
      <div className="pagination"><span>Mostrando 1–6 de 24</span><div><button>‹</button><button className="active">1</button><button>2</button><button>3</button><button>4</button><button>›</button></div></div>
    </section>
  </main>
}

function Division() {
  const [allocated, setAllocated] = useState(true)
  return <main>
    <PageIntro eyebrow="Planejamento operacional" title="Divisão de serviço" description="Distribuição otimizada por proximidade, prioridade e jornada disponível." action={<button className="primary" onClick={()=>setAllocated(true)}><Sparkles size={17}/> Otimizar alocação</button>} />
    <section className="allocation-strip panel">
      <div><span>Equipes disponíveis</span><strong>3</strong></div><i/><div><span>Jornada por equipe</span><strong>6h 30min</strong></div><i/><div><span>Demandas selecionadas</span><strong>8</strong></div><i/><div><span>Ocupação projetada</span><strong>78%</strong></div>
      <button className="secondary"><Settings2 size={17}/> Ajustar parâmetros</button>
    </section>
    <section className="team-grid">
      {teams.map((team, idx)=><article className="panel team-card" key={team.name}>
        <div className="team-head"><div className="team-avatar" style={{background:team.color}}>{idx+1}</div><div><h2>{team.name}</h2><span>{team.zone}</span></div><Pill tone="success">Em campo</Pill></div>
        <div className="route-progress"><div><span><Route size={15}/> Rota planejada</span><b>{team.total} <small>/ 6h 30min</small></b></div><div className="progress"><i style={{width:`${[53,44,64][idx]}%`, background:team.color}}/></div></div>
        <div className="team-jobs">{team.jobs.map((job,i)=><div key={job}><span className="route-dot" style={{borderColor:team.color}}>{i+1}</span><div><b>{job}</b><small>{['08:15 · 1h 20min','10:05 · 50min','11:30 · 1h 15min'][i]}</small></div><MoreHorizontal size={17}/></div>)}</div>
        <button className="ghost full">Ver rota no mapa <ArrowUpRight size={16}/></button>
      </article>)}
    </section>
    <section className="panel route-panel"><div className="panel-head"><div><p className="eyebrow">Cobertura prevista</p><h2>Mapa de rotas do dia</h2></div><div className="route-legend">{teams.map(t=><span key={t.name}><i style={{background:t.color}}/>{t.name}</span>)}</div></div><div className="map-shell"><img src="/rota_otima.png" alt="Mapa com rota ótima para as equipes"/><div className="map-overlay"><MapPin size={16}/><span><b>8 serviços</b> em 3 regiões</span></div></div></section>
  </main>
}

function Variables() {
  const [weights, setWeights] = useState({urgency:40, age:35, impact:25})
  const update=(key,val)=>setWeights({...weights,[key]:+val})
  return <main>
    <PageIntro eyebrow="Modelo de priorização" title="Variáveis e pesos" description="Ajuste a importância de cada critério usado no cálculo de prioridade." action={<button className="primary"><Check size={17}/> Salvar alterações</button>} />
    <section className="variables-grid">
      <article className="panel variables-editor">
        <div className="panel-head"><div><p className="eyebrow">Configuração ativa</p><h2>Pesos do algoritmo</h2></div><Pill tone="success">Modelo v2.4</Pill></div>
        <p className="muted">A soma dos pesos deve totalizar 100%. As mudanças afetam apenas os próximos planejamentos.</p>
        <WeightRow color="#e53935" label="Urgência" description="Severidade e risco da ocorrência" value={weights.urgency} onChange={v=>update('urgency',v)}/>
        <WeightRow color="#eaa129" label="Tempo em aberto" description="Dias desde o registro da demanda" value={weights.age} onChange={v=>update('age',v)}/>
        <WeightRow color="#1e62d0" label="Impacto populacional" description="Estimativa de pessoas afetadas" value={weights.impact} onChange={v=>update('impact',v)}/>
        <div className="weights-total"><span>Total dos pesos</span><strong>{weights.urgency+weights.age+weights.impact}%</strong></div>
      </article>
      <article className="panel formula-card">
        <p className="eyebrow">Prévia do cálculo</p><h2>Composição da pontuação</h2>
        <div className="donut" style={{'--a':`${weights.urgency*3.6}deg`,'--b':`${(weights.urgency+weights.age)*3.6}deg`}}><div><strong>100</strong><span>pontos</span></div></div>
        <div className="formula-legend"><span><i className="red-bg"/>Urgência <b>{weights.urgency}%</b></span><span><i className="amber-bg"/>Tempo em aberto <b>{weights.age}%</b></span><span><i className="blue-bg"/>Impacto <b>{weights.impact}%</b></span></div>
        <div className="formula-box"><span>Fórmula atual</span><code>P = (U × {weights.urgency/100}) + (T × {weights.age/100}) + (I × {weights.impact/100})</code></div>
      </article>
    </section>
  </main>
}

function WeightRow({color,label,description,value,onChange}) { return <div className="weight-row"><div className="weight-copy"><i style={{background:color}}/><div><b>{label}</b><small>{description}</small></div><strong>{value}%</strong></div><input type="range" min="0" max="100" value={value} onChange={e=>onChange(e.target.value)} style={{'--value':`${value}%`,'--color':color}}/></div> }

function App() {
  const [active, setActive] = useState('classificacao')
  return <><Header active={active} setActive={setActive}/>{active==='classificacao'&&<Classification/>}{active==='lista'&&<DemandList/>}{active==='divisao'&&<Division/>}{active==='variaveis'&&<Variables/>}<footer><span>Alocador Urbano · Protótipo operacional</span><span>Dados atualizados em 22 ago 2026, 09:48</span></footer></>
}

createRoot(document.getElementById('root')).render(<App />)
