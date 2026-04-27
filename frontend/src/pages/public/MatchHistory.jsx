import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const MatchHistory = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasonId, setSeasonId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get('/seasons').then(r => {
      const data = r.data.data || [];
      setSeasons(data);
      if (data.length > 0) setSeasonId(data[0].SeasonID);
    }).catch(() => {});
    axiosClient.get('/teams').then(r => setTeams(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);
    const params = { seasonId };
    if (teamId) params.teamId = teamId;
    axiosClient.get('/matches/history', { params })
      .then(r => setMatches(r.data.data || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [seasonId, teamId]);

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-red-500/8 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-1">
              ⚔️ Lịch Sử Thi Đấu
            </h1>
            <p className="text-slate-400 text-sm">Kết quả, tỉ số và chi tiết các trận đấu đã diễn ra</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 text-red-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-red-500">
              <option value="">-- Mùa giải --</option>
              {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
            </select>
            <select value={teamId} onChange={e => setTeamId(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 text-slate-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-slate-500">
              <option value="">Tất cả đội</option>
              {teams.map(t => <option key={t.TeamID} value={t.TeamID}>{t.TeamName}</option>)}
            </select>
          </div>
        </div>

        {/* Stats summary */}
        {matches.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Tổng trận', value: matches.length, color: 'text-slate-300' },
              { label: 'Đội thắng nhiều nhất', value: (() => {
                const cnt = {};
                matches.forEach(m => { cnt[m.WinnerTeamID] = (cnt[m.WinnerTeamID] || 0) + 1; });
                const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
                return top ? `${top[0]} (${top[1]}W)` : '—';
              })(), color: 'text-emerald-400' },
              { label: 'Tỉ số phổ biến', value: (() => {
                const cnt = {};
                matches.forEach(m => { const k = `${m.Team1Score}-${m.Team2Score}`; cnt[k] = (cnt[k] || 0) + 1; });
                const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
                return top ? top[0] : '—';
              })(), color: 'text-cyan-400' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Match list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            {seasonId ? 'Chưa có trận đấu nào trong mùa giải này.' : 'Vui lòng chọn mùa giải.'}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(m => (
              <div key={m.MatchID}
                onClick={() => navigate(`/matches/${m.MatchID}`)}
                className="group bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] transition-all cursor-pointer">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Team 1 */}
                  <div className={`flex-1 text-center min-w-[90px] transition-all ${m.WinnerTeamID === m.Team1ID ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`font-black text-lg ${m.WinnerTeamID === m.Team1ID ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {m.WinnerTeamID === m.Team1ID && '🏆 '}{m.Team1Short || m.Team1ID}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.Team1Name}</div>
                  </div>

                  {/* Score */}
                  <div className="text-center shrink-0 px-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-black ${m.WinnerTeamID === m.Team1ID ? 'text-emerald-400' : 'text-red-400'}`}>{m.Team1Score}</span>
                      <span className="text-slate-700 font-black text-xl">:</span>
                      <span className={`text-3xl font-black ${m.WinnerTeamID === m.Team2ID ? 'text-emerald-400' : 'text-red-400'}`}>{m.Team2Score}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{m.Format || 'BO3'}</div>
                  </div>

                  {/* Team 2 */}
                  <div className={`flex-1 text-center min-w-[90px] transition-all ${m.WinnerTeamID === m.Team2ID ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`font-black text-lg ${m.WinnerTeamID === m.Team2ID ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {m.WinnerTeamID === m.Team2ID && '🏆 '}{m.Team2Short || m.Team2ID}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.Team2Name}</div>
                  </div>

                  {/* Meta */}
                  <div className="text-right shrink-0 ml-auto">
                    <div className="text-xs text-slate-500">{formatDate(m.MatchDate)}</div>
                    {m.Venue && <div className="text-xs text-slate-600 mt-0.5">📍 {m.Venue}</div>}
                    <div className="text-xs text-slate-600 group-hover:text-red-400 transition-colors mt-1 font-semibold">
                      Chi tiết →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
