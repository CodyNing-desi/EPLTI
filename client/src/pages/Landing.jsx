import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Share2, Target, Users } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Landing = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [seasonCtx, setSeasonCtx] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/season-context`)
      .then(res => res.json())
      .then(data => setSeasonCtx(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.total) setTotalUsers(data.total);
        setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-start p-6 relative overflow-x-hidden pt-12 pb-24">
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
        className="max-w-2xl w-full text-center z-10 flex flex-col items-center"
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
          <span style={{ color: '#38003C' }} className="drop-shadow-sm">英超</span>
          <span style={{ color: '#E90052' }}>TI</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-lg mx-auto font-medium">
          {seasonCtx ? (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-emerald-600 font-bold block mb-2 text-base"
            >
              📺 实时：{seasonCtx.narrative}
            </motion.span>
          ) : (
            <>挖掘你看球时的真实心理动机。<br /></>
          )}
          是死忠、懂球帝，还是纯粹的乐子人？<br />
          <span className="text-gray-900 font-bold mt-2 block">18 道题，看透你的看球底色。</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 text-left w-full">
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
          className="group relative inline-flex items-center justify-center px-14 py-4 font-black text-white text-lg transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-xl hover:shadow-2xl overflow-hidden mb-12"
          style={{ backgroundColor: '#38003C' }}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          开始测试
          <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* 赛季仪表盘 */}
        <SeasonDashboard ctx={seasonCtx} />

        {/* 实时测验动态 */}
        <RecentActivity stats={stats} />

        <div className="mt-16 flex items-center justify-center space-x-6 sm:space-x-8 text-gray-400 w-full">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-800">18</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">精选题目</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-800">14</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">人格类型</span>
          </div>
          {totalUsers > 0 && (
            <>
              <div className="h-8 w-[1px] bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black" style={{ color: '#E90052' }}>
                  {totalUsers.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase tracking-widest mt-1 font-bold text-gray-600">人已完成测验</span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <div className="mt-12 text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] pointer-events-none text-center">
        Powered by Premier League Insight Engine
      </div>
    </div>
  );
};

// 赛季仪表盘组件
const SeasonDashboard = ({ ctx }) => {
  if (!ctx) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] text-left relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
        <Trophy size={80} />
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Live Season Context</h3>
          <p className="text-lg font-bold text-gray-900">第 {ctx.gameweek} 轮 · {ctx.season}</p>
        </div>
        <button 
          onClick={() => navigate('/insights')}
          className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition"
        >
          View Full Index
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {ctx.standings.slice(0, 3).map((s, i) => (
          <div key={s.team} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className="w-5 text-xs font-black text-gray-300">{s.pos}</span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{s.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.points / 90) * 100}%` }}
                  className="h-full bg-gray-900"
                />
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 w-8 text-right">{s.points} pts</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
        <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
          “ {ctx.narrative} ”
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ctx.hot_topics.slice(0, 2).map(t => (
          <span key={t} className="px-3 py-1 rounded-lg bg-white border border-gray-100 text-[10px] text-gray-400 font-medium shadow-sm">
            # {t.split('，')[0]}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

// 近期测验动态组件
const RecentActivity = ({ stats }) => {
  // 静态示例混排
  const staticExamples = [
    { team: '阿森纳', type: '冠压抑 (HOLD)', r: -4.2, time: '刚刚' },
    { team: '利物浦', type: '重金属 (M)', r: 3.8, time: '2分钟前' },
    { team: '曼联', type: '老派狂魔 (SAF)', r: -2.1, time: '5分钟前' },
    { team: '切尔西', type: '乐子人 (LOL)', r: 1.5, time: '12分钟前' },
  ];

  return (
    <div className="w-full max-w-xl mt-8">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Live Test Feed</h3>
      <div className="space-y-3">
        {staticExamples.map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-100 shadow-sm text-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-gray-600 text-xs md:text-sm">
                一位<span className="font-bold text-gray-900 mx-1">{item.team}</span>球迷被测出
              </span>
              <span className="font-black text-[#E90052] text-xs md:text-sm">{item.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold ${item.r > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R: {item.r > 0 ? '+' : ''}{item.r}
              </span>
              <span className="text-[10px] text-gray-400 w-12 text-right hidden sm:block">{item.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
