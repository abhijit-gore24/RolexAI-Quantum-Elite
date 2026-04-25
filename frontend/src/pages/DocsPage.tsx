import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, AlertCircle, Trash2, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'uploading' | 'indexed' | 'error';
}

const DocsPage: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const newFile: UploadedFile = {
        id: Math.random().toString(36),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        status: 'uploading'
      };
      setFiles(prev => [newFile, ...prev]);
      const formData = new FormData();
      formData.append('file', file);
      try {
        await axios.post('/api/upload', formData);
        setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'indexed' } : f));
      } catch {
        setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'error' } : f));
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="docs-page">
      <div className="docs-header">
        <h1 className="docs-title text-gradient">Knowledge Base</h1>
        <p className="docs-subtitle">Upload documents to train Quantum AI on your data</p>
      </div>

      <div className="docs-grid">
        <div className="docs-main">
          {/* Dropzone */}
          <div {...getRootProps()} className={`docs-dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="docs-dropzone-icon-wrapper">
              <Upload className="docs-dropzone-icon" />
            </div>
            <h3 className="docs-dropzone-title">
              {isDragActive ? 'Release to upload' : 'Drop your documents here'}
            </h3>
            <p className="docs-dropzone-hint">PDF, DOCX and TXT files supported up to 50MB</p>
            <button className="docs-browse-btn">Browse Files</button>
          </div>

          {/* File List */}
          <div className="docs-file-list">
            <h3 className="docs-file-list-title">Ingested Documents</h3>
            <AnimatePresence>
              {files.map(file => (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} key={file.id} className="docs-file-row">
                  <div className="docs-file-info">
                    <div className="docs-file-icon"><File size={18} /></div>
                    <div>
                      <p className="docs-file-name">{file.name}</p>
                      <p className="docs-file-size">{file.size}</p>
                    </div>
                  </div>
                  <div className="docs-file-actions">
                    {file.status === 'uploading' && (
                      <span className="docs-status indexing"><Zap size={14} /> Indexing...</span>
                    )}
                    {file.status === 'indexed' && (
                      <span className="docs-status active"><CheckCircle size={14} /> Active</span>
                    )}
                    {file.status === 'error' && (
                      <span className="docs-status error"><AlertCircle size={14} /> Failed</span>
                    )}
                    <button onClick={() => removeFile(file.id)} className="docs-file-delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {files.length === 0 && (
              <div className="docs-empty">
                <p>No documents uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="docs-sidebar">
          <div className="docs-info-card security">
            <h3><ShieldCheck size={18} /> Enterprise Security</h3>
            <p>Your files are stored locally in your private vector database. We never share your data.</p>
            <ul>
              <li>✓ End-to-end encryption</li>
              <li>✓ Zero-retention indexing</li>
              <li>✓ Secure local ChromaDB</li>
            </ul>
          </div>
          <div className="docs-info-card tips">
            <h3>Indexing Tips</h3>
            <ul>
              <li>• Break large documents into smaller ones for better accuracy.</li>
              <li>• Ensure text is machine-readable (OCR).</li>
              <li>• Avoid scans or images without text layers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
