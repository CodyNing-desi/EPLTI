import React, { useEffect, useState, useRef, useCallback } from 'react'
import { types, teamNames } from '../data/types'
import QRCode from 'qrcode'

const QUIZ_URL = import.meta.env.VITE_APP_URL || window.location.origin
const dimLabels = { T: '死忠', E: '激情', S: '社交', K: '懂球', R: '韧性' }
const dimOrder = ['T', 'E', 'S', 'K', 'R']
const teamColorMap = {
  ARS: '#EF0107', MUN: '#DA291C', LFC: '#C8102E',
  MCI: '#6CABDD', CHE: '#034694', TOT: '#132257',
}

/**
 * 单张海报渲染器
 * 核心改动：用一个 readyCount 来追踪「二维码 + 插画」是否都加载完毕，
 * 全部就绪后才触发 html2canvas 截图。
 */
const SinglePoster = ({ type, onComplete }) => {
  const posterRef = useRef(null)
  const [readyCount, setReadyCount] = useState(0) // 需要 2：qr + img
  const [qrDataUrl, setQrDataUrl] = useState('')
  const hasStarted = useRef(false)
  const teamColor = teamColorMap[type.team] || '#E90052'
  const normalized = type.ideal

  // 1) 生成二维码
  useEffect(() => {
    QRCode.toDataURL(QUIZ_URL, {
      width: 120, margin: 1, color: { dark: '#111111', light: '#ffffff' },
    }).then(url => {
      setQrDataUrl(url)
      setReadyCount(c => c + 1)
    }).catch(() => {
      setReadyCount(c => c + 1)
    })
  }, [])

  // 2) 当所有资源就绪 (readyCount >= 2)，开始截图
  useEffect(() => {
    if (readyCount < 2) return
    if (hasStarted.current) return
    hasStarted.current = true

    const doCapture = async () => {
      // 额外等 300ms 让浏览器完成最终渲染
      await new Promise(r => setTimeout(r, 300))

      const html2canvas = (await import('html2canvas')).default
      try {
        const canvas = await html2canvas(posterRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
        })
        onComplete(type.code, canvas.toDataURL('image/png'))
      } catch (e) {
        console.error('Export failed for', type.code, e)
        onComplete(type.code, null)
      }
    }
    doCapture()
  }, [readyCount]) // 每次 readyCount 变化都检查

  const handleImgReady = useCallback(() => {
    setReadyCount(c => c + 1)
  }, [])

  return (
    <div
      ref={posterRef}
      data-poster="true"
      className="bg-white overflow-hidden w-[375px]"
      style={{ border: `1px solid ${teamColor}30` }}
    >
      <div className="h-3" style={{ backgroundColor: teamColor }} />
      <div className="p-8 pb-10">
        <div className="text-center mb-6">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">Premier League Type Indicator</p>
          <h2 className="text-3xl font-black tracking-tighter flex items-center justify-center gap-1">
            <span style={{ color: '#38003C' }}>英超</span>
            <span style={{ color: '#E90052' }}>TI</span>
          </h2>
        </div>

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

        <div className="relative text-center mb-6 mt-2">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-black opacity-[0.04] pointer-events-none uppercase tracking-tighter w-full whitespace-nowrap"
            style={{ color: teamColor }}
          >
            {type.code}
          </div>
          <div className="relative z-10">
            <p className="text-sm font-black tracking-widest uppercase mb-1.5" style={{ color: teamColor }}>
              {type.code}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 break-words leading-tight px-2">
              {type.name}
            </h1>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-44 h-44 bg-gray-50/50 rounded-full flex items-center justify-center relative overflow-hidden">
            <img
              src={`/images/${type.code}.png`}
              alt={type.name}
              className="w-[110%] h-[110%] object-contain mix-blend-multiply drop-shadow-sm"
              onLoad={handleImgReady}
              onError={handleImgReady}
            />
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center font-medium mb-6 leading-relaxed">
          "{type.tagline}"
        </p>

        <div className="space-y-2 mb-6 px-2">
          {dimOrder.map(dim => {
            const val = normalized[dim] || 0
            const pct = ((val + 5) / 10) * 100
            return (
              <div key={dim} className="flex items-center gap-2">
                <span className="w-7 text-[10px] font-bold text-gray-400 text-right">{dimLabels[dim]}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: teamColor }} />
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-gray-500 text-center leading-relaxed mb-5 px-2 font-medium">
          {type.description.slice(0, 120)}...
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          {type.tags.map(tag => (
            <span key={tag} className="px-3 py-1 text-[10px] rounded-full border border-gray-200 text-gray-500 bg-gray-50 font-medium">
              {tag}
            </span>
          ))}
        </div>

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
  )
}

/**
 * 批量导出控制器
 * 用 key={activeCode} 强制每次切换时完全销毁/重建 SinglePoster，
 * 确保所有状态都是干净的。
 */
const ExportAll = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([]) // {code, dataUrl}[]
  const done = currentIndex >= types.length

  const handleComplete = useCallback((code, dataUrl) => {
    setResults(prev => [...prev, { code, dataUrl }])
    // 延迟切到下一个，给浏览器喘口气
    setTimeout(() => {
      setCurrentIndex(i => i + 1)
    }, 500)
  }, [])

  const handleDownloadAll = useCallback(() => {
    results.forEach(({ code, dataUrl }, i) => {
      if (!dataUrl) return
      setTimeout(() => {
        const link = document.createElement('a')
        link.download = `EPLTI_${code}.png`
        link.href = dataUrl
        link.click()
      }, i * 300) // 每隔 300ms 下载一个，防止浏览器拦截
    })
  }, [results])

  const handleDownloadOne = useCallback((code, dataUrl) => {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `EPLTI_${code}.png`
    link.href = dataUrl
    link.click()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center border border-gray-100 mt-10">
        <h1 className="text-2xl font-black mb-2 text-gray-900">🖨️ 批量海报导出机</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">宣传物料专用生成通道</p>

        <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden relative">
          <div
            className="bg-emerald-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentIndex / types.length) * 100}%` }}
          />
        </div>

        <p className="text-3xl font-black text-gray-800 mb-2">
          {Math.min(currentIndex, types.length)} <span className="text-lg text-gray-400">/ {types.length}</span>
        </p>

        {done ? (
          <div className="mt-4">
            <p className="text-emerald-500 font-bold flex items-center justify-center gap-2 mb-4">
              ✅ 14张海报已全部生成完毕！
            </p>
            <button
              onClick={handleDownloadAll}
              className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-full shadow-md hover:bg-emerald-600 transition active:scale-95"
            >
              📥 一键全部下载
            </button>
          </div>
        ) : (
          <p className="text-blue-500 font-bold mt-4 flex items-center justify-center gap-2 animate-pulse">
            ⏳ 正在生成 {types[currentIndex]?.name} ({types[currentIndex]?.code}) ...
          </p>
        )}
      </div>

      {/* 已完成的海报缩略图列表 */}
      {results.length > 0 && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">已生成的海报</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results.map(({ code, dataUrl }) => (
              <div key={code} className="flex flex-col items-center">
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt={code}
                    className="w-full rounded-xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition"
                    onClick={() => handleDownloadOne(code, dataUrl)}
                  />
                ) : (
                  <div className="w-full aspect-[3/5] bg-red-50 rounded-xl flex items-center justify-center text-red-400 text-xs">失败</div>
                )}
                <p className="text-xs font-bold text-gray-600 mt-2">{code}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 隐藏渲染区 - key 强制重建组件 */}
      <div className="fixed top-0 left-[-9999px]">
        {!done && (
          <SinglePoster
            key={types[currentIndex].code}
            type={types[currentIndex]}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  )
}

export default ExportAll
