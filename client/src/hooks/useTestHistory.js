import { useState, useEffect } from 'react';

const STORAGE_KEY = 'eplti_test_history';
const MAX_HISTORY = 5;

/**
 * 本地测试历史记录 Hook (localStorage 版)
 * 用于实现“赛季心电图”的基础数据存储
 */
export function useTestHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {
        console.error('Failed to parse test history:', e);
      }
    }
  }, []);

  const addHistory = (result) => {
    // result 结构: { code, name, normalized, gameweek, team }
    setHistory(prev => {
      // 避免同一 gameweek 重复记录（或者以最新的为准）
      const filtered = prev.filter(h => h.gameweek !== result.gameweek || h.code !== result.code);
      const newHistory = [
        { ...result, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_HISTORY);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  return { history, addHistory, clearHistory };
}
