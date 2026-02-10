import React, { useState, useEffect } from "react"
import axios from "axios"
import { Plus, Wallet, Settings, RefreshCw, Target, Trash2, TrendingUp, TrendingDown, LayoutGrid, List } from "lucide-react"
// IMPORTANTE: Asegúrate de importar todos estos componentes de recharts
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const API = "http://localhost:8000"

function App() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [fixedItems, setFixedItems] = useState([])
  const [goal, setGoal] = useState(null)
  
  // UI
  const [viewMode, setViewMode] = useState("month") // month | year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showConfig, setShowConfig] = useState(false)
  const [annualData, setAnnualData] = useState(null)

  // Forms
  const [formData, setFormData] = useState({ amount: "", category: "", description: "", type: "expense" })
  const [goalForm, setGoalForm] = useState({ name: "", target_amount: "", deadline: "" })
  const [newCat, setNewCat] = useState({ name: "", budget: "" })
  const [fixedForm, setFixedForm] = useState({ amount: "", category: "", description: "", type: "expense" })

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b']
  const MONTHS_LIST = [
    { id: "01", name: "Ene" }, { id: "02", name: "Feb" }, { id: "03", name: "Mar" }, { id: "04", name: "Abr" },
    { id: "05", name: "May" }, { id: "06", name: "Jun" }, { id: "07", name: "Jul" }, { id: "08", name: "Ago" },
    { id: "09", name: "Sep" }, { id: "10", name: "Oct" }, { id: "11", name: "Nov" }, { id: "12", name: "Dic" }
  ]

  useEffect(() => { refreshAll() }, [selectedYear])

  const refreshAll = async () => {
    try {
      const [tx, cat, fix, gol, ann] = await Promise.all([
        axios.get(`${API}/transactions/`), axios.get(`${API}/categories/`),
        axios.get(`${API}/fixed/`), axios.get(`${API}/goals/`), axios.get(`${API}/summary/${selectedYear}`)
      ])
      setTransactions(tx.data); setCategories(cat.data); setFixedItems(fix.data); setAnnualData(ann.data)
      if(gol.data.length > 0) setGoal(gol.data[0])
    } catch (e) { console.error(e) }
  }

  // --- Calculations ---
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth)).sort((a,b) => new Date(b.date)-new Date(a.date))
  const mInc = monthlyTransactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0)
  const mExp = monthlyTransactions.filter(t=>t.type==='expense').reduce((a,c)=>a+c.amount,0)
  const mBal = mInc - mExp
  const spendByCat = monthlyTransactions.filter(t=>t.type==='expense').reduce((a,c)=>{ a[c.category]=(a[c.category]||0)+c.amount; return a }, {})
  const pieData = Object.keys(spendByCat).map(k=>({name:k, value:spendByCat[k]}))

  // --- Handlers ---
  const handleApplyFixed = async () => {
    if(!confirm(`¿Importar fijos a ${selectedMonth}?`)) return
    try { await axios.post(`${API}/fixed/apply/${selectedMonth}`); alert("Importado"); refreshAll() }
    catch(e) { alert(e.response?.data?.detail || "Error") }
  }
  const submitTx = async (e) => {
    e.preventDefault()
    let d = new Date().toISOString().split("T")[0]; if(!d.startsWith(selectedMonth)) d = `${selectedMonth}-01`
    await axios.post(`${API}/transactions/`, {...formData, amount: parseFloat(formData.amount), date: d})
    setFormData({...formData, amount:"", description:""}); refreshAll()
  }
  const submitFixed = async () => {
    if(!fixedForm.category) return alert("Elige categoría")
    await axios.post(`${API}/fixed/`, {...fixedForm, amount: parseFloat(fixedForm.amount)})
    setFixedForm({...fixedForm, amount:"", description:""}); refreshAll()
  }
  const deleteItem = async (ep, id) => { if(confirm("¿Borrar?")) { await axios.delete(`${API}/${ep}/${id}`); refreshAll() }}

  // Custom Tooltip para los gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
          <p className="text-sm font-mono text-indigo-600">{payload[0].value}€</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Wallet className="w-5 h-5"/></div>
                <span className="font-bold text-xl tracking-tight text-slate-900">Finanzas<span className="text-indigo-600">Pro</span></span>
            </div>
            <div className="flex gap-2">
                <button onClick={()=>setViewMode(viewMode==='month'?'year':'month')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-2">
                    {viewMode==='month' ? <LayoutGrid className="w-4 h-4"/> : <List className="w-4 h-4"/>}
                    {viewMode==='month' ? 'Ver Año' : 'Ver Mes'}
                </button>
                <button onClick={()=>setShowConfig(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Settings className="w-5 h-5"/></button>
            </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 space-y-8">
        
        {/* --- CONTROLES DE FECHA --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="bg-transparent font-bold text-slate-700 py-2 pl-4 pr-2 outline-none cursor-pointer hover:text-indigo-600">
                    {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex gap-1 overflow-x-auto max-w-[300px] md:max-w-none scrollbar-hide p-1">
                    {MONTHS_LIST.map(m => {
                        const k = `${selectedYear}-${m.id}`; const active = selectedMonth === k
                        return <button key={m.id} onClick={()=>{setSelectedMonth(k); setViewMode('month')}} 
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-md':'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>{m.name}</button>
                    })}
                </div>
            </div>
            {viewMode==='month' && (
                <button onClick={handleApplyFixed} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition">
                    <RefreshCw className="w-4 h-4"/> Importar Fijos
                </button>
            )}
        </div>

        {/* --- VISTA ANUAL --- */}
        {viewMode === 'year' && annualData ? (
             <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Ingresos Anuales" amount={annualData.income} color="emerald" icon={<TrendingUp/>}/>
                    <Card title="Gastos Anuales" amount={annualData.expense} color="red" icon={<TrendingDown/>}/>
                    <Card title="Ahorro Anual" amount={annualData.savings} color={annualData.savings >= 0 ? 'indigo' : 'red'} icon={<Wallet/>}/>
                </div>
                
                {/* --- AQUÍ ESTÁ EL GRÁFICO CORREGIDO --- */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
                    <h3 className="font-bold text-slate-800 mb-6">Evolución de Categorías</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={annualData.categories} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                            {/* Cuadrícula sutil y solo horizontal */}
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                            {/* Eje X oculto */}
                            <XAxis type="number" hide/>
                            {/* Eje Y limpio, sin líneas feas */}
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize:12, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                            {/* Tooltip moderno */}
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                            {/* Barras modernas: color índigo y bordes redondeados */}
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 12, 12, 0]} barSize={24} animationDuration={1000}>
                                 {/* Opcional: Colores distintos por barra */}
                                {annualData.categories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
        ) : (
        /* --- VISTA MENSUAL --- */
             <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
                
                {/* KPIS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card title="Ingresos" amount={mInc} color="emerald" icon={<TrendingUp/>}/>
                    <Card title="Gastos" amount={mExp} color="red" icon={<TrendingDown/>}/>
                    <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-end">
                            <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Balance Neto</p><p className="text-4xl font-bold">{mBal.toFixed(2)}€</p></div>
                            <div className="text-right"><p className="text-xs text-slate-400">Meta Global</p>
                            {goal ? <p className="font-mono text-emerald-400">{(transactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0) - transactions.filter(t=>t.type==='expense').reduce((a,c)=>a+c.amount,0)).toFixed(0)} / {goal.target_amount}€</p> : <span className="text-xs">Sin meta</span>}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 translate-x-10 -translate-y-10"></div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* COL 1: Formulario & Presupuestos */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600"/> Nuevo Movimiento</h3>
                            <form onSubmit={submitTx} className="space-y-3">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['income','expense'].map(t => (
                                        <button key={t} type="button" onClick={()=>setFormData({...formData, type:t})} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${formData.type===t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t==='income'?'Ingreso':'Gasto'}</button>
                                    ))}
                                </div>
                                <input type="number" step="0.01" placeholder="0.00 €" value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} className="w-full p-3 bg-slate-50 border-0 rounded-xl font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none" required/>
                                <input type="text" placeholder="Concepto" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required/>
                                <select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                    <option value="">Categoría...</option>
                                    {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition">Añadir</button>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Presupuestos</h3>
                            <div className="space-y-4">
                                {categories.filter(c=>c.budget>0).map(c => {
                                    const s = spendByCat[c.name]||0; const pct = Math.min((s/c.budget)*100,100)
                                    return (
                                        <div key={c.id}>
                                            <div className="flex justify-between text-xs font-bold mb-1 text-slate-500"><span>{c.name}</span><span className={s>c.budget?'text-red-500':'text-indigo-600'}>{s.toFixed(0)}/{c.budget}€</span></div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${s>c.budget?'bg-red-500':'bg-indigo-500'}`} style={{width:`${pct}%`}}></div></div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* COL 2 & 3: Gráfico y Tabla */}
                    <div className="lg:col-span-2 space-y-6">
                        {pieData.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie>
                                        <Tooltip content={<CustomTooltip />}/>
                                        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle"/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-400 font-bold text-xs uppercase"><tr><th className="px-6 py-3">Concepto</th><th className="px-6 py-3 text-right">Monto</th><th className="px-6 py-3"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {monthlyTransactions.map(t=>(
                                        <tr key={t.id} className="hover:bg-slate-50 group">
                                            <td className="px-6 py-3"><p className="font-bold text-slate-700">{t.description}</p><p className="text-xs text-slate-400">{new Date(t.date).getDate()} {MONTHS_LIST.find(m=>m.id===t.date.split('-')[1])?.name} · <span className="text-indigo-500">{t.category}</span></p></td>
                                            <td className={`px-6 py-3 text-right font-mono font-bold ${t.type==='income'?'text-emerald-500':'text-slate-700'}`}>{t.type==='income'?'+':'-'}{t.amount}€</td>
                                            <td className="px-6 py-3 text-right"><button onClick={()=>deleteItem('transactions',t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* --- MODAL --- */}
        {showConfig && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h2 className="font-bold text-lg">Configuración</h2><button onClick={()=>setShowConfig(false)}>✕</button></div>
                    <div className="p-6 overflow-y-auto space-y-8 flex-1">
                        
                        <Section title="Meta de Ahorro">
                            <div className="flex gap-2">
                                <input placeholder="Nombre" value={goalForm.name} onChange={e=>setGoalForm({...goalForm, name:e.target.value})} className="border p-2 rounded w-full"/>
                                <input placeholder="€" type="number" value={goalForm.target_amount} onChange={e=>setGoalForm({...goalForm, target_amount:e.target.value})} className="border p-2 rounded w-32"/>
                                <button onClick={async()=>{await axios.post(`${API}/goals/`, {...goalForm, target_amount:parseFloat(goalForm.target_amount)}); refreshAll()}} className="bg-indigo-600 text-white px-4 rounded font-bold">Guardar</button>
                            </div>
                        </Section>

                        <Section title="Plantillas de Fijos">
                            <p className="text-xs text-slate-400 mb-2">Aquí defines qué gastos se importarán mensualmente.</p>
                            <div className="flex gap-2 mb-2">
                                <select value={fixedForm.type} onChange={e=>setFixedForm({...fixedForm, type:e.target.value})} className="border p-2 rounded bg-white text-xs"><option value="expense">Gasto</option><option value="income">Ingreso</option></select>
                                <input placeholder="Concepto" value={fixedForm.description} onChange={e=>setFixedForm({...fixedForm, description:e.target.value})} className="border p-2 rounded w-full text-xs"/>
                                {/* SELECTOR CATEGORÍA FIJOS */}
                                <select value={fixedForm.category} onChange={e=>setFixedForm({...fixedForm, category:e.target.value})} className="border p-2 rounded w-full text-xs bg-white">
                                    <option value="">Categoría...</option>
                                    {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <input placeholder="€" type="number" value={fixedForm.amount} onChange={e=>setFixedForm({...fixedForm, amount:e.target.value})} className="border p-2 rounded w-20 text-xs"/>
                                <button onClick={submitFixed} className="bg-emerald-500 text-white px-3 rounded font-bold">+</button>
                            </div>
                            <div className="space-y-1">
                                {fixedItems.map(f=><div key={f.id} className="flex justify-between p-2 bg-slate-50 rounded border text-xs"><span>{f.description} ({f.amount}€) <span className="text-indigo-500">[{f.category}]</span></span><button onClick={()=>deleteItem('fixed',f.id)} className="text-red-400">×</button></div>)}
                            </div>
                        </Section>

                        <Section title="Categorías">
                            <div className="flex gap-2 mb-2">
                                <input placeholder="Nombre" value={newCat.name} onChange={e=>setNewCat({...newCat, name:e.target.value})} className="border p-2 rounded w-full text-xs"/>
                                <input placeholder="Límite €" type="number" value={newCat.budget} onChange={e=>setNewCat({...newCat, budget:e.target.value})} className="border p-2 rounded w-24 text-xs"/>
                                <button onClick={async()=>{await axios.post(`${API}/categories/`, {name:newCat.name, budget:parseFloat(newCat.budget)}); setNewCat({name:"",budget:""}); refreshAll()}} className="bg-slate-600 text-white px-3 rounded font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(c=><div key={c.id} className="bg-white border px-3 py-1 rounded-full text-xs flex gap-2 items-center">{c.name} <b>{c.budget}€</b><button onClick={()=>deleteItem('categories',c.id)} className="text-red-400 hover:text-red-600">×</button></div>)}
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}

// Componentes Auxiliares
const Card = ({title, amount, color, icon}) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 border-${color}-500 flex justify-between items-center`}>
        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">{title}</p><p className={`text-2xl font-bold text-${color}-600`}>{amount?.toFixed(0)}€</p></div>
        <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-full`}>{icon}</div>
    </div>
)

const Section = ({title, children}) => (
    <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        <h3 className="font-bold text-slate-700 mb-3">{title}</h3>
        {children}
    </div>
)

export default App