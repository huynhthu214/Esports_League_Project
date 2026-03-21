// frontend/src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:3000/api', // Trỏ về backend
    headers: { 'Content-Type': 'application/json' }
});

// Tự động đính kèm Token trước khi gửi request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;