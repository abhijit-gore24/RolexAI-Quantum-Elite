import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Files, Settings, History, LogOut, Sparkles, Plus, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const navItems = [
    { icon: MessageSquare, label: 'Chat', path: '/' },
    { icon: Files, label: 'Documents', path: '/docs' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleNewSession = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await axios.post('/api/sessions', {});
      localStorage.setItem('currentSessionId', res.data.session_id);
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreating(false);
      if (onClose) onClose();
    }
  };

  return (
    <div className="sidebar-container w-72 lg:w-72 h-full flex flex-col p-6 border-r border-slate-200/60 bg-white/90 backdrop-blur-3xl z-50 shadow-2xl lg:shadow-none">
      {/* Mobile Close Button */}
      <button 
        onClick={onClose}
        className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
      >
        <X size={20} />
      </button>

      {/* Brand */}
      <div className="sidebar-brand">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.1, filter: 'drop-shadow(0 0 8px rgba(10, 102, 194, 0.4))' }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="sidebar-brand-icon"
        >
          <Zap className="sidebar-sparkle-icon" />
        </motion.div>
        <div>
          <span className="sidebar-brand-title">BotForge</span>
          <p className="sidebar-brand-subtitle">Next-Gen Neural Forge</p>
        </div>
      </div>

      {/* Chronometer */}
      <div className="sidebar-chronometer-box">
        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1.5">Forge Chronometer</p>
        <p className="text-xl font-mono font-black text-rolex-blue tabular-nums">
          {formatTime(currentTime)}
        </p>
      </div>

      {/* New Session Button */}
      <motion.button
        id="new-session-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleNewSession}
        disabled={isCreating}
        className="sidebar-new-session-btn"
      >
        {isCreating ? (
          <>
            <Zap size={18} className="animate-pulse" />
            Creating...
          </>
        ) : (
          <>
            <Plus size={18} />
            New Session
          </>
        )}
        <span className="sidebar-shortcut-badge hidden lg:inline">⌘N</span>
      </motion.button>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onClose && onClose()}
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span className="sidebar-nav-label">{item.label}</span>
            {item.path === '/' && (
              <span className="sidebar-nav-live-dot" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-credit">
          <div className="sidebar-credit-avatar">A</div>
          <div>
            <p className="sidebar-credit-label">Engineered by</p>
            <p className="sidebar-credit-name">Abhijit</p>
          </div>
        </div>
        <button
          id="sign-out-btn"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="sidebar-logout-btn"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
