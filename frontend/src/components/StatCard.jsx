// frontend/src/components/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, color }) => {
    return (
        <div style={{ padding: '20px', backgroundColor: color || '#f1c40f', borderRadius: '8px', color: '#fff', textAlign: 'center', margin: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{title}</h3>
            <h1 style={{ margin: '0', fontSize: '2.5rem' }}>{value}</h1>
        </div>
    );
};

export default StatCard;