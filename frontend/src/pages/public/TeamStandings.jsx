// frontend/src/pages/public/TeamStandings.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const TeamStandings = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        // Fetch từ API SQL của bạn
        axiosClient.get('/leaderboards/teams')
            .then(res => setTeams(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Bảng Xếp Hạng Đội Tuyển</h2>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Hạng</th>
                        <th>Đội (Team ID)</th>
                        <th>Thắng</th>
                        <th>Thua</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, index) => (
                        <tr key={team.TeamID}>
                            <td>{index + 1}</td>
                            <td>{team.TeamID}</td>
                            <td>{team.Wins}</td>
                            <td>{team.Losses}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeamStandings;