import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const TeamStandings = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tạm thời comment API và dùng dữ liệu mẫu để test giao diện
        axiosClient.get('/leaderboards/teams')
            .then(res => { setTeams(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });

        setLoading(false);
    }, []);

    return (
        <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-6 font-sans relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 uppercase mb-3 drop-shadow-sm">
                        📊 Bảng Xếp Hạng Đội Tuyển
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Cập nhật kết quả thắng thua theo thời gian thực (Dual-Write System)
                    </p>
                </div>

                {/* Main Table Container */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(8,_112,_184,_0.1)]">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950/80 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-24 text-center">Hạng</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Đội Tuyển (Team ID)</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Thắng</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Thua</th>
                                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Tỷ lệ thắng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {teams.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Chưa có dữ liệu thi đấu.</td>
                                        </tr>
                                    )}
                                    {teams.map((team, index) => (
                                        <tr 
                                            key={team.TeamID}
                                            className="hover:bg-slate-800/40 transition-colors duration-200 group"
                                        >
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                                    index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                                                    index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-400/50' :
                                                    index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/50' :
                                                    'bg-slate-800 text-slate-500'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="font-bold text-lg text-slate-200 group-hover:text-purple-400 transition-colors">
                                                        {team.TeamID}
                                                    </div>
                                                    {team.TeamName && <span className="text-sm text-slate-500 hidden sm:inline-block">({team.TeamName})</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center text-emerald-400 font-black text-lg">{team.Wins}</td>
                                            <td className="px-6 py-5 text-center text-red-400 font-black text-lg">{team.Losses}</td>
                                            <td className="px-6 py-5 text-right">
                                                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                                                    (team.WinRate || 0) >= 60 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                                                    (team.WinRate || 0) >= 40 ? 'bg-slate-700/50 text-slate-300 border-slate-600' :
                                                    'bg-red-500/10 text-red-400 border-red-500/30'
                                                }`}>
                                                    {team.WinRate ? `${team.WinRate}%` : '0%'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamStandings;