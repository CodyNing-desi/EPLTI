import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Share2, Download, RotateCcw, Home, Users } from 'lucide-react'
import { types, teamNames } from '../data/types'
import { calculateResult } from '../engine/scoring'
import SharePoster from '../components/SharePoster.jsx'
import { useWechatShare } from '../hooks/useWechatShare'

const API_BASE = import.meta.env.VITE_API_URL || ''

const teamColorMap = {
  ARS: '#EF0107', MUN: '#DA291C', LFC: '#C8102E',
  MCI: '#6CABDD', CHE: '#034694', TOT: '#132257',
}

const dimLabels = { T: '死忠', E: '激情', S: '社交', K: '懂球', R: '韧性' }
const dimOrder = ['T', 'E', 'S', 'K', 'R']

// SVG 雷达图组件
const RadarChart = ({ normalized, type, teamColor }) => {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 70
  const levels = 3 // 同心圆层数

  // 计算每个维度的点坐标
  const getPoint = (dim, value) => {
    const idx = dimOrder.indexOf(dim)
    const angle = (Math.PI * 2 * idx) / dimOrder.length - Math.PI / 2
    const radius = ((value + 5) / 10) * r
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  // 用户数据多边形顶点
  const userPoints = dimOrder.map(dim => {
    const val = normalized[dim] || 0
    const p = getPoint(dim, val)
    return `${p.x},${p.y}`
  }).join(' ')

  // 类型理想值多边形顶点
  const typePoints = dimOrder.map(dim => {
    const val = type.ideal[dim] || 0
    const p = getPoint(dim, val)
    return `${p.x},${p.y}`
  }).join(' ')

  // 背景网格线（每层）
  const gridPolygons = []
  for (let l = 1; l <= levels; l++) {
    const radius = (r * l) / levels
    const points = dimOrder.map((_, i) => {
      const angle = (Math.PI * 2 * i) / dimOrder.length - Math.PI / 2
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`
    }).join(' ')
    gridPolygons.push(points)
  }

  // 轴线
  const axisLines = dimOrder.map((_, i) => {
    const angle = (Math.PI * 2 * i) / dimOrder.length - Math.PI / 2
    return `M${cx},${cy} L${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* 背景同心圆 */}
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      {/* 轴线 */}
      <path d={axisLines} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      {/* 维度标签 */}
      {dimOrder.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / dimOrder.length - Math.PI / 2
        const lx = cx + (r + 18) * Math.cos(angle)
        const ly = cy + (r + 18) * Math.sin(angle)
        return (
          <text key={dim} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(0,0,0,0.4)" fontSize="10" fontWeight="500">
            {dimLabels[dim]}
          </text>
        )
      })}
      {/* 用户数据多边形 */}
      <polygon points={userPoints} fill={teamColor} fillOpacity="0.25"
        stroke={teamColor} strokeWidth="2" strokeLinejoin="round" />
      {/* 类型理想值多边形 */}
      <polygon points={typePoints} fill="none"
        stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" />
    </svg>
  )
}

const Result = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const [showPoster, setShowPoster] = useState(false)
  const [stats, setStats] = useState(null)
  const posterRef = useRef(null)

  const type = types.find(t => t.code === code)

  useWechatShare({
    title: `我是 ${type?.name || ''} 型球迷，你也来测测吧！`,
    desc: type?.description || `EPLTI (英超球迷人格测试) 基于T-E-S-K-R模型，快来看看你属于哪种人格类型。`,
    link: window.location.href,
    imgUrl: `${window.location.origin}/images/${type?.code || 'ZERO'}.png`
  })

  // 尝试从 sessionStorage 读取（Quiz 页写入）
  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem('quizResult')) } catch { return null }
  })()

  // 尝试从 URL id 恢复 (分享链接，优先级最高)
  const urlId = new URLSearchParams(location.search).get('id')

  // 尝试从 URL 解码答案（向后兼容 fallback）
  const urlAnswers = (() => {
    try {
      const encoded = new URLSearchParams(location.search).get('ans')
      if (encoded) return JSON.parse(atob(encoded))
    } catch { /* ignore */ }
    return null
  })()

  // 服务端恢复的状态，避免 window.location.reload()
  const [recoveredData, setRecoveredData] = useState(null)
  const [loadingRecover, setLoadingRecover] = useState(false)

  useEffect(() => {
    if (!urlId) return
    // 已有 sessionStorage 数据，无需恢复
    if (stored && stored.normalized && stored.runnerUp) return

    setLoadingRecover(true)
    fetch(`${API_BASE}/api/result/${urlId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.data && data.data.answers) {
          const recalculated = calculateResult(data.data.answers)
          const recovered = {
            type: types.find(t => t.code === data.data.type_code) || type,
            runnerUp: types.find(t => t.code === data.data.runner_up) || recalculated.runnerUp,
            normalized: recalculated.normalized,
            rawScores: recalculated.rawScores,
            detectedTeam: data.data.detected_team,
            answers: data.data.answers,
          }
          // 回填 sessionStorage 以便后续刷新可用
          try { sessionStorage.setItem('quizResult', JSON.stringify(recovered)) } catch { /* ignore */ }
          setRecoveredData(recovered)
        }
        setLoadingRecover(false)
      })
      .catch(() => setLoadingRecover(false))
  }, [urlId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 合并数据源：sessionStorage > 服务端恢复 > URL base64
  const resolved = recoveredData || stored

  let normalized = resolved?.normalized || null
  let runnerUp = resolved?.runnerUp || null
  let detectedTeam = resolved?.detectedTeam || null
  let answers = resolved?.answers || null

  if (!resolved && urlAnswers) {
    const recalculated = calculateResult(urlAnswers)
    normalized = recalculated.normalized
    runnerUp = recalculated.runnerUp
    detectedTeam = recalculated.detectedTeam
    answers = urlAnswers
    try {
      sessionStorage.setItem('quizResult', JSON.stringify({
        type,
        runnerUp,
        normalized,
        rawScores: recalculated.rawScores,
        detectedTeam,
        answers,
      }))
    } catch { /* ignore */ }
  }

  // 拉取统计数据
  useEffect(() => {
    if (!code) return
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE}/api/stats`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        console.warn('Stats API unavailable, skipping.')
      }
    }
    fetchStats()
  }, [code])

  if (loadingRecover) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-emerald-500 animate-spin mb-4"></div>
          <p className="text-gray-500 text-sm font-medium tracking-widest">正在恢复测试结果...</p>
        </div>
      </div>
    )
  }

  if (!type) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">未找到对应的人格类型</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition shadow-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const teamColor = teamColorMap[type.team] || '#E90052'
  const bestCP = types.find(t => t.code === type.bestCP)
  const worstCP = types.find(t => t.code === type.worstCP)

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden pb-[env(safe-area-inset-bottom)]">

      {/* SharePoster (hidden, for capture) */}
      {showPoster && (
        <SharePoster
          ref={posterRef}
          type={type}
          normalized={normalized}
          teamColor={teamColor}
          percentage={stats?.types[code]?.percentage ?? 0}
          total={stats?.total ?? 0}
          onClose={() => setShowPoster(false)}
        />
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-xl mx-auto px-6 py-12 pb-24"
      >
        <motion.p variants={item} className="text-center text-sm text-gray-500 font-medium mb-2 tracking-wider">
          你的球迷人格类型是：
        </motion.p>
        {/* Header badges */}
        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: teamColor }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ backgroundColor: teamColor }} />
            </span>
            <span>{type.team !== 'GEN' ? teamNames[type.team] : '跨球队'}</span>
          </span>
          {detectedTeam && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white shadow-sm"
              style={{ color: teamColor, borderColor: teamColor + '40', borderWidth: 1 }}>
              主队检测: {teamNames[detectedTeam]}
            </span>
          )}
        </motion.div>

        {/* 人格名称 */}
        <motion.h1
          variants={item}
          className="text-6xl md:text-7xl font-black text-center mb-1 tracking-tight text-gray-900 break-words"
        >
          {type.name}
        </motion.h1>

        {/* 英文代号 */}
        <motion.p
          variants={item}
          className="text-2xl md:text-3xl font-black text-center mb-4 tracking-widest uppercase"
          style={{ color: teamColor }}
        >
          {type.code}
        </motion.p>

        {/* 插图预留区 */}
        <motion.div variants={item} className="flex justify-center mb-6 mt-4">
          <div className="w-48 h-48 md:w-56 md:h-56 bg-white border border-gray-200 shadow-sm rounded-[2rem] flex items-center justify-center relative overflow-hidden">
             <img src={`/images/${type.code}.png`} alt={type.name} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
             <div className="absolute inset-0 flex-col items-center justify-center text-gray-300 text-sm font-medium hidden">
               <span className="mb-2">插图加载失败</span>
               <span className="font-mono text-xs">{type.code}.png</span>
             </div>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p variants={item} className="text-base text-gray-500 text-center font-medium mb-10 leading-relaxed">
          "{type.tagline}"
        </motion.p>

        {/* 五维分数条 */}
        {normalized && (
          <motion.div variants={item} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">人格维度画像</h3>
            <div className="space-y-4">
              {dimOrder.map(dim => {
                const val = normalized[dim] || 0
                const pct = ((val + 5) / 10) * 100 // map [-5,5] to [0,100]
                const typeVal = type.ideal[dim] || 0
                const typePct = ((typeVal + 5) / 10) * 100
                return (
                  <div key={dim} className="flex items-center gap-3">
                    <span className="w-8 text-xs font-bold text-gray-500 text-right">{dimLabels[dim]}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full relative overflow-hidden">
                      {/* 用户得分条 */}
                      <motion.div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{ backgroundColor: teamColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                      />
                      {/* 类型理想值标记 */}
                      <div
                        className="absolute top-0 h-full w-1 bg-gray-800"
                        style={{ left: `${typePct}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <span className="w-10 text-xs font-mono font-bold text-gray-700 text-left">
                      {val > 0 ? '+' : ''}{val.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-4 leading-relaxed font-medium">
              黑线标记为你所属人格的理想坐标，色条为你的实际得分
            </p>
          </motion.div>
        )}

        {/* 雷达图 */}
        {normalized && (
          <motion.div variants={item} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 flex flex-col items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">人格雷达图</h3>
            <RadarChart normalized={normalized} type={type} teamColor={teamColor} />
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }} />
                <span className="text-[10px] text-gray-500 font-medium">你的得分</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-gray-300 border-dashed" />
                <span className="text-[10px] text-gray-500 font-medium">人格理想值</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 描述 */}
        <motion.div variants={item} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm mb-6">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {type.description}
          </p>
        </motion.div>

        {/* 标签 */}
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 mb-8">
          {type.tags.map(tag => (
            <span key={tag}
              className="px-4 py-1.5 text-xs rounded-full border text-gray-600 transition hover:bg-gray-50"
              style={{ backgroundColor: teamColor + '08', borderColor: teamColor + '30', color: teamColor }}>
              {tag}
            </span>
          ))}
        </motion.div>

        {/* CP 关系 */}
        {bestCP && worstCP && (
          <motion.div variants={item} className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-center">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">最佳 CP</span>
              <p className="text-sm font-bold mt-2 text-gray-900">{bestCP.name}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">"{bestCP.tagline}"</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-center">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full">最对立</span>
              <p className="text-sm font-bold mt-2 text-gray-900">{worstCP.name}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">"{worstCP.tagline}"</p>
            </div>
          </motion.div>
        )}

        {/* 次优匹配卡片 */}
        {runnerUp && (
          <motion.div variants={item} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">你也有可能是</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">备选人格</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black" style={{ color: teamColor }}>{runnerUp.code}</span>
              <div>
                <p className="text-base font-bold text-gray-900">{runnerUp.name}</p>
                <p className="text-xs text-gray-500 font-medium">"{runnerUp.tagline}"</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 全网统计卡片 */}
        {stats && stats.total > 0 && (
          <motion.div variants={item} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">全网统计</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <motion.span
                className="text-4xl font-black"
                style={{ color: teamColor }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
              >
                {stats.types[code]?.percentage ?? 0}%
              </motion.span>
              <span className="text-sm text-gray-500 font-medium">的人和你一样</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: teamColor }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(stats.types[code]?.percentage ?? 0, 2)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-3 font-medium">
              已有 {stats.total.toLocaleString()} 人完成测试
            </p>
          </motion.div>
        )}

        {/* 操作按钮保留在底部作为备用 */}
        <div className="h-24"></div> {/* 为底部固定栏留白 */}
      </motion.div>

      {/* 悬浮底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPoster(true)}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-white rounded-2xl shadow-lg transition"
            style={{ backgroundColor: teamColor }}
          >
            <Share2 className="w-5 h-5" />
            一键生成并保存图片
          </motion.button>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/quiz')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-gray-700 bg-white border border-gray-200 shadow-sm rounded-2xl hover:bg-gray-50 transition"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-gray-500 bg-gray-50 rounded-2xl hover:bg-gray-100 transition"
            >
              <Home className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] pointer-events-none z-0">
        Premier League Type Indicator
      </div>
    </div>
  )
}

export default Result
