import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const MatchResultForm = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = JSON.parse(jsonInput);
      
      // Call API thật:
      const response = await axiosClient.post('/matches', payload);
      setStatus({ type: 'success', text: `✅ Thành công: ${response.data.message || 'Đồng bộ kết quả vào Mongo & SQL thành công!'}` });
      setJsonInput('');
    } catch (error) {
      setStatus({ type: 'error', text: `❌ Lỗi: ${error.response?.data?.message || error.message || 'JSON không hợp lệ!'}` });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 uppercase mb-4 drop-shadow-sm">
          🎮 Nhập Kết Quả (Dual-Write)
        </h2>
        <p className="text-slate-400 text-sm mb-8">Paste JSON kết quả trận đấu từ hệ thống ghi hình vào khung bên dưới.</p>

        {status && (
          <div className={`mb-6 p-4 rounded-xl border font-medium text-sm ${status.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-4">
          <textarea 
            rows="15" 
            className="w-full bg-slate-950/80 border border-slate-700 text-emerald-400 rounded-xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-700"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{&#10;  "match_id": "M2025_045",&#10;  "season_id": "S2025",&#10;  "teams": [...]&#10;}'
            required
          />
          <button 
            type="submit" 
            className="self-end bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg px-8 py-3 text-sm font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all transform hover:scale-105"
          >
            Đồng Bộ Vào MongoDB & Oracle
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchResultForm;