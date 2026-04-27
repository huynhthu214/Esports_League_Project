import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const SeasonReport = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/seasons').then(r => {
      const data = r.data.data || [];
      setSeasons(data);
      if (data.length > 0) setSeasonId(data[0].SeasonID);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    loadReport();
  }, [seasonId]);

  const loadReport = () => {
    setLoading(true);
    setError('');
    axiosClient.get(`/analytics/reports/season/${seasonId}`)
      .then(r => setReport(r.data))
      .catch(err => setError(err.response?.data?.error || 'Không thể tải báo cáo.'))
      .finally(() => setLoading(false));
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await axiosClient.get(`/analytics/reports/season/${seasonId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_${seasonId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Lỗi khi xuất PDF. Vui lòng thử lại.');
    } finally {
      setPdfLoading(false);
    }
  };

  const currentSeason = seasons.find(s => s.SeasonID === seasonId);

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 uppercase mb-1">
              📊 Báo Cáo Tổng Quan Mùa Giải
            </h1>
            <p className="text-slate-400 text-sm">Tổng hợp dữ liệu từ MongoDB & SQL Server</p>
          </div>
          <div className="flex gap-3 items-center">
            <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 text-amber-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500">
              {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
            </select>
            {report && (
              <button onClick={downloadPDF} disabled={pdfLoading}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                {pdfLoading ? '⏳' : '📄'} Xuất PDF
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : report && (
          <div className="space-y-6">
            {/* Overview stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Tổng trận thi đấu', value: report.total_matches_played, icon: '⚔️', color: 'text-cyan-400', bgColor: 'from-cyan-500/10 to-cyan-500/5' },
                { label: 'Tổng mạng hạ gục', value: (report.total_kills || 0).toLocaleString(), icon: '💀', color: 'text-red-400', bgColor: 'from-red-500/10 to-red-500/5' },
                { label: 'TB mạng/trận', value: report.avg_kills_per_match, icon: '🔥', color: 'text-amber-400', bgColor: 'from-amber-500/10 to-amber-500/5' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.bgColor} border border-slate-800 rounded-2xl p-5`}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Standings */}
            {report.standings?.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <span className="text-amber-400 text-lg">📊</span>
                  <h2 className="font-black text-slate-200">Bảng Xếp Hạng Mùa Giải</h2>
                  <span className="text-xs text-slate-500 ml-1">— từ SQL Server</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/80">
                      <tr>
                        {['Hạng', 'Đội', 'Thắng', 'Thua', 'Win Rate', 'Điểm', 'Hiệu số'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {report.standings.map((t, i) => (
                        <tr key={t.TeamID} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-4">
                            <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full font-black text-sm ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-300/20 text-slate-300' : i === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-200">{t.TeamName}</div>
                            <div className="text-xs text-slate-500">{t.ShortName}</div>
                          </td>
                          <td className="px-5 py-4 text-emerald-400 font-black">{t.Wins}</td>
                          <td className="px-5 py-4 text-red-400 font-black">{t.Losses}</td>
                          <td className="px-5 py-4">
                            <span className={`text-sm font-bold ${(t.WinRate || 0) >= 60 ? 'text-emerald-400' : (t.WinRate || 0) >= 40 ? 'text-slate-400' : 'text-red-400'}`}>
                              {t.WinRate ? `${Number(t.WinRate).toFixed(1)}%` : '0%'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-amber-400 font-bold">{t.Points ?? 0}</td>
                          <td className={`px-5 py-4 font-bold ${(t.GoalDiff || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(t.GoalDiff || 0) >= 0 ? '+' : ''}{t.GoalDiff ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top players */}
            {report.top_players?.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <span className="text-purple-400 text-lg">🏆</span>
                  <h2 className="font-black text-slate-200">Top Tuyển Thủ KDA Cao Nhất</h2>
                  <span className="text-xs text-slate-500 ml-1">— từ SQL Server</span>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {report.top_players.map((p, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                      <span className={`text-2xl ${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}`}></span>
                      <div className="flex-1">
                        <div className="font-bold text-slate-200">{p.Nickname}
                          <span className="text-xs text-slate-600 ml-2">({p.Position})</span>
                        </div>
                        <div className="text-xs text-slate-500">{p.TeamShort} · {p.TotalMatches} trận</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-cyan-400 text-lg">{Number(p.AvgKDA).toFixed(2)} KDA</div>
                        <div className={`text-xs font-bold ${(p.WinRate || 0) >= 60 ? 'text-emerald-400' : 'text-slate-400'}`}>{p.WinRate}% WR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="text-center text-xs text-slate-700 pb-4">
              Báo cáo tổng hợp từ MongoDB (thống kê trận đấu) + SQL Server (bảng xếp hạng) · {currentSeason?.SeasonName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonReport;
