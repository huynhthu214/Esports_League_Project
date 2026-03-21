// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import các trang (Tạo file rỗng cho các trang này trước để không bị lỗi)
import Home from './pages/public/Home';
import TeamStandings from './pages/public/TeamStandings';
import MatchResultForm from './pages/admin/MatchResultForm';
import AnalystDashboard from './pages/analyst/AnalystDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Có thể nhúng Navbar ở đây để hiển thị ở mọi trang */}
        <Routes>
          {/* LUỒNG PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/standings" element={<TeamStandings />} />
          
          {/* LUỒNG ADMIN */}
          <Route path="/admin/match-result" element={<MatchResultForm />} />

          {/* LUỒNG ANALYST */}
          <Route path="/analyst" element={<AnalystDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;