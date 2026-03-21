// frontend/src/pages/analyst/PlayerFormChart.jsx
import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/StatCard';

const PlayerFormChart = () => {
    const [playerId, setPlayerId] = useState('');
    const [stats, setStats] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            // [cite: 645-654]
            const res = await axiosClient.get(`/analytics/players/${playerId}/form`);
            setStats(res.data);
        } catch (error) {
            alert('Lỗi khi lấy dữ liệu!');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Phân Tích Phong Độ Tuyển Thủ (50 Trận Gần Nhất)</h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nhập Player ID (VD: P001)" value={playerId} onChange={e => setPlayerId(e.target.value)} required style={{ padding: '8px' }} />
                <button type="submit" style={{ padding: '8px 15px', background: '#3498db', color: '#fff' }}>Phân Tích</button>
            </form>

            {stats && stats._id && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <StatCard title="Kills (AVG)" value={stats.avg_kills.toFixed(2)} color="#e74c3c" />
                    <StatCard title="Deaths (AVG)" value={stats.avg_deaths.toFixed(2)} color="#95a5a6" />
                    <StatCard title="Assists (AVG)" value={stats.avg_assists.toFixed(2)} color="#2ecc71" />
                    <StatCard title="Gold (AVG)" value={Math.round(stats.avg_gold)} color="#f39c12" />
                </div>
            )}
        </div>
    );
};

export default PlayerFormChart;