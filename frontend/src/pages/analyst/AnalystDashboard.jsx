import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  Scale,
  Swords,
  Flame,
  Target,
  FileText,
  Link as RouterLink,
} from "lucide-react";

const STYLE = `

  @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  .dot-blink { animation: dot-blink 1.8s ease infinite; }
`;

const AnalystDashboard = () => (
  <div className="min-h-[calc(100vh-80px)] h-full flex-1 w-full bg-[#0b1120] text-slate-200 p-8 relative overflow-hidden font-sans">
    <style>{STYLE}</style>
    {/* Ambient Glowing Background */}
    <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

    <div className="max-w-6xl mx-auto relative z-10">
      <div className="mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 uppercase mb-2">
          Dashboard Phân Tích
        </h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/analyst/form"
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all transform hover:-translate-y-1"
        >
          <TrendingDown size={28} className="mb-3 text-blue-400" />
          <h3 className="text-lg font-bold text-slate-200 mb-2">
            Phong Độ Tuyển Thủ
          </h3>
          <p className="text-xs text-slate-500">
            Phân tích chuyên sâu 50 trận đấu gần nhất.
          </p>
        </Link>
        <Link
          to="/analyst/compare"
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all transform hover:-translate-y-1"
        >
          <Scale size={28} className="mb-3 text-emerald-400" />
          <h3 className="text-lg font-bold text-slate-200 mb-2">
            So Sánh Trực Diện
          </h3>
        </Link>
        <Link
          to="/analyst/h2h"
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all transform hover:-translate-y-1"
        >
          <Swords size={28} className="mb-3 text-orange-400" />
          <h3 className="text-lg font-bold text-slate-200 mb-2">
            Lịch Sử Đối Đầu
          </h3>
          <p className="text-xs text-slate-500">
            Lọc 5 trận chạm trán gần nhất giữa 2 đội.
          </p>
        </Link>
        <Link
          to="/analyst/meta"
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all transform hover:-translate-y-1"
        >
          <Flame size={28} className="mb-3 text-purple-400" />
          <h3 className="text-lg font-bold text-slate-200 mb-2">
            Meta Tướng Hot
          </h3>
          <p className="text-xs text-slate-500">
            Top 10 tướng được chọn nhiều nhất giải.
          </p>
        </Link>
      </div>
    </div>
  </div>
);

export default AnalystDashboard;
