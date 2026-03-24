import React from "react";

const StatCard = ({ title, value, color }) => {
  // Hàm chuyển đổi mã màu Hex thành RGBA để làm hiệu ứng Neon Glow phát sáng
  const hexToRgba = (hex, opacity) => {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const glowColor = color ? hexToRgba(color, 0.2) : 'rgba(255,255,255,0.1)';
  const borderColor = color ? hexToRgba(color, 0.4) : 'rgba(255,255,255,0.2)';

  return (
    <div
      className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-slate-900/60 transition-all duration-300 hover:scale-105 flex-1 min-w-[200px] group font-sans"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 32px 0 ${glowColor}`
      }}
    >
      {/* Đường Neon Line phía trên đỉnh thẻ */}
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color || '#fff' }}></div>
      
      <div className="p-6 flex flex-col items-center justify-center z-10 relative">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">{title}</h3>
        <h1 className="text-4xl font-black tracking-wider drop-shadow-md group-hover:drop-shadow-lg transition-all" style={{ color: color || '#fff' }}>
          {value}
        </h1>
      </div>
      
      {/* Vòng tròn mờ phát sáng ở góc */}
      <div 
        className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-[40px] z-0 group-hover:scale-110 transition-transform duration-500"
        style={{ backgroundColor: color || '#fff', opacity: 0.15 }}
      ></div>
    </div>
  );
};

export default StatCard;
