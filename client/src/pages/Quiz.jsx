import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { questions } from '../data/questions'
import { calculateResult } from '../engine/scoring'
import { questionContexts } from '../data/question-context'
import { useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const TOTAL = questions.length

const Quiz = () => {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [highestIndex, setHighestIndex] = useState(0) // 追踪最高进度，防止回退时进度条倒流
  const [answers, setAnswers] = useState(Array(TOTAL).fill(null))
  const [direction, setDirection] = useState(1) // 1=前进, -1=后退
  const [seasonCtx, setSeasonCtx] = useState(null)

  // 拉取赛季上下文
  useEffect(() => {
    fetch(`${API_BASE}/api/season-context`)
      .then(res => res.json())
      .then(data => setSeasonCtx(data))
      .catch(err => console.error('Season Context load failed:', err))
  }, [])

  const currentQ = questions[index]
  const selected = answers[index]
  // 进度基于最高已到达位置，而非当前位置
  const progress = ((Math.max(highestIndex, index) + (selected !== null ? 1 : 0)) / TOTAL) * 100

  const handleSelect = useCallback((optIdx) => {
    // 计算生效的答案数组：新选择则更新对应位置，重选则保持原样
    const effectiveAnswers = selected === optIdx
      ? answers
      : (() => { const next = [...answers]; next[index] = optIdx; return next })()

    if (selected !== optIdx) {
      setAnswers(effectiveAnswers)
    }

    const delay = selected === optIdx ? 250 : 400

    setTimeout(() => {
      if (index === TOTAL - 1 && effectiveAnswers.every(a => a !== null)) {
        submitQuiz(effectiveAnswers)
      } else if (index < TOTAL - 1) {
        setDirection(1)
        if (selected !== optIdx) {
          setHighestIndex(prev => Math.max(prev, index + 1))
        }
        setIndex(prev => prev + 1)
      }
    }, delay)
  }, [index, answers, selected, navigate])

  const submitQuiz = async (finalAnsArray) => {
    const finalAnswers = finalAnsArray.map((opt, i) => ({ questionId: i + 1, optionIndex: opt }))
    const result = calculateResult(finalAnswers)
    
    sessionStorage.setItem('quizResult', JSON.stringify({
      type: result.type,
      runnerUp: result.runnerUp,
      normalized: result.normalized,
      rawScores: result.rawScores,
      detectedTeam: result.detectedTeam,
      answers: finalAnswers,
    }))

    try {
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_BASE}/api/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_code: result.type.code,
          runner_up: result.runnerUp?.code || null,
          detected_team: result.detectedTeam,
          answers: finalAnswers,
          normalized: result.normalized,
          gameweek: seasonCtx?.gameweek || 0
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          navigate(`/result/${result.type.code}?id=${data.id}`)
          return
        }
      }
    } catch (e) {
      console.error('Failed to submit result', e)
    }

    const encoded = btoa(JSON.stringify(finalAnswers))
    navigate(`/result/${result.type.code}?ans=${encoded}`)
  }

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
              {seasonCtx && questionContexts[currentQ.id] && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl mb-4 font-bold border border-emerald-100 shadow-sm whitespace-pre-wrap"
                >
                  {questionContexts[currentQ.id](seasonCtx)}
                </motion.p>
              )}
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
                    className={`w-full text-left p-5 min-h-[3.5rem] rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm text-emerald-900 font-medium'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm text-gray-700'
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
