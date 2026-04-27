import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const MatchPredictor = () => {
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/teams').then(r => setTeams(r.data.data || [])).catch(() => {});
    axiosClient.get('/seasons').then(r => {
      const data = r.data.data || [];
      setSeasons(data);
      if (data.length > 0) setSeasonId(data[0].SeasonID);
    }).catch(() => {});
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!team1 || !team2 || team1 === team2) {
      setError('Vui lòng chọn 2 đội khác nhau.');
      return;
    }
    setLoading(true);
    setError('');
    setPrediction(null);
    try {
      const params = { team1, team2 };
      if (seasonId) params.seasonId = seasonId;
      const res = await axiosClient.get('/analytics/predict', { params });
      setPrediction(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi dự đoán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const t1Info = teams.find(t => t.TeamID === team1);
  const t2Info = teams.find(t => t.TeamID === team2);

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-purple-500/6 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 uppercase mb-2">
          🎯 Dự Đoán Kết Quả Trận Đấu
        </h1>
        <p className="text-slate-400 text-sm mb-8">Phân tích thống kê — WinRate (50%) + Hiệu số (20%) + H2H (30%)</p>

        {/* Form */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 mb-6">
          <form onSubmit={handlePredict} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-cyan-500/70 uppercase tracking-widest mb-2">Đội 1</label>
              <select value={team1} onChange={e => setTeam1(e.target.value)} required
                className="w-full bg-slate-950/80 border border-cyan-700/40 text-cyan-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 font-bold">
                <option value="">-- Chọn đội 1 --</option>
                {teams.map(t => <option key={t.TeamID} value={t.TeamID}>{t.TeamName} ({t.ShortName})</option>)}
              </select>
            </div>
            <div className="flex items-center text-slate-600 font-black italic text-xl px-1 pb-3">VS</div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-rose-500/70 uppercase tracking-widest mb-2">Đội 2</label>
              <select value={team2} onChange={e => setTeam2(e.target.value)} required
                className="w-full bg-slate-950/80 border border-rose-700/40 text-rose-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-500 font-bold">
                <option value="">-- Chọn đội 2 --</option>
                {teams.map(t => <option key={t.TeamID} value={t.TeamID}>{t.TeamName} ({t.ShortName})</option>)}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mùa giải</label>
              <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500">
                {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg px-8 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              {loading ? '⏳ Đang phân tích...' : '🎯 Dự Đoán'}
            </button>
          </form>

          {/* Algorithm note */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-3">
            {[
              { label: 'Win Rate', weight: '50%', icon: '📊' },
              { label: 'Goal Diff', weight: '20%', icon: '⚡' },
              { label: 'H2H History', weight: '30%', icon: '⚔️' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700">
                <span>{f.icon}</span>
                <span className="text-slate-400">{f.label}</span>
                <span className="font-black text-indigo-400">{f.weight}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {/* Prediction result */}
        {prediction && (
          <div className="space-y-5">
            {/* Main prediction card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-3">Dự đoán kết quả</p>
                {prediction.prediction === 'TIE' ? (
                  <div className="text-2xl font-black text-amber-400">🤝 Hai đội tương đương nhau</div>
                ) : (
                  <div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                      {prediction.prediction === team1
                        ? (t1Info?.TeamName || team1)
                        : (t2Info?.TeamName || team2)}
                    </div>
                    <div className="text-slate-400 text-sm mt-1">có khả năng chiến thắng cao hơn</div>
                    <div className={`text-xs font-bold mt-2 px-3 py-1 rounded-full inline-block border ${
                      prediction.confidence >= 20 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      prediction.confidence >= 10 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {prediction.confidence >= 20 ? '🟢 Tự tin cao' : prediction.confidence >= 10 ? '🟡 Tự tin vừa' : '🔴 Không chắc chắn'} — chênh {prediction.confidence}%
                    </div>
                  </div>
                )}
              </div>

              {/* Probability bars */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 text-center">
                  <div className="text-sm font-black text-cyan-300 mb-2">{t1Info?.ShortName || team1}</div>
                  <div className="text-3xl font-black text-cyan-400">{prediction.team1?.win_probability}%</div>
                  <div className="w-full bg-slate-800 rounded-full h-3 mt-2">
                    <div className="h-3 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all"
                      style={{ width: `${prediction.team1?.win_probability || 0}%` }}></div>
                  </div>
                </div>
                <div className="text-slate-600 font-black shrink-0">|</div>
                <div className="flex-1 text-center">
                  <div className="text-sm font-black text-rose-300 mb-2">{t2Info?.ShortName || team2}</div>
                  <div className="text-3xl font-black text-rose-400">{prediction.team2?.win_probability}%</div>
                  <div className="w-full bg-slate-800 rounded-full h-3 mt-2">
                    <div className="h-3 rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all"
                      style={{ width: `${prediction.team2?.win_probability || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed stats comparison */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Win Rate mùa này', v1: `${prediction.team1?.win_rate || 0}%`, v2: `${prediction.team2?.win_rate || 0}%` },
                { label: 'Số trận thắng', v1: prediction.team1?.wins || 0, v2: prediction.team2?.wins || 0 },
                { label: 'Hiệu số game', v1: prediction.team1?.goal_diff || 0, v2: prediction.team2?.goal_diff || 0 },
                { label: 'Thắng trong H2H', v1: prediction.team1?.h2h_wins || 0, v2: prediction.team2?.h2h_wins || 0 },
              ].map((row, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <div className="font-black text-cyan-400">{row.v1}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center w-28 shrink-0">{row.label}</div>
                  <div className="flex-1 text-center">
                    <div className="font-black text-rose-400">{row.v2}</div>
                  </div>
                </div>
              ))}
            </div>

            {prediction.h2h_total > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
                📊 Dự đoán dựa trên {prediction.h2h_total} trận đối đầu lịch sử · Đây là phân tích thống kê, không phải kết quả chính thức
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchPredictor;
