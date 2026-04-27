import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const POSITION_COLOR = {
  Top: 'bg-red-500/20 text-red-400 border-red-500/30',
  Jungle: 'bg-green-500/20 text-green-400 border-green-500/30',
  Mid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ADC: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Support: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const TeamModal = ({ team, seasonId, onClose }) => {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get(`/rosters/${team.TeamID}`, { params: { seasonId } })
      .then(r => setRoster(r.data.data || []))
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, [team.TeamID, seasonId]);

  const active = roster.filter(p => p.Status === 'ACTIVE');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-sm">
          <div>
            <h3 className="text-xl font-black text-slate-100">{team.TeamName}</h3>
            <p className="text-sm text-cyan-400 font-bold mt-0.5">{team.ShortName} · {team.Region || 'TP.HCM'}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center font-bold">✕</button>
        </div>

        {/* Roster */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : active.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Chưa có dữ liệu roster cho mùa này.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{active.length} tuyển thủ</p>
              {active.map(p => (
                <div key={p.PlayerID} className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-slate-700 flex items-center justify-center text-sm font-black text-slate-300">
                    {p.Nickname?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-200">
                      <Link to={`/players/${p.PlayerID}`} className="hover:text-cyan-400 hover:underline">
                        {p.Nickname}
                      </Link>
                      <span className="text-xs text-slate-600 ml-2">({p.PlayerID})</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${POSITION_COLOR[p.Position] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {p.Position}
                      </span>
                      {p.TotalMatches > 0 && (
                        <span className="text-xs text-slate-500">{p.TotalMatches} trận</span>
                      )}
                    </div>
                  </div>
                  {/* Phong độ sơ bộ */}
                  <div className="text-right shrink-0">
                    {p.AvgKDA != null && (
                      <div className="text-sm font-black text-cyan-400">{Number(p.AvgKDA).toFixed(2)} KDA</div>
                    )}
                    {p.WinRate != null && (
                      <div className={`text-xs font-bold ${p.WinRate >= 60 ? 'text-emerald-400' : p.WinRate >= 40 ? 'text-slate-400' : 'text-red-400'}`}>
                        {Number(p.WinRate).toFixed(1)}% WR
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchSchedule = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState('');
  const [seasonTeams, setSeasonTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'schedule'

  useEffect(() => {
    axiosClient.get('/seasons')
      .then(r => {
        const data = r.data.data || [];
        setSeasons(data);
        if (data.length > 0) setSeasonId(data[0].SeasonID);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);
    // Load matches schedule
    axiosClient.get('/matches/schedule', { params: { seasonId } })
      .then(r => setMatches(r.data.data || []))
      .catch(() => setMatches([]));
    // Load teams trong mùa (từ standings hoặc teams)
    axiosClient.get('/leaderboards/teams', { params: { seasonId } })
      .then(r => setSeasonTeams(r.data.data || []))
      .catch(() => setSeasonTeams([]))
      .finally(() => setLoading(false));
  }, [seasonId]);

  const upcoming = matches.filter(m => m.MatchStatus === 'UPCOMING');
  const completed = matches.filter(m => m.MatchStatus === 'COMPLETED');

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 uppercase mb-1">
              📅 Lịch Thi Đấu
            </h1>
            <p className="text-slate-400 text-sm">Danh sách đội tham gia mùa giải và lịch thi đấu</p>
          </div>
          <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 text-amber-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500">
            <option value="">-- Chọn mùa giải --</option>
            {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'teams', label: `🛡️ Đội Tham Gia (${seasonTeams.length})` },
            { key: 'upcoming', label: `⏳ Sắp Diễn Ra (${upcoming.length})` },
            { key: 'completed', label: `✅ Đã Hoàn Thành (${completed.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.key ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <>
            {/* Teams grid */}
            {activeTab === 'teams' && (
              <div>
                {seasonTeams.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    {seasonId ? 'Chưa có đội nào đăng ký mùa giải này.' : 'Vui lòng chọn mùa giải.'}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seasonTeams.map(team => (
                      <button key={team.TeamID} onClick={() => setSelectedTeam(team)}
                        className="group text-left bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.1)] transition-all transform hover:-translate-y-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center font-black text-amber-400 text-lg">
                            {team.ShortName?.substring(0, 3) || team.TeamID?.substring(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">{team.TeamName || team.TeamID}</div>
                            <div className="text-xs text-slate-500">{team.ShortName}</div>
                          </div>
                        </div>
                        {/* Mini stats */}
                        <div className="flex gap-3 text-center">
                          <div className="flex-1 bg-slate-950/50 rounded-lg p-2">
                            <div className="text-emerald-400 font-black">{team.Wins ?? 0}</div>
                            <div className="text-xs text-slate-600">Thắng</div>
                          </div>
                          <div className="flex-1 bg-slate-950/50 rounded-lg p-2">
                            <div className="text-red-400 font-black">{team.Losses ?? 0}</div>
                            <div className="text-xs text-slate-600">Thua</div>
                          </div>
                          <div className="flex-1 bg-slate-950/50 rounded-lg p-2">
                            <div className="text-cyan-400 font-black text-sm">{team.WinRate ? `${Number(team.WinRate).toFixed(0)}%` : '—'}</div>
                            <div className="text-xs text-slate-600">WR</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-amber-400/70 font-semibold group-hover:text-amber-400 transition-colors">
                          Nhấn để xem tuyển thủ →
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming matches */}
            {activeTab === 'upcoming' && (
              <MatchList matches={upcoming} formatDate={formatDate} emptyMsg="Không có trận đấu sắp diễn ra." type="upcoming" />
            )}

            {/* Completed matches */}
            {activeTab === 'completed' && (
              <MatchList matches={completed} formatDate={formatDate} emptyMsg="Chưa có trận đấu nào hoàn thành." type="completed" />
            )}
          </>
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamModal team={selectedTeam} seasonId={seasonId} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  );
};

const MatchList = ({ matches, formatDate, emptyMsg, type }) => {
  if (matches.length === 0) {
    return <div className="text-center py-16 text-slate-500">{emptyMsg}</div>;
  }
  return (
    <div className="space-y-3">
      {matches.map(m => (
        <div key={m.MatchID} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex flex-wrap items-center gap-4">
            {/* Teams */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="text-center min-w-[80px]">
                <div className="font-black text-slate-200">{m.Team1Short || m.Team1ID}</div>
                <div className="text-xs text-slate-500">{m.Team1Name}</div>
              </div>
              <div className="text-center px-4">
                {type === 'completed' ? (
                  <div className="text-2xl font-black text-slate-200">
                    <span className={m.WinnerTeamID === m.Team1ID ? 'text-emerald-400' : 'text-red-400'}>{m.Team1Score}</span>
                    <span className="text-slate-600 mx-2">:</span>
                    <span className={m.WinnerTeamID === m.Team2ID ? 'text-emerald-400' : 'text-red-400'}>{m.Team2Score}</span>
                  </div>
                ) : (
                  <div className="text-slate-600 font-black text-lg">VS</div>
                )}
                <div className="text-xs text-slate-600 mt-1">{m.Format || 'BO3'}</div>
              </div>
              <div className="text-center min-w-[80px]">
                <div className="font-black text-slate-200">{m.Team2Short || m.Team2ID}</div>
                <div className="text-xs text-slate-500">{m.Team2Name}</div>
              </div>
            </div>

            {/* Meta */}
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400">{formatDate(m.MatchDate)}</div>
              {m.Venue && <div className="text-xs text-slate-600 mt-0.5">📍 {m.Venue}</div>}
              {type === 'completed' && m.WinnerTeamID && (
                <div className="text-xs font-bold text-emerald-400 mt-1">
                  🏆 {m.WinnerTeamID === m.Team1ID ? m.Team1Short : m.Team2Short} thắng
                </div>
              )}
              {type === 'upcoming' && (
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full mt-1 inline-block">Sắp diễn ra</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchSchedule;
