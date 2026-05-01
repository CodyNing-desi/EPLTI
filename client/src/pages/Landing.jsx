import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Share2, Target } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 足球场中圈与中线背景水印 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none z-0">
        <svg width="800" height="800" viewBox="0 0 100 100" className="text-gray-900">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="1" fill="currentColor" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center z-10"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium tracking-wider uppercase text-gray-500">
            2025/26 赛季深度球迷人格测试
          </span>
        </div>

        <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tighter flex items-center justify-center gap-2">
          {/* 使用英超标志性紫红色 */}
          <span style={{ color: '#38003C' }} className="drop-shadow-sm">英超</span>
          <span style={{ color: '#E90052' }}>TI</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-lg mx-auto font-medium">
          挖掘你看球时的真实心理动机。<br />
          是死忠、懂球帝，还是纯粹的乐子人？<br />
          <span className="text-gray-900 font-bold mt-2 block">18 道题，看透你的看球底色。</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 text-left">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start space-x-4">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">专业分析</h3>
              <p className="text-xs text-gray-500 mt-1">基于 T-E-S-K-R 五大心理维度</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start space-x-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">专属结果</h3>
              <p className="text-xs text-gray-500 mt-1">14 种球迷人格，精准命中内心</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/quiz')}
          className="group relative inline-flex items-center justify-center px-14 py-4 font-black text-white text-lg transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-xl hover:shadow-2xl overflow-hidden"
          style={{ backgroundColor: '#38003C' }}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          开始测试
          <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <div className="mt-16 flex items-center justify-center space-x-8 text-gray-400">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-800">18</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">精选题目</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-800">14</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">人格类型</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-800">99%</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">球迷共鸣</span>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 uppercase tracking-[0.2em] pointer-events-none font-medium">
        Powered by Premier League Insight Engine
      </div>
    </div>
  );
};

export default Landing;
