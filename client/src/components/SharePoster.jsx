import { useRef, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Loader2 } from 'lucide-react'
import { teamNames } from '../data/types'
import QRCode from 'qrcode'

const dimLabels = { T: '死忠', E: '激情', S: '社交', K: '懂球', R: '韧性' }
const dimOrder = ['T', 'E', 'S', 'K', 'R']

// 测试入口 URL（指向首页而不是 /quiz，增加首页参与感）
const QUIZ_URL = import.meta.env.VITE_APP_URL || window.location.origin

const SharePoster = ({ type, normalized, teamColor, percentage, total, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [finalImage, setFinalImage] = useState(null)
  const posterRef = useRef(null)

  useEffect(() => {
    QRCode.toDataURL(QUIZ_URL, {
      width: 120,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {})
  }, [])

  useEffect(() => {
    // 只有当二维码生成后，才开始截屏
    if (!qrDataUrl || !posterRef.current) return

    let mounted = true
    const generateImage = async () => {
      // 稍微延迟一下，确保所有字体和图片都已渲染
      await new Promise(r => setTimeout(r, 500))
      if (!mounted) return

      const html2canvas = (await import('html2canvas')).default
      try {
        const canvas = await html2canvas(posterRef.current, {
          backgroundColor: '#ffffff',
          scale: 2, // 高清
          useCORS: true,
          logging: false,
          onclone: (doc) => {
            const clonedEl = doc.querySelector('[data-poster]')
            if (clonedEl) clonedEl.style.backdropFilter = 'none'
          },
        })
        if (mounted) {
          setFinalImage(canvas.toDataURL('image/png'))
          setIsCapturing(false)
        }
      } catch (err) {
        console.error('Failed to generate poster', err)
        if (mounted) setIsCapturing(false)
      }
    }

    generateImage()
    return () => { mounted = false }
  }, [qrDataUrl])

  const handleDownload = useCallback(() => {
    if (!finalImage) return
    const link = document.createElement('a')
    link.download = `英超TI_${type.code}_${type.name}.png`
    link.href = finalImage
    link.click()
  }, [finalImage, type])

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden">
      
      {/* 顶部关闭按钮（固定） */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={onClose} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 滚动容器 */}
      <div className="relative w-full h-full max-w-sm overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col items-center justify-start pt-16 pb-20 px-4">
        <AnimatePresence mode="wait">
          {isCapturing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] text-white/80"
            >
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-white" style={{ color: teamColor }} />
              <p className="text-sm font-medium tracking-widest">正在为您生成专属高清海报...</p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full flex flex-col items-center"
            >
              <img 
                src={finalImage} 
                alt="Share Poster" 
                className="w-full h-auto rounded-3xl shadow-2xl" 
                style={{ border: `1px solid ${teamColor}30` }}
              />
              <p className="mt-6 text-white/60 text-sm font-medium tracking-widest flex items-center gap-2">
                👇 长按图片保存到手机相册
              </p>
              
              {/* 保留一个点击下载按钮作为电脑端备份 */}
              <button
                onClick={handleDownload}
                className="mt-6 flex items-center gap-2 px-8 py-3.5 font-bold text-white rounded-full shadow-lg transition active:scale-95"
                style={{ backgroundColor: teamColor }}
              >
                <Download className="w-4 h-4" />
                下载原图
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 隐藏的真实 DOM 渲染区，用于 html2canvas 抓取。必须渲染但不能让用户看到 */}
      <div className="fixed top-0 left-[-9999px]">
        <div
          ref={posterRef}
          data-poster="true"
          className="bg-white overflow-hidden w-[375px]"
          style={{ border: `1px solid ${teamColor}30` }}
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

            {/* 徽章 */}
            <div className="flex justify-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Personality Type
              </span>
              {type.team !== 'GEN' && (
                <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 tracking-widest">
                  {teamNames[type.team]}
                </span>
              )}
            </div>

            {/* 人格名称与英文代号 Lockup */}
            <div className="relative text-center mb-6 mt-2">
              {/* 背景巨大的英文代号水印 */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-black opacity-[0.04] pointer-events-none uppercase tracking-tighter w-full whitespace-nowrap"
                style={{ color: teamColor }}
              >
                {type.code}
              </div>
              
              {/* 前景中英文 */}
              <div className="relative z-10">
                <p className="text-sm font-black tracking-widest uppercase mb-1.5" style={{ color: teamColor }}>
                  {type.code}
                </p>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 break-words leading-tight px-2">
                  {type.name}
                </h1>
              </div>
            </div>

            {/* 插图预留区 */}
            <div className="flex justify-center mb-6">
              <div className="w-44 h-44 bg-gray-50/50 rounded-full flex items-center justify-center relative overflow-hidden">
                 <img 
                   src={`/images/${type.code}.png`} 
                   alt={type.name} 
                   className="w-[110%] h-[110%] object-contain mix-blend-multiply drop-shadow-sm" 
                 />
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
      </div>
    </div>
  )
}

export default SharePoster
