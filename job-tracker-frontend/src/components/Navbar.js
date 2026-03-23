import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LogOut, Sun, Moon } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Don't show navbar on auth pages
  if (location.pathname === '/login' || location.pathname === '/signup') return null;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        <Briefcase size={24} color="var(--primary)" />
        <span>AI Job Tracker</span>
      </Link>
      
      {token && (
        <div className="user-controls">
          <div className="nav-links">
            <Link 
              to="/dashboard" 
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/add-job" 
              className={`nav-link ${location.pathname === '/add-job' ? 'active' : ''}`}
            >
              Add Job
            </Link>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-med)', margin: '0 0.5rem' }}></div>
          <button onClick={toggleTheme} className="nav-link" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
