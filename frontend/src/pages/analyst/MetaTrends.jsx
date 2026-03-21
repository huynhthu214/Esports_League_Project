// frontend/src/pages/analyst/MetaTrends.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// Giả sử bạn cấu hình axios ở file api/axiosClient.js
// import axiosClient from '../../api/axiosClient'; 
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MetaTrends = () => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        // Gọi API backend của bạn
        axios.get('http://localhost:3000/api/analytics/meta-heroes')
            .then(res => {
                const data = res.data;
                // Bóc tách dữ liệu JSON thành mảng cho Chart.js
                setChartData({
                    labels: data.map(item => item._id || 'Unknown Hero'),
                    datasets: [
                        {
                            label: 'Số lần chọn (Pick Count)',
                            data: data.map(item => item.pick_count),
                            backgroundColor: 'rgba(155, 89, 182, 0.6)',
                            borderColor: 'rgba(142, 68, 173, 1)',
                            borderWidth: 1,
                        }
                    ]
                });
            })
            .catch(err => console.error("Lỗi fetch meta heroes:", err));
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">🔥 Phân Tích Meta: Top 10 Tướng Hot Nhất</h2>
            {chartData ? (
                <div style={{ height: '400px' }}>
                    <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                </div>
            ) : (
                <p>Đang tải dữ liệu biểu đồ...</p>
            )}
        </div>
    );
};

export default MetaTrends;