import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const TransferHistory = () => {
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [search, setSearch] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');

  useEffect(() => {
    axiosClient.get('/players').then(r => setPlayers(r.data.data || [])).catch(() => {});
    axiosClient.get('/seasons').then(r => setSeasons(r.data.data || [])).catch(() => {});
    // Load tất cả chuyển nhượng lúc đầu
    loadTransfers({});
  }, []);

  const loadTransfers = (params) => {
    setLoading(true);
    axiosClient.get('/transfers', { params })
      .then(r => setTransfers(r.data.data || []))
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (selectedPlayer) params.playerId = selectedPlayer;
    if (seasonId) params.seasonId = seasonId;
    loadTransfers(params);
  };

  const filteredBySearch = search
    ? transfers.filter(t =>
        t.PlayerNickname?.toLowerCase().includes(search.toLowerCase()) ||
        t.FromTeamName?.toLowerCase().includes(search.toLowerCase()) ||
        t.ToTeamName?.toLowerCase().includes(search.toLowerCase())
      )
    : transfers;

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const formatFee = (fee) => fee ? `${Number(fee).toLocaleString('vi-VN')} ₫` : 'Miễn phí';

  const POSITION_COLOR = {
    Top: 'bg-red-500/20 text-red-400 border-red-500/30',
    Jungle: 'bg-green-500/20 text-green-400 border-green-500/30',
    Mid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ADC: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Support: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#050c18] text-slate-200 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-cyan-500/6 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase mb-2">
            🔄 Lịch Sử Chuyển Nhượng
          </h1>
          <p className="text-slate-400 text-sm">Tra cứu lịch sử di chuyển của tuyển thủ giữa các đội tuyển</p>
        </div>

        {/* Filter form */}
        <form onSubmit={handleSearch} className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lọc theo tuyển thủ</label>
            <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">Tất cả tuyển thủ</option>
              {players.map(p => <option key={p.PlayerID} value={p.PlayerID}>{p.Nickname} ({p.PlayerID})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lọc theo mùa</label>
            <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">Tất cả mùa</option>
              {seasons.map(s => <option key={s.SeasonID} value={s.SeasonID}>{s.SeasonName}</option>)}
            </select>
          </div>
          <button type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            🔍 Tìm kiếm
          </button>
        </form>

        {/* Quick search */}
        <div className="mb-5">
          <input type="text" placeholder="Tìm theo tên tuyển thủ, đội..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 placeholder-slate-600" />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredBySearch.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            Không tìm thấy lịch sử chuyển nhượng nào.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 mb-4">{filteredBySearch.length} giao dịch chuyển nhượng</p>
            {filteredBySearch.map(t => (
              <div key={t.TransferID} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-emerald-700/30 transition-all">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Player info */}
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-slate-700 flex items-center justify-center font-black text-emerald-400">
                      {t.PlayerNickname?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{t.PlayerNickname}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${POSITION_COLOR[t.Position] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                        {t.Position}
                      </span>
                    </div>
                  </div>

                  {/* Transfer arrow */}
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-0.5">Từ</div>
                      <div className="font-black text-red-400">{t.FromShort || t.FromTeamName}</div>
                      <div className="text-xs text-slate-600">{t.FromTeamName}</div>
                    </div>
                    <div className="text-slate-600 font-black text-xl px-2">→</div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-0.5">Đến</div>
                      <div className="font-black text-emerald-400">{t.ToShort || t.ToTeamName}</div>
                      <div className="text-xs text-slate-600">{t.ToTeamName}</div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400">{formatDate(t.TransferDate)}</div>
                    <div className="text-xs text-amber-400 font-semibold mt-0.5">{formatFee(t.TransferFee)}</div>
                    {t.SeasonName && <div className="text-xs text-slate-600 mt-0.5">{t.SeasonName}</div>}
                    {t.Reason && (
                      <div className="text-xs text-slate-500 mt-1 max-w-[160px] text-right truncate" title={t.Reason}>
                        📝 {t.Reason}
                      </div>
                    )}
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

export default TransferHistory;
