// ===============================================
// 📄 Guaranteed Header Fix - Using Inline Styles
// ===============================================

import React from 'react';
import { Bot } from 'lucide-react';

const Header = () => {
  return (
    <header style={{ 
      width: '100%',
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '2.5rem', 
            height: '2.5rem', 
            backgroundColor: '#111827', 
            borderRadius: '0.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Bot style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0,
              lineHeight: '1.4'
            }}>
              AI Incident Response
            </h1>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.2'
            }}>
              Self-Evaluating Agent • MongoDB Atlas
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '0.5rem', 
            height: '0.5rem', 
            backgroundColor: '#10b981', 
            borderRadius: '50%' 
          }}></div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            LangGraph Online
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;