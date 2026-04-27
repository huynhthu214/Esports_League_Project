import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const TeamH2H = () => {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/teams').then(r => setTeams(r.data.data || [])).catch(() => {});
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!team1 || !team2 || team1 === team2) {
      setError('Vui lòng chọn 2 đội khác nhau.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axiosClient.get('/analytics/h2h', { params: { team1, team2 } });
      setResult(res.data);
    } catch {
      setError('Không tìm thấy lịch sử đối đầu giữa 2 đội này.');
    } finally {
      setLoading(false);
    }
  };

  const team1Info = teams.find(t => t.TeamID === team1);
  const team2Info = teams.find(t => t.TeamID === team2);

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-red-500/8 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-500/6 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-2">
          ⚔️ Lịch Sử Đối Đầu (H2H)
        </h1>
        <p className="text-slate-400 text-sm mb-8">Phân tích lịch sử thi đấu trực tiếp giữa 2 đội tuyển</p>

        {/* Select teams form */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 mb-6">
          <form onSubmit={handleCompare} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-red-500/70 uppercase tracking-widest mb-2">Đội 1</label>
              <select value={team1} onChange={e => setTeam1(e.target.value)} required
                className="w-full bg-slate-950/80 border border-red-700/40 text-red-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 font-bold">
                <option value="">-- Chọn đội 1 --</option>
                {teams.map(t => <option key={t.TeamID} value={t.TeamID}>{t.TeamName} ({t.ShortName})</option>)}
              </select>
            </div>
            <div className="flex items-center text-slate-600 font-black italic text-xl px-1 pb-3">VS</div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-blue-500/70 uppercase tracking-widest mb-2">Đội 2</label>
              <select value={team2} onChange={e => setTeam2(e.target.value)} required
                className="w-full bg-slate-950/80 border border-blue-700/40 text-blue-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-bold">
                <option value="">-- Chọn đội 2 --</option>
                {teams.map(t => <option key={t.TeamID} value={t.TeamID}>{t.TeamName} ({t.ShortName})</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg px-8 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              {loading ? '⏳ Đang tải...' : '⚔️ Xem H2H'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {/* H2H Summary */}
        {result && (
          <div className="space-y-6">
            {/* Score summary */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Team 1 */}
                <div className="flex-1 text-center">
                  <div className="font-black text-2xl text-red-400">{team1Info?.ShortName || team1}</div>
                  <div className="text-sm text-slate-400">{team1Info?.TeamName}</div>
                  <div className="text-5xl font-black text-red-400 mt-3">{result.team1_wins}</div>
                  <div className="text-xs text-slate-600 mt-1">Chiến thắng</div>
                  {/* Win bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
                    <div className="h-2 rounded-full bg-red-500 transition-all"
                      style={{ width: result.total_matches > 0 ? `${(result.team1_wins / result.total_matches) * 100}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="text-center shrink-0 px-6">
                  <div className="text-slate-600 font-black text-2xl">VS</div>
                  <div className="text-xs text-slate-600 mt-2">{result.total_matches} trận</div>
                  {result.total_matches > 0 && (
                    <div className="mt-3 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 text-slate-400">
                      {result.team1_wins > result.team2_wins
                        ? `${team1Info?.ShortName || team1} dẫn trước`
                        : result.team2_wins > result.team1_wins
                        ? `${team2Info?.ShortName || team2} dẫn trước`
                        : 'Hoà bằng'}
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-center">
                  <div className="font-black text-2xl text-blue-400">{team2Info?.ShortName || team2}</div>
                  <div className="text-sm text-slate-400">{team2Info?.TeamName}</div>
                  <div className="text-5xl font-black text-blue-400 mt-3">{result.team2_wins}</div>
                  <div className="text-xs text-slate-600 mt-1">Chiến thắng</div>
                  {/* Win bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
                    <div className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: result.total_matches > 0 ? `${(result.team2_wins / result.total_matches) * 100}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Match list */}
            {result.matches?.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lịch Sử Trận Gần Nhất</h2>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {result.matches.map((m, i) => {
                    const t1InMatch = m.teams?.find(t => t.team_id === team1);
                    const t2InMatch = m.teams?.find(t => t.team_id === team2);
                    const winner = m.teams?.find(t => t.result === 'WIN');
                    return (
                      <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/20 transition-colors">
                        <div className="shrink-0 text-xs text-slate-600 w-24">{formatDate(m.match_date)}</div>
                        <div className="flex-1 flex items-center gap-3">
                          <span className={`font-black text-sm ${t1InMatch?.result === 'WIN' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {team1Info?.ShortName || team1}
                          </span>
                          <span className="text-slate-700 font-black">vs</span>
                          <span className={`font-black text-sm ${t2InMatch?.result === 'WIN' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {team2Info?.ShortName || team2}
                          </span>
                        </div>
                        {winner && (
                          <span className="text-xs font-bold text-emerald-400 shrink-0">🏆 {winner.team_id}</span>
                        )}
                        <div className="text-xs text-slate-600 shrink-0">{m.season_id}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamH2H;