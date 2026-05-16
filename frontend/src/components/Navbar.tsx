import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Activity, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get('/api/health');
        setHealth(res.data);
      } catch {
        setHealth(null);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar-container">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar */}
        <div className="navbar-search-wrapper hidden md:flex">
          <Search size={16} className="navbar-search-icon" />
          <input
            id="global-search"
            type="text"
            placeholder="Search everything..."
            className="navbar-search-input"
          />
          <span className="navbar-search-shortcut">⌘K</span>
        </div>
      </div>

      <div className="navbar-actions">
        {/* System Health Indicator */}
        {health && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="navbar-health-badge hidden sm:flex"
          >
            <Activity size={12} className="navbar-health-icon" />
            <span>{health.model?.split('/')[1] || 'AI'}</span>
          </motion.div>
        )}

        {/* Notification Bell */}
        <button id="notifications-btn" className="navbar-notification-btn">
          <Bell size={19} />
          <span className="navbar-notification-dot" />
        </button>

        {/* User Profile */}
        <div className="navbar-user-profile" id="user-profile">
          <div className="navbar-user-info hidden md:block">
            <p className="navbar-username">{user?.username || 'Abhijit'}</p>
            <div className="navbar-user-status">
              <span className="navbar-status-dot" />
              <p className="navbar-status-text">Online</p>
            </div>
          </div>
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            className="navbar-avatar"
          >
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
