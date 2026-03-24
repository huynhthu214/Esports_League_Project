import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const TeamH2H = () => {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {

      // Call API thật:
      const res = await axiosClient.get(`/analytics/h2h?team1=${team1}&team2=${team2}`);
      setMatches(res.data);
    } catch (error) {
      alert('Lỗi tìm kiếm lịch sử đối đầu!');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase mb-8 drop-shadow-sm">
          ⚔️ Lịch Sử Đối Đầu (H2H)
        </h2>
        
        <form onSubmit={handleCompare} className="flex flex-wrap gap-4 mb-10 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg">
          <input 
            type="text" 
            placeholder="Đội 1 (VD: SGD)" 
            value={team1} 
            onChange={e => setTeam1(e.target.value)} 
            required 
            className="flex-1 min-w-[200px] bg-slate-950/80 border border-slate-700 text-red-400 rounded-lg px-5 py-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold uppercase tracking-wider"
          />
          <div className="flex items-center text-slate-500 font-black italic text-xl px-2">VS</div>
          <input 
            type="text" 
            placeholder="Đội 2 (VD: HNL)" 
            value={team2} 
            onChange={e => setTeam2(e.target.value)} 
            required 
            className="flex-1 min-w-[200px] bg-slate-950/80 border border-slate-700 text-blue-400 rounded-lg px-5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold uppercase tracking-wider"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg px-8 py-3 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 transition-all transform hover:scale-105"
          >
            {loading ? 'Đang Lọc...' : 'Đấu!'}
          </button>
        </form>

        {matches.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-32">Mã Trận</th>
                    <th className="px-6 py-4 w-32">Mùa Giải</th>
                    <th className="px-6 py-4">Chi Tiết (JSON Raw Data)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {matches.map(match => (
                    <tr key={match.match_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-5 text-cyan-400 font-bold">{match.match_id}</td>
                      <td className="px-6 py-5 text-slate-300 font-medium">{match.season_id}</td>
                      <td className="px-6 py-5">
                        <pre className="text-emerald-400 bg-slate-950/80 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800/80 shadow-inner">
                          {JSON.stringify(match.teams, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamH2H;