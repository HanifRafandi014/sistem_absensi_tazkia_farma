import React from 'react';
import { Employee } from '../types';

interface TopNavbarProps {
  simulatedDate: string;
  simulatedTime: string;
  currentUser: Employee | null;
  onToggleSidebar: () => void;
  pageTitle: string;
}

const formatIndonesianDate = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10).toString().padStart(2, '0');
    
    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return `${day} ${indonesianMonths[monthIndex]} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  simulatedDate,
  simulatedTime,
  currentUser,
  onToggleSidebar,
  pageTitle
}) => {
  return (
    <div className="top-navbar">
      <div className="page-title-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="mobile-header-toggle" 
            onClick={onToggleSidebar} 
            title="Buka Menu"
            style={{
              padding: '8px 12px',
              fontSize: '1.25rem',
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>{pageTitle}</h1>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Sistem Portal Absensi, Kinerja Harian, dan Penggajian Karyawan
        </p>
      </div>

      <div className="top-navbar-controls">
        {/* Real-time WIB Clock Widget */}
        <div 
          className="simulation-widget" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            backgroundColor: 'var(--surface)', 
            padding: '10px 16px', 
            borderRadius: '12px', 
            border: '1.5px solid var(--border)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              className="pulse-indicator" 
              style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981', 
                display: 'inline-block',
                boxShadow: '0 0 8px #10b981',
                animation: 'pulse-glow 2s infinite'
              }}
            ></span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Waktu Jakarta (WIB)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'JetBrains Mono', fontSize: '0.88rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text)' }}>
              {simulatedTime}
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {formatIndonesianDate(simulatedDate)}
            </span>
          </div>
        </div>

        {/* User profile short info */}
        {currentUser && (
          <div className="user-profile-badge" style={{ padding: '6px 14px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', width: 'auto' }}>
            <div 
              className="user-profile-avatar" 
              style={{ 
                width: '32px', 
                height: '32px', 
                fontSize: '0.85rem',
                backgroundImage: currentUser.photoImg ? `url(${currentUser.photoImg})` : 'none'
              }}
            >
              {!currentUser.photoImg && currentUser.name.charAt(0)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                {currentUser.role === 'admin' ? 'Staff IT' : currentUser.role === 'acc finance' ? 'Finance' : currentUser.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNavbar;
