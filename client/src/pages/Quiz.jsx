import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { questions } from '../data/questions.js'
import { calculateResult } from '../engine/scoring.js'

const TOTAL = questions.length

const Quiz = () => {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [highestIndex, setHighestIndex] = useState(0) // 追踪最高进度，防止回退时进度条倒流
  const [answers, setAnswers] = useState(Array(TOTAL).fill(null))
  const [direction, setDirection] = useState(1) // 1=前进, -1=后退

  const currentQ = questions[index]
  const selected = answers[index]
  // 进度基于最高已到达位置，而非当前位置
  const progress = ((Math.max(highestIndex, index) + (selected !== null ? 1 : 0)) / TOTAL) * 100

  const handleSelect = useCallback((optIdx) => {
    if (selected !== null) return
    const next = [...answers]
    next[index] = optIdx
    setAnswers(next)

    // 最后一题选完直接结算
    if (index === TOTAL - 1) {
      const finalAnswers = next.map((opt, i) => ({ questionId: i + 1, optionIndex: opt }))
      const result = calculateResult(finalAnswers)
      const encoded = btoa(JSON.stringify(finalAnswers))
      sessionStorage.setItem('quizResult', JSON.stringify({
        type: result.type,
        runnerUp: result.runnerUp,
        normalized: result.normalized,
        rawScores: result.rawScores,
        detectedTeam: result.detectedTeam,
        answers: finalAnswers,
      }))
      setTimeout(() => navigate(`/result/${result.type.code}?ans=${encoded}`), 400)
    } else {
      setDirection(1)
      setHighestIndex(prev => Math.max(prev, index + 1))
      setTimeout(() => setIndex(prev => prev + 1), 400)
    }
  }, [index, answers, selected, navigate])

  const goBack = () => {
    if (index === 0) return
    setDirection(-1)
    setIndex(prev => prev - 1)
  }

  const goForward = () => {
    if (index === TOTAL - 1 || selected === null) return
    setDirection(1)
    const next = index + 1
    setIndex(next)
    if (next > highestIndex) setHighestIndex(next)
  }

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* 进度条 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
        <div className="flex items-center justify-between px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
          <button
            onClick={goBack}
            disabled={index === 0}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs font-semibold text-gray-500 tracking-wider">
            {index + 1} / {TOTAL}
          </span>
          <button
            onClick={goForward}
            disabled={index === TOTAL - 1 || selected === null}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="flex-1 flex items-center justify-center p-6 pt-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full max-w-xl"
          >
            {/* 题目文本 */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold leading-relaxed">
                {currentQ.text}
              </h2>
            </div>

            {/* 选项 */}
            <div className="space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selected === optIdx
                return (
                  <motion.button
                    key={optIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: optIdx * 0.08, duration: 0.35 }}
                    onClick={() => handleSelect(optIdx)}
                    disabled={selected !== null}
                    className={`w-full text-left p-5 min-h-[3.5rem] rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm text-emerald-900 font-medium'
                        : selected === null
                          ? 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm text-gray-700'
                          : 'bg-white border-gray-200 opacity-40 text-gray-700'
                    }`}
                  >
                    <span className="text-sm leading-relaxed">{opt.text}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部装饰 */}
      <div className="text-center pb-6 text-[10px] text-gray-400 uppercase tracking-[0.2em] pointer-events-none font-medium">
        {index + 1} / {TOTAL} · 用心作答，揭秘你的球迷人格
      </div>
    </div>
  )
}

export default Quiz
