import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import axiosClient from '../../api/axiosClient';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const CRITERIA_LABELS = ['Kills TB', 'Assists TB', 'Farm (GPM/100)', 'Win Rate (%)', 'Survivability (10-Deaths)'];

const normalize = (stats) => {
  if (!stats) return [0, 0, 0, 0, 0];
  return [
    Math.min(stats.avg_kills || 0, 15),
    Math.min(stats.avg_assists || 0, 15),
    Math.min((stats.avg_gold || 0) / 100, 15),
    Math.min(stats.win_rate || 0, 100),
    Math.max(0, 10 - (stats.avg_deaths || 0)),
  ];
};

const StatRow = ({ label, v1, v2, better }) => (
  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
    <td className="px-4 py-3 text-center">
      <span className={`font-black text-sm ${better === 1 ? 'text-cyan-400' : 'text-slate-400'}`}>{v1?.toFixed(2) ?? '—'}</span>
      {better === 1 && <span className="ml-1 text-xs text-cyan-400">▲</span>}
    </td>
    <td className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{label}</td>
    <td className="px-4 py-3 text-center">
      <span className={`font-black text-sm ${better === 2 ? 'text-rose-400' : 'text-slate-400'}`}>{v2?.toFixed(2) ?? '—'}</span>
      {better === 2 && <span className="ml-1 text-xs text-rose-400">▲</span>}
    </td>
  </tr>
);

const ComparePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/players').then(r => setPlayers(r.data.data || [])).catch(() => {});
    axiosClient.get('/seasons').then(r => setSeasons(r.data.data || [])).catch(() => {});
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!p1 || !p2 || p1 === p2) {
      setError('Vui lòng chọn 2 tuyển thủ khác nhau.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const params = { p1, p2 };
      if (seasonId) params.seasonId = seasonId;
      const res = await axiosClient.get('/analytics/compare', { params });
      const data = res.data || [];
      const s1 = data.find(d => d._id === p1) || null;
      const s2 = data.find(d => d._id === p2) || null;
      setResult({ s1, s2 });
    } catch {
      setError('Lỗi khi so sánh tuyển thủ. Không có đủ dữ liệu trận đấu.');
    } finally {
      setLoading(false);
    }
  };

  const p1Info = players.find(p => p.PlayerID === p1);
  const p2Info = players.find(p => p.PlayerID === p2);

  const chartData = result ? {
    labels: CRITERIA_LABELS,
    datasets: [
      {
        label: p1Info?.Nickname || p1,
        data: normalize(result.s1),
        backgroundColor: 'rgba(34, 211, 238, 0.25)',
        borderColor: 'rgba(34, 211, 238, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 211, 238, 1)',
        pointBorderColor: '#fff',
      },
      {
        label: p2Info?.Nickname || p2,
        data: normalize(result.s2),
        backgroundColor: 'rgba(244, 63, 94, 0.25)',
        borderColor: 'rgba(244, 63, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(244, 63, 94, 1)',
        pointBorderColor: '#fff',
      }
    ]
  } : null;

  const chartOptions = {
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 15,
        angleLines: { color: 'rgba(255,255,255,0.08)' },
        grid: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: { color: '#e2e8f0', font: { size: 12, weight: 'bold' } },
        ticks: { display: false, backdropColor: 'transparent' }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: '#f8fafc', font: { size: 13, weight: 'bold' }, padding: 20 } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#38bdf8', bodyColor: '#f8fafc', borderColor: '#334155', borderWidth: 1, padding: 10 }
    }
  };

  const compareRows = result ? [
    { label: 'Kills TB', v1: result.s1?.avg_kills, v2: result.s2?.avg_kills },
    { label: 'Deaths TB', v1: result.s1?.avg_deaths, v2: result.s2?.avg_deaths, lowerBetter: true },
    { label: 'Assists TB', v1: result.s1?.avg_assists, v2: result.s2?.avg_assists },
    { label: 'Gold TB', v1: result.s1?.avg_gold, v2: result.s2?.avg_gold },
    { label: 'Win Rate %', v1: result.s1?.win_rate, v2: result.s2?.win_rate },
    { label: 'Số trận', v1: result.s1?.matches, v2: result.s2?.matches },
  ] : [];

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase mb-2">
          ⚖️ So Sánh Tuyển Thủ
        </h1>
        <p className="text-slate-400 text-sm mb-8">Radar chart + bảng đối chiếu theo nhiều tiêu chí</p>

        {/* Filter form */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 mb-6">
          <form onSubmit={handleCompare} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-cyan-500/70 uppercase tracking-widest mb-2">Tuyển thủ 1</label>
              <select value={p1} onChange={e => setP1(e.target.value)} required
                className="w-full bg-slate-950/80 border border-cyan-700/40 text-cyan-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 font-bold">
                <option value="">-- Chọn tuyển thủ 1 --</option>
                {players.map(p => <option key={p.PlayerID} value={p.PlayerID}>{p.Nickname} ({p.Position}) — {p.PlayerID}</option>)}
              </select>
            </div>
            <div className="flex items-center text-slate-600 font-black italic text-xl px-1 pb-3">VS</div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-rose-500/70 uppercase tracking-widest mb-2">Tuyển thủ 2</label>
              <select value={p2} onChange={e => setP2(e.target.value)} required
                className="w-full bg-slate-950/80 border border-rose-700/40 text-rose-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-500 font-bold">
                <option value="">-- Chọn tuyển thủ 2 --</option>
                {players.map(p => <option key={p.PlayerID} value={p.PlayerID}>{p.Nickname} ({p.Position}) — {p.PlayerID}</option>)}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mùa giải</label>
              <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500">
                <option value="">Tất cả mùa</option>
                {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg px-8 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {loading ? '⏳ Đang xử lý...' : 'So Sánh'}
            </button>
          </form>

          {/* Criteria hint */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-2">📋 Tiêu chí so sánh:</p>
            <div className="flex flex-wrap gap-2">
              {['Kills TB', 'Deaths TB', 'Assists TB', 'Gold/GPM TB', 'Win Rate %', 'Survivability', 'Số trận'].map(c => (
                <span key={c} className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {/* Results */}
        {result && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Radar Chart</h2>
              <div style={{ height: '380px' }} className="flex justify-center">
                <Radar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Comparison table */}
            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Bảng Đối Chiếu</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950/80">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-black text-cyan-400 uppercase">{p1Info?.Nickname || p1}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Tiêu chí</th>
                      <th className="px-4 py-3 text-center text-xs font-black text-rose-400 uppercase">{p2Info?.Nickname || p2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map(row => {
                      const { v1, v2, lowerBetter } = row;
                      const better = v1 == null || v2 == null ? 0 :
                        lowerBetter ? (v1 < v2 ? 1 : v1 > v2 ? 2 : 0) :
                          (v1 > v2 ? 1 : v1 < v2 ? 2 : 0);
                      return <StatRow key={row.label} label={row.label} v1={v1} v2={v2} better={better} />;
                    })}
                  </tbody>
                </table>
              </div>

              {/* Winner badge */}
              {result.s1 && result.s2 && (() => {
                let score1 = 0, score2 = 0;
                compareRows.forEach(r => {
                  if (r.v1 == null || r.v2 == null) return;
                  const better = r.lowerBetter ? (r.v1 < r.v2 ? 1 : 2) : (r.v1 > r.v2 ? 1 : 2);
                  if (better === 1) score1++; else score2++;
                });
                const winner = score1 > score2 ? p1Info?.Nickname || p1 : score2 > score1 ? p2Info?.Nickname || p2 : null;
                return winner ? (
                  <div className="mt-5 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl text-center">
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="font-black text-emerald-400">{winner}</div>
                    <div className="text-xs text-slate-500 mt-1">Vượt trội hơn qua nhiều tiêu chí ({score1 > score2 ? `${score1}/${compareRows.length}` : `${score2}/${compareRows.length}`})</div>
                  </div>
                ) : (
                  <div className="mt-5 p-4 bg-slate-800/50 rounded-xl text-center text-slate-400 text-sm">⚖️ Hai tuyển thủ tương đương nhau</div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePlayers;