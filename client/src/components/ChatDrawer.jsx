import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, MessageSquare, Loader2, User, Bot } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const ChatDrawer = ({ isOpen, onClose, type, normalized, detectedTeam }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).slice(2, 11)}`)
  const scrollRef = useRef(null)

  // 初始欢迎语
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: `你好啊，这位${type.name}！我看你 T 维度得分不低啊，果然是主队的死忠。最近这几场球看得还顺心吗？想聊聊哪支队？` 
        }
      ])
    }
  }, [type.name])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    // 添加一个空的助手消息占位
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          type_code: type.code,
          normalized,
          detected_team: detectedTeam,
          sessionId,
          stream: true // 开启流式
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
        
        // 解析 OpenAI 格式的 SSE 数据
        const lines = chunkValue.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') break
            try {
              const data = JSON.parse(dataStr)
              const content = data.choices[0]?.delta?.content || ''
              fullContent += content
              
              // 更新最后一条消息内容
              setMessages(prev => {
                const newMsgs = [...prev]
                newMsgs[newMsgs.length - 1].content = fullContent
                return newMsgs
              })
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1].content = '网络不太稳，可能是信号被曼城的中场拦截了。'
        return newMsgs
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* 抽屉容器 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-[2.5rem] shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            {/* 顶部栏 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">和 AI 球迷分析师聊聊</h3>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Persona: {type.code} Analyst</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 消息区域 */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                        : 'bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
                      <Bot className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">正在构思吐槽...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-gray-50/50">
              <div className="max-w-xl mx-auto relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="说点什么... (例如: 你怎么看我主队最近的表现?)"
                  className="w-full pl-6 pr-14 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 transition transition-all active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ChatDrawer
