import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const TeamStandings = () => {
    const [seasons, setSeasons] = useState([]);
    const [seasonId, setSeasonId] = useState('');
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load danh sách mùa giải
    useEffect(() => {
        axiosClient.get('/seasons')
            .then(res => {
                const data = res.data.data || [];
                setSeasons(data);
                if (data.length > 0) setSeasonId(data[0].SeasonID);
            })
            .catch(() => setError('Không thể tải danh sách mùa giải.'));
    }, []);

    // Load bảng xếp hạng khi seasonId thay đổi
    useEffect(() => {
        if (!seasonId) return;
        setLoading(true);
        setError('');
        axiosClient.get('/leaderboards/teams', { params: { seasonId } })
            .then(res => {
                setTeams(res.data.data || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Không thể tải bảng xếp hạng.');
                setLoading(false);
            });
    }, [seasonId]);

    const getRankStyle = (rank) => {
        if (rank === 1) return 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
        if (rank === 2) return 'bg-slate-300/20 text-slate-300 border border-slate-400/50';
        if (rank === 3) return 'bg-orange-700/20 text-orange-400 border border-orange-700/50';
        return 'bg-slate-800 text-slate-500';
    };

    const getWinRateStyle = (rate) => {
        if (rate >= 60) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        if (rate >= 40) return 'bg-slate-700/50 text-slate-300 border-slate-600';
        return 'bg-red-500/10 text-red-400 border-red-500/30';
    };

    return (
        <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 uppercase mb-2 drop-shadow-sm">
                            📊 Bảng Xếp Hạng Đội Tuyển
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Cập nhật kết quả thắng thua theo thời gian thực
                        </p>
                    </div>
                    {/* Season selector */}
                    <select
                        value={seasonId}
                        onChange={e => setSeasonId(e.target.value)}
                        className="bg-slate-950/80 border border-slate-700 text-cyan-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    >
                        <option value="">-- Chọn mùa giải --</option>
                        {seasons.map(s => (
                            <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Main Table Container */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(8,_112,_184,_0.1)]">
                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950/80 border-b border-slate-800">
                                    <tr>
                                        {['Hạng', 'Đội Tuyển', 'Thắng', 'Thua', 'Tổng', 'Điểm', 'Hiệu số', 'Tỷ lệ thắng'].map(h => (
                                            <th key={h} className="px-5 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center first:text-center">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {teams.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center text-slate-500 font-medium">
                                                {seasonId ? 'Chưa có dữ liệu thi đấu cho mùa này.' : 'Vui lòng chọn mùa giải.'}
                                            </td>
                                        </tr>
                                    )}
                                    {teams.map((team, index) => (
                                        <tr
                                            key={team.TeamID}
                                            className="hover:bg-slate-800/40 transition-colors duration-200 group"
                                        >
                                            <td className="px-5 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm ${getRankStyle(team.Standing_Rank || index + 1)}`}>
                                                    {team.Standing_Rank || index + 1}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300">
                                                        {team.ShortName?.substring(0, 3) || team.TeamID?.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
                                                            {team.TeamName || team.TeamID}
                                                        </div>
                                                        {team.ShortName && <span className="text-xs text-slate-500">{team.ShortName}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 text-center text-emerald-400 font-black text-lg">{team.Wins ?? 0}</td>
                                            <td className="px-5 py-5 text-center text-red-400 font-black text-lg">{team.Losses ?? 0}</td>
                                            <td className="px-5 py-5 text-center text-slate-400 font-medium">{team.TotalMatches ?? ((team.Wins ?? 0) + (team.Losses ?? 0))}</td>
                                            <td className="px-5 py-5 text-center text-amber-400 font-bold">{team.Points ?? 0}</td>
                                            <td className={`px-5 py-5 text-center font-bold ${(team.GoalDiff ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {(team.GoalDiff ?? 0) >= 0 ? '+' : ''}{team.GoalDiff ?? 0}
                                            </td>
                                            <td className="px-5 py-5 text-center">
                                                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${getWinRateStyle(team.WinRate || 0)}`}>
                                                    {team.WinRate ? `${Number(team.WinRate).toFixed(1)}%` : '0%'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legend */}
                {teams.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 px-2">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500/60 inline-block"></span> Vị trí 1</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300/40 inline-block"></span> Vị trí 2</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-700/60 inline-block"></span> Vị trí 3</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamStandings;