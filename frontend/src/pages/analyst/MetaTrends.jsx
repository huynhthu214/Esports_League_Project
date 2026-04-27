import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import axiosClient from '../../api/axiosClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MetaTrends = () => {
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient.get('/seasons').then(r => {
      const data = r.data.data || [];
      setSeasons(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadMeta();
  }, [seasonId, limit]);

  const loadMeta = () => {
    setLoading(true);
    const params = { limit };
    if (seasonId) params.seasonId = seasonId;
    axiosClient.get('/analytics/meta-heroes', { params })
      .then(r => {
        const data = r.data || [];
        setTableData(data);
        if (data.length > 0) {
          setChartData({
            labels: data.map(item => item._id || 'Unknown'),
            datasets: [
              {
                label: 'Số lần chọn (Pick Count)',
                data: data.map(item => item.pick_count),
                backgroundColor: data.map((_, i) =>
                  `hsla(${260 + i * 12}, 70%, 65%, 0.75)`
                ),
                borderColor: data.map((_, i) =>
                  `hsla(${260 + i * 12}, 80%, 70%, 1)`
                ),
                borderWidth: 1,
                borderRadius: 6,
              }
            ]
          });
        }
      })
      .catch(() => {
        // Fallback mock data
        const mockData = [
          { _id: 'Nakroth', pick_count: 120, win_count: 72, win_rate: 60.0, avg_kills: 8.5, avg_gold: 14200 },
          { _id: 'Florentino', pick_count: 98, win_count: 55, win_rate: 56.1, avg_kills: 7.2, avg_gold: 13800 },
          { _id: 'Aoi', pick_count: 85, win_count: 40, win_rate: 47.1, avg_kills: 2.1, avg_gold: 10200 },
          { _id: 'Elsu', pick_count: 76, win_count: 44, win_rate: 57.9, avg_kills: 6.8, avg_gold: 14500 },
          { _id: 'Krixi', pick_count: 65, win_count: 30, win_rate: 46.2, avg_kills: 5.9, avg_gold: 13100 },
        ];
        setTableData(mockData);
        setChartData({
          labels: mockData.map(d => d._id),
          datasets: [{
            label: 'Số lần chọn (Pick Count)',
            data: mockData.map(d => d.pick_count),
            backgroundColor: 'rgba(168, 85, 247, 0.7)',
            borderColor: 'rgba(216, 180, 254, 1)',
            borderWidth: 1,
            borderRadius: 6,
          }]
        });
      })
      .finally(() => setLoading(false));
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1', font: { family: 'sans-serif', weight: 'bold' } } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          afterLabel: (ctx) => {
            const item = tableData[ctx.dataIndex];
            return item ? `Win Rate: ${item.win_rate?.toFixed(1) || '?'}%` : '';
          }
        }
      }
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold' } } }
    }
  };

  const getWinRateColor = (wr) => {
    if (wr >= 55) return 'text-emerald-400';
    if (wr >= 50) return 'text-cyan-400';
    if (wr >= 45) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase mb-1">
              🔥 Meta Tướng Hot Nhất
            </h1>
            <p className="text-slate-400 text-sm">Tướng được chọn nhiều nhất và tỉ lệ thắng/thua</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 text-purple-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-purple-500">
              <option value="">Tất cả mùa</option>
              {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
            </select>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              className="bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-slate-500">
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(168,85,247,0.08)]">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pick Count</h2>
              {chartData ? (
                <div style={{ height: '350px' }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-600">Không có dữ liệu</div>
              )}
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Bảng Thống Kê Chi Tiết</h2>
              <div className="space-y-3">
                {tableData.map((hero, i) => (
                  <div key={hero._id} className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-400">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-200 truncate">{hero._id}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-slate-500">{hero.pick_count} lần chọn</span>
                        {hero.avg_kills != null && (
                          <span className="text-xs text-emerald-400">{hero.avg_kills?.toFixed(1)} K/game</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black ${getWinRateColor(hero.win_rate || 0)}`}>
                        {hero.win_rate != null ? `${hero.win_rate.toFixed(1)}%` : '—'}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">Win Rate</div>
                      {/* Mini win bar */}
                      <div className="w-16 bg-slate-800 rounded-full h-1 mt-1">
                        <div className={`h-1 rounded-full ${(hero.win_rate || 0) >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(hero.win_rate || 0, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaTrends;