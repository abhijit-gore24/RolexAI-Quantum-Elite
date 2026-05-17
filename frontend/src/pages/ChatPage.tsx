import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Loader2, Sparkles, Zap, Brain, Globe, Mic, MicOff } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const suggestedPrompts = [
  { icon: Brain, label: 'Deep Intelligence Briefing', prompt: 'Initiate a comprehensive intelligence briefing on our uploaded knowledge base. Identify critical patterns, risks, and strategic opportunities.' },
  { icon: Zap, label: 'Executive Synthesis', prompt: 'Synthesize the key takeaways from the latest documents into a high-level executive summary suitable for board-level review.' },
  { icon: Globe, label: 'Capability Assessment', prompt: 'Describe the FluxTalk architecture and how you leverage neural processing to optimize complex document retrieval and analysis.' },
];

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('default');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice-to-text state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      setInput(prev => finalTranscript || prev + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) {
        setInput(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  useEffect(() => {
    const initSession = async () => {
      const savedSessionId = localStorage.getItem('currentSessionId');
      
      if (savedSessionId) {
        setSessionId(savedSessionId);
        // Fetch existing messages for this session
        try {
          const res = await axios.get(`/api/sessions/${savedSessionId}/messages`);
          const formattedMessages = res.data.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(formattedMessages);
        } catch (e) {
          console.error("Failed to fetch messages", e);
        }
      } else {
        try {
          const res = await axios.post('/api/sessions', {});
          const newId = res.data.session_id;
          setSessionId(newId);
          localStorage.setItem('currentSessionId', newId);
        } catch (e) {
          console.error("Failed to create session", e);
        }
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const sysMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Successfully indexed **${file.name}**. I can now answer questions about this document.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, sysMessage]);
    } catch (error) {
      console.error("Upload error:", error);
      const errMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to upload **${file.name}**. Please ensure it's a valid PDF, DOCX, or TXT file.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const messageText = overrideMessage || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
          stream: true
        })
      });

      if (!response.ok) throw new Error('Chat request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              accumulatedResponse += data.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulatedResponse } : m
              ));
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, isStreaming: false } : m
      ));

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "I'm having trouble connecting right now. Please check if the backend server is running and try again.", isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div ref={scrollRef} className="chat-messages-area">
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl"
            >
              <div className="chat-empty-icon-wrapper">
                <div className="chat-empty-icon-glow" />
                <Sparkles className="chat-empty-icon" />
              </div>
              <h1 className="chat-empty-title">
                How can I help you?
              </h1>
              <p className="chat-empty-subtitle">
                Ask me anything, or upload a document and I'll answer questions about it.
              </p>

              <div className="chat-suggestions">
                {suggestedPrompts.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(s.prompt)}
                    className="chat-suggestion-card"
                  >
                    <s.icon size={16} className="chat-suggestion-icon" />
                    <span>{s.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`chat-message-row ${m.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className={`chat-message-wrapper ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>
                  <div className="chat-bubble-header">
                    <span>{m.role === 'user' ? 'You' : 'FluxTalk Assistant'}</span>
                    <span className="chat-bubble-time">{formatTime(m.timestamp)}</span>
                  </div>
                  <p className="chat-bubble-content">{m.content}</p>
                  {m.isStreaming && !m.content && (
                    <div className="chat-typing-indicator">
                      <span /><span /><span />
                    </div>
                  )}
                  {m.isStreaming && m.content && (
                    <motion.span
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="chat-cursor"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.docx,.txt"
          />
          <button 
            id="attach-file-btn" 
            className="chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            className="chat-textarea"
            rows={1}
          />
          <button
            id="voice-input-btn"
            onClick={toggleVoice}
            className={`chat-attach-btn ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : ''}`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            id="send-message-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="chat-send-btn"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="chat-disclaimer">FluxTalk AI can make mistakes. Verify important information.</p>
      </div>

    </div>
  );
};

export default ChatPage;
