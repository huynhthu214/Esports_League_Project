// frontend/src/pages/admin/MatchResultForm.jsx
import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const MatchResultForm = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Kiểm tra xem JSON có hợp lệ không trước khi gửi
            const payload = JSON.parse(jsonInput);
            
            // Gọi API (API matchController bạn đã làm ở phiên trước)
            const response = await axiosClient.post('/admin/matches', payload);
            setStatus(`✅ Thành công: ${response.data.message}`);
            setJsonInput(''); // Xóa form
        } catch (error) {
            setStatus(`❌ Lỗi: ${error.response?.data?.error || 'JSON không hợp lệ!'}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Nhập Kết Quả Trận Đấu (Dual-Write)</h2>
            <p>Paste JSON kết quả trận đấu từ hệ thống ghi hình vào đây:</p>
            <form onSubmit={handleSubmit}>
                <textarea 
                    rows="15" 
                    style={{ width: '100%', fontFamily: 'monospace', padding: '10px' }}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{ "match_id": "M2025_045", "season_id": "S2025", "teams": [...] }'
                    required
                />
                <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: 'purple', color: 'white' }}>
                    Đồng Bộ Vào MongoDB & Oracle
                </button>
            </form>
            {status && <h4 style={{ marginTop: '15px' }}>{status}</h4>}
        </div>
    );
};

export default MatchResultForm;