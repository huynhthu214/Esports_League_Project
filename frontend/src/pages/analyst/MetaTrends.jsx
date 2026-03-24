import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import axiosClient from '../../api/axiosClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MetaTrends = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Tạm thời comment axios, dùng mock data để test UI
    // axiosClient.get('/analytics/meta-heroes').then(...).catch(...)
    
    // Dữ liệu giả định để xem thiết kế
    const data = [
      { _id: 'Nakroth', pick_count: 120 }, { _id: 'Florentino', pick_count: 98 },
      { _id: 'Aoi', pick_count: 85 }, { _id: 'Elsu', pick_count: 76 },
      { _id: 'Krixi', pick_count: 65 }, { _id: 'Omen', pick_count: 55 }
    ];

    setChartData({
      labels: data.map(item => item._id || 'Unknown Hero'),
      datasets: [
        {
          label: 'Số lần chọn (Pick Count)',
          data: data.map(item => item.pick_count),
          backgroundColor: 'rgba(168, 85, 247, 0.7)', // Purple Neon
          borderColor: 'rgba(216, 180, 254, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(192, 132, 252, 0.9)',
          borderRadius: 4,
        }
      ]
    });
  }, []);

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1', font: { family: 'sans-serif', weight: 'bold' } } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#38bdf8', bodyColor: '#f8fafc', borderColor: '#334155', borderWidth: 1 }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { weight: 'bold' } }
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase mb-8">
          🔥 Phân Tích Meta: Top Tướng Hot Nhất
        </h2>
        
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
          {chartData ? (
            <div style={{ height: '450px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaTrends;