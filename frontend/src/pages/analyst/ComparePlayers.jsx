import React, { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import axiosClient from '../../api/axiosClient';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const ComparePlayers = () => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mock dữ liệu hiển thị (Xóa đi khi gọi API thực tế)
      setTimeout(() => {
        setChartData({
          labels: ['Kills (AVG)', 'Assists (AVG)', 'Farm/GPM (x100)', 'Win Rate (%)', 'Survivability (10 - Deaths)'],
          datasets: [
            {
              label: `Tuyển thủ ${player1.toUpperCase() || '1'}`,
              data: [8.5, 9.4, 8.2, 65, 7.9], // GPM chia 100 để scale vừa biểu đồ Radar
              backgroundColor: 'rgba(34, 211, 238, 0.3)', // Cyan Neon mờ
              borderColor: 'rgba(34, 211, 238, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(34, 211, 238, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(34, 211, 238, 1)'
            },
            {
              label: `Tuyển thủ ${player2.toUpperCase() || '2'}`,
              data: [6.2, 11.1, 7.5, 55, 6.5],
              backgroundColor: 'rgba(244, 63, 94, 0.3)', // Rose/Red Neon mờ
              borderColor: 'rgba(244, 63, 94, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(244, 63, 94, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(244, 63, 94, 1)'
            }
          ]
        });
        setLoading(false);
      }, 800);

      // Call API thật (Sau này khi code backend xong):
      const res = await axiosClient.get(`/analytics/compare?p1=${player1}&p2=${player2}`);
      // // (Bạn cần parse dữ liệu JSON từ API trả về thành object cho chartData giống cấu trúc mock ở trên)
    } catch (error) {
      alert('Lỗi khi so sánh tuyển thủ!');
      setLoading(false);
    }
  };

  const chartOptions = {
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
        grid: { color: 'rgba(255, 255, 255, 0.15)' },
        pointLabels: { color: '#e2e8f0', font: { size: 13, weight: 'bold', family: 'sans-serif' } },
        ticks: { display: false, backdropColor: 'transparent' }
      }
    },
    plugins: {
      legend: { 
        position: 'bottom',
        labels: { color: '#f8fafc', font: { size: 14, weight: 'bold' }, padding: 25 } 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase mb-8 drop-shadow-sm">
          ⚖️ So Sánh Tuyển Thủ (Radar Chart)
        </h2>
        
        <form onSubmit={handleCompare} className="flex flex-wrap gap-4 mb-10 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
          <input 
            type="text" 
            placeholder="Tuyển thủ 1 (VD: P001)" 
            value={player1} 
            onChange={e => setPlayer1(e.target.value)} 
            required 
            className="flex-1 min-w-[200px] bg-slate-950/80 border border-slate-700 text-cyan-400 rounded-lg px-5 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-bold uppercase tracking-wider placeholder-slate-600"
          />
          <div className="flex items-center text-slate-500 font-black italic text-xl px-2">VS</div>
          <input 
            type="text" 
            placeholder="Tuyển thủ 2 (VD: P002)" 
            value={player2} 
            onChange={e => setPlayer2(e.target.value)} 
            required 
            className="flex-1 min-w-[200px] bg-slate-950/80 border border-slate-700 text-rose-400 rounded-lg px-5 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-bold uppercase tracking-wider placeholder-slate-600"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg px-8 py-3 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all transform hover:scale-105"
          >
            {loading ? 'Đang Xử Lý...' : 'So Sánh'}
          </button>
        </form>

        {chartData && (
          <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <div style={{ height: '500px' }} className="flex justify-center">
              <Radar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePlayers;