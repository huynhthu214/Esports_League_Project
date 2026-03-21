// frontend/src/pages/analyst/TeamH2H.jsx
import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const TeamH2H = () => {
    const [team1, setTeam1] = useState('');
    const [team2, setTeam2] = useState('');
    const [matches, setMatches] = useState([]);

    const handleCompare = async (e) => {
        e.preventDefault();
        try {
            // [cite: 713-724]
            const res = await axiosClient.get(`/analytics/h2h?team1=${team1}&team2=${team2}`);
            setMatches(res.data);
        } catch (error) {
            alert('Lỗi tìm kiếm lịch sử đối đầu!');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Lịch Sử Đối Đầu (5 Trận Gần Nhất)</h2>
            <form onSubmit={handleCompare} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Team 1 ID (VD: SGD)" value={team1} onChange={e => setTeam1(e.target.value)} required />
                <input type="text" placeholder="Team 2 ID (VD: HNL)" value={team2} onChange={e => setTeam2(e.target.value)} required />
                <button type="submit">So Sánh</button>
            </form>

            {matches.length > 0 && (
                <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Mã Trận</th>
                            <th>Mùa Giải</th>
                            <th>Chi Tiết JSON (Raw Data)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map(match => (
                            <tr key={match.match_id}>
                                <td>{match.match_id}</td>
                                <td>{match.season_id}</td>
                                <td><pre style={{ fontSize: '12px' }}>{JSON.stringify(match.teams, null, 2)}</pre></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TeamH2H;