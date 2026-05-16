import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, ArrowRight, Loader2, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSelectSession = (sessionId: string) => {
    localStorage.setItem('currentSessionId', sessionId);
    navigate('/');
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(prev => prev.filter(s => s.session_id !== sessionId));
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  if (isLoading) {
    return (
      <div className="history-loading">
        <Loader2 className="animate-spin history-loading-icon" size={40} />
        <p className="history-loading-text">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1 className="history-title text-gradient">Conversation History</h1>
        <p className="history-subtitle">{history.length} session{history.length !== 1 ? 's' : ''} recorded</p>
      </div>

      <motion.div initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="history-list"
      >
        <AnimatePresence>
          {history.map((chat) => (
            <motion.div key={chat.session_id}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              exit={{ opacity: 0, scale: 0.95 }} whileHover={{ x: 4 }}
              onClick={() => handleSelectSession(chat.session_id)}
              className="history-card"
            >
              <div className="history-card-left">
                <div className="history-card-icon"><MessageSquare size={20} /></div>
                <div>
                  <h3 className="history-card-title">{chat.title}</h3>
                  <div className="history-card-meta">
                    <span><Calendar size={12} />{formatDate(chat.created_at)}</span>
                    <span><MessageSquare size={12} />{chat.message_count} msgs</span>
                  </div>
                </div>
              </div>
              <div className="history-card-actions">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(chat.session_id); }}
                  className="history-delete-btn" title="Delete"><Trash2 size={16} /></button>
                <ArrowRight size={18} className="history-arrow" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {history.length === 0 && (
          <div className="history-empty">
            <MessageSquare size={48} className="history-empty-icon" />
            <h3>No conversations yet</h3>
            <p>Start a new session to begin chatting</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryPage;
