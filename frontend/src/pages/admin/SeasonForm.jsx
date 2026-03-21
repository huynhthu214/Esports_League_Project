// frontend/src/pages/admin/SeasonForm.jsx
import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const SeasonForm = () => {
    const [seasonId, setSeasonId] = useState('');
    const [seasonName, setSeasonName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Gọi API tạo mùa giải (Thúy Vi sẽ code API này ở backend) [cite: 599-603]
            await axiosClient.post('/admin/seasons', { season_id: seasonId, name: seasonName });
            setMessage('✅ Tạo mùa giải thành công!');
        } catch (error) {
            setMessage('❌ Lỗi: Không thể tạo mùa giải.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px' }}>
            <h2>Tạo Mùa Giải Mới</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Mã Mùa Giải (VD: S2026):</label>
                    <input type="text" value={seasonId} onChange={e => setSeasonId(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Tên Mùa Giải:</label>
                    <input type="text" value={seasonName} onChange={e => setSeasonName(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: '#fff', border: 'none' }}>Tạo Mùa Giải</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default SeasonForm;