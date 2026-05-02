import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ChevronLeft, ShieldAlert, Sparkles, Zap } from 'lucide-react'
import { types } from '../data/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

const Compare = () => {
  const { code1, code2 } = useParams()
  const navigate = useNavigate()
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  const type1 = types.find(t => t.code === code1)
  const type2 = types.find(t => t.code === code2)

  // 计算匹配度 (基于理想值向量距离)
  const calculateCompatibility = (t1, t2) => {
    if (!t1 || !t2) return 0
    const dims = ['T', 'E', 'S', 'K', 'R']
    let diffSum = 0
    dims.forEach(d => {
      diffSum += Math.pow((t1.ideal[d] || 0) - (t2.ideal[d] || 0), 2)
    })
    const distance = Math.sqrt(diffSum)
    // 归一化到 0-100 (最大距离约 sqrt(10^2 * 5) = 22.3)
    const score = Math.max(0, Math.min(100, 100 - (distance / 15) * 100))
    return Math.round(score)
  }

  const score = calculateCompatibility(type1, type2)

  const [copySuccess, setCopySuccess] = useState(false)
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  useEffect(() => {
    if (!type1 || !type2) return
    setLoadingAI(true)
    setAiAnalysis('')

    const fetchCompare = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ai/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type1: type1.code, 
            type2: type2.code, 
            score,
            stream: true 
          })
        })

        if (!res.ok) throw new Error('Fetch failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let done = false
        let fullContent = ''

        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          const chunkValue = decoder.decode(value)
          
          const lines = chunkValue.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              if (dataStr === '[DONE]') break
              try {
                const data = JSON.parse(dataStr)
                const content = data.choices[0]?.delta?.content || ''
                fullContent += content
                setAiAnalysis(fullContent)
              } catch (e) { /* ignore */ }
            }
          }
        }
      } catch (err) {
        console.error('Comparison streaming failed:', err)
        setAiAnalysis(`当「${type1.name}」遇到「${type2.name}」，这是一场关于${score > 70 ? '共鸣' : '碰撞'}的对话。`)
      } finally {
        setLoadingAI(false)
      }
    }

    fetchCompare()
  }, [code1, code2, score])

  if (!type1 || !type2) return <div>Invalid types</div>

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest">Fans Compatibility PK</h1>
        <button 
          onClick={handleCopyLink}
          className={`p-2 rounded-xl transition-all ${copySuccess ? 'bg-emerald-500 text-white' : 'hover:bg-gray-50 text-gray-400'}`}
        >
          {copySuccess ? <Zap className="w-4 h-4 fill-current" /> : <ArrowLeftRight className="w-5 h-5" />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-12">
        {/* PK Header */}
        <div className="flex items-center justify-between gap-4 mb-12">
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="flex-1 text-center"
          >
            <div className="w-20 h-20 mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-3">
              <img src={`/images/${type1.code}.png`} alt={type1.name} className="w-16 h-16 object-contain" />
            </div>
            <p className="text-xs font-black uppercase text-gray-400 mb-1">{type1.code}</p>
            <h2 className="text-lg font-bold truncate">{type1.name}</h2>
          </motion.div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div className="h-12 w-[2px] bg-gradient-to-b from-rose-500 to-transparent mt-2" />
          </div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="flex-1 text-center"
          >
            <div className="w-20 h-20 mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-3">
              <img src={`/images/${type2.code}.png`} alt={type2.name} className="w-16 h-16 object-contain" />
            </div>
            <p className="text-xs font-black uppercase text-gray-400 mb-1">{type2.code}</p>
            <h2 className="text-lg font-bold truncate">{type2.name}</h2>
          </motion.div>
        </div>

        {/* Compatibility Score */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 text-center mb-8 relative overflow-hidden"
        >
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-rose-500 to-indigo-500" />
           <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">合拍指数</p>
           <div className="text-7xl font-black italic tracking-tighter text-gray-900 mb-2">
             {score}%
           </div>
           <p className="text-sm font-bold text-gray-500">
             {score > 80 ? '天作之合，建议立刻面基看球' : 
              score > 50 ? '志趣相投，虽然主队可能互掐' : 
              '八字不合，评论区必有一战'}
           </p>
        </motion.div>

        {/* AI Analysis (Fallback included) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-200">AI 深度对比分析</h3>
          </div>
          {loadingAI ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-5/6" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed font-medium italic">
              "{aiAnalysis || `当「${type1.name}」遇到「${type2.name}」，这是一场关于${score > 70 ? '共鸣' : '碰撞'}的对话。前者追求${type1.tags[0]}，后者信奉${type2.tags[0]}。这种组合在英超看台上${score > 80 ? '极为罕见且合拍' : '充满了张力'}。`}"
            </p>
          )}
        </motion.div>

        {/* Dimensions Comparison */}
        <div className="space-y-4">
           {['T', 'E', 'S', 'K', 'R'].map(dim => {
             const labels = { T: '死忠', E: '激情', S: '社交', K: '懂球', R: '韧性' }
             const v1 = type1.ideal[dim] || 0
             const v2 = type2.ideal[dim] || 0
             const p1 = ((v1 + 5) / 10) * 100
             const p2 = ((v2 + 5) / 10) * 100
             return (
               <div key={dim} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                   <span>{type1.code}</span>
                   <span className="text-gray-900">{labels[dim]}</span>
                   <span>{type2.code}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden flex flex-row-reverse">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p1}%` }} />
                    </div>
                    <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${p2}%` }} />
                    </div>
                 </div>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  )
}

export default Compare
