import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart2, TrendingUp, Users, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const teamNames = {
  ARS: '阿森纳', MUN: '曼联', LFC: '利物浦',
  MCI: '曼城', CHE: '切尔西', TOT: '热刺',
};

const teamColors = {
  ARS: '#EF0107', MUN: '#DA291C', LFC: '#C8102E',
  MCI: '#6CABDD', CHE: '#034694', TOT: '#132257',
};

const dimLabels = { T: '死忠', E: '激情', S: '社交', K: '懂球', R: '韧性' };

const SeasonInsights = () => {
  const navigate = useNavigate();
  const [moodData, setMoodData] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('ARS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/season-mood?team=${selectedTeam}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setMoodData(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedTeam]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 px-6 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest">Season Mood Index</h1>
        <div className="w-10" />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-xl mx-auto px-6 py-8"
      >
        <motion.div variants={item} className="mb-8">
          <h2 className="text-3xl font-black mb-2 tracking-tight">赛季情绪大盘</h2>
          <p className="text-sm text-gray-500 font-medium">基于全网 {moodData.reduce((acc, curr) => acc + curr.sample_size, 0).toLocaleString()} 份测试样本实时聚合</p>
        </motion.div>

        {/* 球队选择器 */}
        <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
          {Object.keys(teamNames).map(code => (
            <button
              key={code}
              onClick={() => setSelectedTeam(code)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border-2 ${
                selectedTeam === code 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
              }`}
            >
              {teamNames[code]}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-300">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">计算中...</p>
          </div>
        ) : moodData.length > 0 ? (
          <div className="space-y-6">
            {/* 核心指标卡片 */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">当前韧性指数 (R)</span>
                </div>
                <p className="text-3xl font-black italic" style={{ color: teamColors[selectedTeam] }}>
                  {Number(moodData[moodData.length - 1].avg_r).toFixed(2)}
                </p>
              </div>
              <div className="p-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">激情热度 (E)</span>
                </div>
                <p className="text-3xl font-black italic" style={{ color: teamColors[selectedTeam] }}>
                  {Number(moodData[moodData.length - 1].avg_e).toFixed(2)}
                </p>
              </div>
            </motion.div>

            {/* 维度详情大盘 */}
            <motion.div variants={item} className="p-6 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-300" />
                  第 {moodData[moodData.length - 1].gameweek} 轮 维度均值
                </h3>
              </div>
              
              <div className="space-y-5">
                {Object.keys(dimLabels).map(dim => {
                  const key = `avg_${dim.toLowerCase()}`;
                  const val = Number(moodData[moodData.length - 1][key]);
                  const pct = ((val + 5) / 10) * 100;
                  return (
                    <div key={dim} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-gray-400">{dimLabels[dim]}</span>
                        <span className="text-gray-900">{val > 0 ? '+' : ''}{val.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: teamColors[selectedTeam] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 提示信息 */}
            <motion.div variants={item} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-[11px] text-indigo-900/60 leading-relaxed font-medium">
                <span className="font-bold text-indigo-900">数据说明：</span>
                情绪指数是该球队球迷在当前赛周下的真实心理映射。R 值越高代表球迷心态越稳健，E 值越高代表情绪波动越大。
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-400 font-medium italic">本赛周暂无 {teamNames[selectedTeam]} 球迷的测试样本</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SeasonInsights;
