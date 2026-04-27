import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PlayerFormChart = () => {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/players').then(r => setPlayers(r.data.data || [])).catch(() => {});
  }, []);

  const filteredPlayers = players.filter(p =>
    p.Nickname?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.PlayerID?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSearch = async (e) => {
    e?.preventDefault();
    const targetId = playerId || (filteredPlayers[0]?.PlayerID);
    if (!targetId) { setError('Vui lòng chọn tuyển thủ.'); return; }
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const res = await axiosClient.get(`/analytics/players/${targetId}/form`);
      setStats(res.data);
      if (!playerId) setPlayerId(targetId);
    } catch {
      setError('Không tìm thấy dữ liệu. Tuyển thủ chưa có trận đấu nào được ghi nhận.');
    } finally {
      setLoading(false);
    }
  };

  const playerInfo = players.find(p => p.PlayerID === playerId);

  // Build line chart data from matches array
  const lineData = stats?.matches?.length > 0 ? {
    labels: stats.matches.map((m, i) => `Trận ${i + 1}`),
    datasets: [
      {
        label: 'KDA',
        data: stats.matches.map(m => Number(m.kda?.toFixed(2) || 0)),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      }
    ]
  } : null;

  const lineOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { weight: 'bold' } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          afterLabel: (ctx) => {
            const m = stats.matches[ctx.dataIndex];
            return m ? `${m.result === 'WIN' ? '✅ Thắng' : '❌ Thua'} · Hero: ${m.hero || '?'}` : '';
          }
        }
      }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, min: 0 },
      x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 10 } }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase mb-2">
          📉 Phân Tích Tuyển Thủ (50 Trận)
        </h1>
        <p className="text-slate-400 text-sm mb-8">Xu hướng phong độ qua các trận gần nhất từ MongoDB</p>

        {/* Search form */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 mb-8">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tìm tuyển thủ (tên hoặc ID)</label>
              <input
                type="text"
                placeholder="Gõ tên hoặc ID tuyển thủ..."
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setPlayerId(''); }}
                className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
            {/* Dropdown */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chọn tuyển thủ</label>
              <select value={playerId} onChange={e => { setPlayerId(e.target.value); setSearchText(players.find(p => p.PlayerID === e.target.value)?.Nickname || ''); }}
                className="w-full bg-slate-950/80 border border-slate-700 text-cyan-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 font-bold">
                <option value="">-- Tất cả kết quả ({filteredPlayers.length}) --</option>
                {filteredPlayers.map(p => (
                  <option key={p.PlayerID} value={p.PlayerID}>{p.Nickname} ({p.Position}) — {p.PlayerID}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg px-8 py-3 text-sm font-bold tracking-wide uppercase disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)]">
              {loading ? '⏳ Đang tải...' : '🔍 Phân Tích'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {stats && (
          <>
            {/* Player info + summary stats */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/20 flex items-center justify-center font-black text-cyan-400 text-2xl">
                {playerInfo?.Nickname?.charAt(0) || '?'}
              </div>
              <div>
                <div className="font-black text-xl text-slate-100">{playerInfo?.Nickname || stats.player_id}</div>
                <div className="text-sm text-slate-500">{playerInfo?.Position} · {playerInfo?.PlayerID}</div>
              </div>
              <div className="ml-auto flex flex-wrap gap-3">
                <div className="text-center">
                  <div className="font-black text-2xl text-cyan-400">{stats.total_matches}</div>
                  <div className="text-xs text-slate-600">Trận</div>
                </div>
                <div className="text-center">
                  <div className={`font-black text-2xl ${stats.win_rate >= 60 ? 'text-emerald-400' : stats.win_rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {stats.win_rate}%
                  </div>
                  <div className="text-xs text-slate-600">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard title="Kills TB" value={stats.avg_kills?.toFixed(2)} color="#e74c3c" />
              <StatCard title="Deaths TB" value={stats.avg_deaths?.toFixed(2)} color="#94a3b8" />
              <StatCard title="Assists TB" value={stats.avg_assists?.toFixed(2)} color="#10b981" />
              <StatCard title="Gold TB" value={Math.round(stats.avg_gold || 0).toLocaleString()} color="#f59e0b" />
            </div>

            {/* Line chart */}
            {lineData && (
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Xu hướng KDA theo trận</h2>
                  <span className="text-xs text-slate-600">{stats.total_matches} trận gần nhất</span>
                </div>
                <div style={{ height: '280px' }}>
                  <Line data={lineData} options={lineOptions} />
                </div>
              </div>
            )}

            {/* Per-match table */}
            {stats.matches?.length > 0 && (
              <div className="mt-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chi Tiết Từng Trận</h2>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/80 sticky top-0">
                      <tr>
                        {['#', 'Tướng', 'K', 'D', 'A', 'KDA', 'Gold', 'Kết quả'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {[...stats.matches].reverse().map((m, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2.5 text-slate-600 text-xs">{stats.matches.length - i}</td>
                          <td className="px-4 py-2.5 text-slate-400">{m.hero || '—'}</td>
                          <td className="px-4 py-2.5 text-emerald-400 font-bold">{m.kills ?? 0}</td>
                          <td className="px-4 py-2.5 text-red-400 font-bold">{m.deaths ?? 0}</td>
                          <td className="px-4 py-2.5 text-cyan-400 font-bold">{m.assists ?? 0}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-black text-sm ${(m.kda || 0) >= 5 ? 'text-purple-400' : (m.kda || 0) >= 3 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {(m.kda || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-amber-400 text-xs">{(m.gold || 0).toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {m.result === 'WIN' ? 'W' : 'L'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerFormChart;