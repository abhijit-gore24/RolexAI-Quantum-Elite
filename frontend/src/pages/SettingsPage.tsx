import React, { useState, useEffect } from 'react';
import { Shield, Cpu, Database, Palette, Activity, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get('/api/health').then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title text-gradient">System Settings</h1>
        <p className="settings-subtitle">Configure your Quantum Elite AI platform</p>
      </div>

      {/* Status Card */}
      {health && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="settings-status-card">
          <Activity size={16} className="settings-status-icon" />
          <span>System Status: </span>
          <span className="settings-status-healthy">{health.status}</span>
          <span className="settings-status-divider">|</span>
          <span>v{health.version}</span>
          <span className="settings-status-divider">|</span>
          <span>Model: {health.model}</span>
        </motion.div>
      )}

      <div className="settings-grid">
        {/* Model Selection */}
        <div className="settings-card">
          <div className="settings-card-row">
            <div className="settings-card-left">
              <div className="settings-icon-box blue"><Cpu size={22} /></div>
              <div>
                <p className="settings-card-title">Model Selection</p>
                <p className="settings-card-desc">Choose your AI inference model</p>
              </div>
            </div>
            <select className="settings-select" onChange={showSaved}>
              <option>openai/gpt-3.5-turbo</option>
              <option>anthropic/claude-3-haiku</option>
              <option>meta-llama/llama-3-8b-instruct</option>
            </select>
          </div>

          <div className="settings-card-row">
            <div className="settings-card-left">
              <div className="settings-icon-box green"><Database size={22} /></div>
              <div>
                <p className="settings-card-title">Vector Storage</p>
                <p className="settings-card-desc">Local ChromaDB persistence</p>
              </div>
            </div>
            <button className="settings-danger-btn">Clear All Data</button>
          </div>

          <div className="settings-card-row no-border">
            <div className="settings-card-left">
              <div className="settings-icon-box amber"><Palette size={22} /></div>
              <div>
                <p className="settings-card-title">Theme Mode</p>
                <p className="settings-card-desc">Nexus Premium Dark</p>
              </div>
            </div>
            <div className="settings-theme-toggle">
              <button className="settings-theme-btn">Light</button>
              <button className="settings-theme-btn active">Dark</button>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="settings-card api-card">
          <div className="settings-card-left">
            <Shield className="settings-shield-icon" />
            <h3 className="settings-card-title">API Configuration</h3>
          </div>
          <p className="settings-api-key">••••••••••••••••••••••••</p>
          <p className="settings-api-hint">API key is securely stored on the server</p>
          <button className="settings-update-key-btn" onClick={showSaved}>Update Key</button>
        </div>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} className="settings-toast">
          <CheckCircle size={16} /> Settings saved
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
