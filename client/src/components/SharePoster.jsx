import { forwardRef, useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { teamNames } from '../data/types'
import QRCode from 'qrcode'

const dimLabels = { T: '死忠', E: '激情', S: '社交', K: '懂球', R: '韧性' }
const dimOrder = ['T', 'E', 'S', 'K', 'R']

// 测试入口 URL（部署后 VITE_APP_URL 环境变量会自动填充）
const QUIZ_URL = (import.meta.env.VITE_APP_URL || window.location.origin) + '/quiz'

const SharePoster = forwardRef(({ type, normalized, teamColor, percentage, total, onClose }, ref) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(QUIZ_URL, {
      width: 120,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {})
  }, [])

  const handleDownload = useCallback(async () => {
    const target = ref?.current
    if (!target) return
    setIsCapturing(true)
    const html2canvas = (await import('html2canvas')).default
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        onclone: (doc) => {
          // 在克隆文档中移除 backdrop-filter，确保 html2canvas 渲染正确
          const clonedEl = doc.querySelector('[data-poster]')
          if (clonedEl) {
            clonedEl.style.backdropFilter = 'none'
          }
        },
      })
      const link = document.createElement('a')
      link.download = `英超TI_${type.code}_${type.name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setIsCapturing(false)
    }
  }, [ref, type])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm"
      >
        {/* 关闭按钮 */}
        <div className="flex justify-end mb-3">
          <button onClick={onClose} className="p-2 rounded-full glass hover:bg-white/10 transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* 海报主体 */}
        <div
          ref={ref}
          data-poster="true"
          className="bg-white rounded-3xl overflow-hidden"
          style={{ border: `1px solid ${teamColor}30`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
        >
          {/* 顶部色带 */}
          <div className="h-3" style={{ backgroundColor: teamColor }} />

          <div className="p-8 pb-10">
            {/* 品牌 */}
            <div className="text-center mb-6">
              <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">Premier League Type Indicator</p>
              <h2 className="text-3xl font-black tracking-tighter flex items-center justify-center gap-1">
                <span style={{ color: '#38003C' }}>英超</span>
                <span style={{ color: '#E90052' }}>TI</span>
              </h2>
            </div>

            {/* 类型码 */}
            <div className="flex justify-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-mono font-bold tracking-wider"
                style={{ color: teamColor }}>
                {type.code}
              </span>
              {type.team !== 'GEN' && (
                <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs text-gray-500 font-medium">
                  {teamNames[type.team]}
                </span>
              )}
            </div>

            {/* 人格名称 */}
            <h1 className="text-5xl font-black text-center mb-1 tracking-tight text-gray-900 break-words">
              {type.name}
            </h1>

            {/* 插图预留区 */}
            <div className="flex justify-center mb-4 mt-2">
              <div className="w-40 h-40 bg-white border border-gray-100 shadow-sm rounded-[1.5rem] flex items-center justify-center relative overflow-hidden">
                 <img src={`/images/${type.code}.png`} alt={type.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
            </div>

            {/* Tagline */}
            <p className="text-sm text-gray-500 text-center font-medium mb-6 leading-relaxed">
              "{type.tagline}"
            </p>

            {/* 五维分数条 */}
            {normalized && (
              <div className="space-y-2 mb-6 px-2">
                {dimOrder.map(dim => {
                  const val = normalized[dim] || 0
                  const pct = ((val + 5) / 10) * 100
                  return (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="w-7 text-[10px] font-bold text-gray-400 text-right">{dimLabels[dim]}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: teamColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 描述摘要 */}
            <p className="text-[11px] text-gray-500 text-center leading-relaxed mb-5 px-2 font-medium">
              {type.description.slice(0, 120)}...
            </p>

            {/* 全网统计 */}
            {percentage > 0 && (
              <div className="flex justify-center mb-5">
                <div className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 flex items-center gap-2 shadow-sm">
                  <span className="text-[10px] text-gray-500 font-medium">全网有</span>
                  <span className="text-sm font-black" style={{ color: teamColor }}>{percentage}%</span>
                  <span className="text-[10px] text-gray-500 font-medium">的人和你一样</span>
                </div>
              </div>
            )}

            {/* 标签 */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-8">
              {type.tags.map(tag => (
                <span key={tag} className="px-3 py-1 text-[10px] rounded-full border border-gray-200 text-gray-500 bg-gray-50 font-medium">
                  {tag}
                </span>
              ))}
            </div>

            {/* 底部：二维码 + 文字 */}
            <div className="flex items-center gap-4 mt-2 pt-4 border-t border-gray-100">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="扫码测试" className="w-16 h-16 rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-black text-gray-800 leading-tight mb-1">扫码测测你的球迷人格</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">Premier League Type Indicator</p>
                <p className="text-[10px] font-mono text-gray-400">{QUIZ_URL.replace('https://', '')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 下载按钮 */}
        <div className="flex justify-center mt-4">
          <motion.button
            whileHover={isCapturing ? {} : { scale: 1.04 }}
            whileTap={isCapturing ? {} : { scale: 0.96 }}
            onClick={handleDownload}
            disabled={isCapturing}
            className="flex items-center gap-2 px-8 py-3 font-bold text-white rounded-full shadow-md transition disabled:opacity-70"
            style={{ backgroundColor: teamColor }}
          >
            <Download className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
            {isCapturing ? '生成中...' : '保存海报'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
})

SharePoster.displayName = 'SharePoster'
export default SharePoster
