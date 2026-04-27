import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const POSITION_COLOR = {
  Top: 'bg-red-500/20 text-red-400 border-red-500/30',
  Jungle: 'bg-green-500/20 text-green-400 border-green-500/30',
  Mid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ADC: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Support: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const StatBar = ({ value, maxValue, color }) => {
  const pct = maxValue > 0 ? Math.min(100, Math.round((value / maxValue) * 100)) : 0;
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }}></div>
    </div>
  );
};

const MatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get(`/matches/${matchId}/detail`)
      .then(r => setDetail(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Không tìm thấy chi tiết trận đấu.'))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#050c18]">
      <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-red-500"></div>
    </div>
  );

  if (error || !detail) return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#050c18] text-slate-400 gap-4">
      <div className="text-5xl">😕</div>
      <p>{error || 'Không có dữ liệu cho trận này.'}</p>
      <button onClick={() => navigate('/matches')}
        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-colors">
        ← Quay lại Lịch Sử
      </button>
    </div>
  );

  const winTeam = detail.teams?.find(t => t.result === 'WIN');
  const loseTeam = detail.teams?.find(t => t.result === 'LOSS');

  // Tính max values để vẽ bar
  const allPlayers = (detail.teams || []).flatMap(t => t.players || []);
  const maxKills = Math.max(...allPlayers.map(p => p.kills || 0), 1);
  const maxGold = Math.max(...allPlayers.map(p => p.gold || 0), 1);

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-red-500/6 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Back button */}
        <button onClick={() => navigate('/matches')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-semibold mb-6 transition-colors">
          ← Quay lại Lịch Sử Thi Đấu
        </button>

        {/* Match header */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{detail.match_id}</div>
            <div className="text-sm text-slate-400">{formatDate(detail.match_date)} {detail.venue ? `· 📍 ${detail.venue}` : ''}</div>
            {detail.format && <div className="text-xs text-slate-600 mt-1">{detail.format} · {detail.season_id}</div>}
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-8">
            {detail.teams?.map((team, i) => (
              <div key={i} className={`flex-1 text-center ${team.result === 'WIN' ? '' : 'opacity-60'}`}>
                <div className={`text-2xl font-black mb-1 ${team.result === 'WIN' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {team.result === 'WIN' ? '🏆 ' : ''}{team.team_id}
                </div>
                <div className={`text-5xl font-black ${team.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {team.result === 'WIN' ? '승' : '패'}
                </div>
                <div className={`text-sm font-bold mt-2 px-3 py-1 rounded-full inline-block ${team.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {team.result === 'WIN' ? 'THẮNG' : 'THUA'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player stats per team */}
        {detail.teams?.map((team, ti) => (
          <div key={ti} className={`bg-slate-900/60 backdrop-blur-xl border rounded-2xl p-6 mb-5 ${team.result === 'WIN' ? 'border-emerald-700/30' : 'border-slate-800'}`}>
            <div className="flex items-center gap-3 mb-5">
              <h2 className={`text-xl font-black ${team.result === 'WIN' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {team.result === 'WIN' ? '🏆' : '💀'} {team.team_id}
              </h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${team.result === 'WIN' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                {team.result}
              </span>
              <span className="text-xs text-slate-600 ml-auto">
                {(team.players || []).length} tuyển thủ
              </span>
            </div>

            {team.players?.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950/80">
                    <tr>
                      {['Tuyển thủ', 'Tướng', 'Vị trí', 'K', 'D', 'A', 'KDA', 'Gold'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {team.players.map((p, pi) => {
                      const kda = p.deaths === 0 ? (p.kills + p.assists) : ((p.kills + p.assists) / p.deaths);
                      return (
                        <tr key={pi} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-200">{p.nickname || p.player_id}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{p.hero || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${POSITION_COLOR[p.position] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                              {p.position || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-emerald-400 font-bold">{p.kills ?? 0}</div>
                            <StatBar value={p.kills || 0} maxValue={maxKills} color="#34d399" />
                          </td>
                          <td className="px-4 py-3 text-red-400 font-bold">{p.deaths ?? 0}</td>
                          <td className="px-4 py-3 text-cyan-400 font-bold">{p.assists ?? 0}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-black ${kda >= 5 ? 'text-purple-400' : kda >= 3 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {kda.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-amber-400 font-medium text-xs">{(p.gold || 0).toLocaleString()}</div>
                            <StatBar value={p.gold || 0} maxValue={maxGold} color="#f59e0b" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Không có dữ liệu tuyển thủ cho đội này.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchDetail;
