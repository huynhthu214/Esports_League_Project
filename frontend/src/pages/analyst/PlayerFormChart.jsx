import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/StatCard';

const PlayerFormChart = () => {
  const [playerId, setPlayerId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mock dữ liệu hiển thị (Xóa đi khi gọi API thực tế)
      setTimeout(() => {
        setStats({ _id: playerId, avg_kills: 8.5, avg_deaths: 2.1, avg_assists: 9.4, avg_gold: 13500 });
        setLoading(false);
      }, 800);
      
      // Call API thật:
      const res = await axiosClient.get(`/analytics/players/${playerId}/form`);
      setStats(res.data);
    } catch (error) {
      alert('Lỗi khi lấy dữ liệu!');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase mb-8 drop-shadow-sm">
          📉 Phong Độ Tuyển Thủ (50 Trận)
        </h2>
        
        <form onSubmit={handleSearch} className="flex gap-4 mb-10 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
          <input 
            type="text" 
            placeholder="Nhập Player ID (VD: P001)..." 
            value={playerId} 
            onChange={e => setPlayerId(e.target.value)} 
            required 
            className="flex-1 bg-slate-950/80 border border-slate-700 text-cyan-300 rounded-lg px-5 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 font-semibold tracking-wider"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg px-8 py-3 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(8,145,178,0.4)] disabled:opacity-50 transition-all transform hover:scale-105"
          >
            {loading ? 'Đang Lọc...' : 'Phân Tích'}
          </button>
        </form>

        {stats && stats._id && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Kills (AVG)" value={stats.avg_kills.toFixed(2)} color="#e74c3c" />
            <StatCard title="Deaths (AVG)" value={stats.avg_deaths.toFixed(2)} color="#94a3b8" />
            <StatCard title="Assists (AVG)" value={stats.avg_assists.toFixed(2)} color="#10b981" />
            <StatCard title="Gold (AVG)" value={Math.round(stats.avg_gold).toLocaleString()} color="#f59e0b" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerFormChart;