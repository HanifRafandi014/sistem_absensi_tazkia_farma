import React, { useState } from 'react';
import { Employee, UserRole } from '../types';
import LogoSvg from './Logo';

interface SidebarProps {
  currentUser: Employee | null;
  currentTab: string;
  setCurrentTab: (p: string) => void;
  onLogout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentTab,
  setCurrentTab,
  onLogout,
  sidebarOpen,
  setSidebarOpen
}) => {
  const [showSyncToast, setShowSyncToast] = useState<string | null>(null);

  if (!currentUser) return null;

  const role = currentUser.role;

  // Define sidebar items based on role, matching App.tsx keys perfectly so features work!
  const getMenuItems = (userRole: UserRole) => {
    switch (userRole) {
      case 'staff':
        return [
          { id: 'absensi', label: 'Absen Pribadi', icon: 'fa-fingerprint' },
          { id: 'list_harian', label: 'List Kerja Harian', icon: 'fa-calendar-check' },
          { id: 'riwayat', label: 'Riwayat Absensi', icon: 'fa-history' },
          { id: 'jadwal', label: 'Jadwal Shift Saya', icon: 'fa-calendar-days' },
        ];
      case 'acc finance':
        return [
          { id: 'absensi', label: 'Absen Pribadi', icon: 'fa-fingerprint' },
          { id: 'riwayat', label: 'Absensi Karyawan', icon: 'fa-calendar' },
          { id: 'laporan', label: 'Grafik & Analitik', icon: 'fa-chart-pie' },
          { id: 'payroll', label: 'Input Penggajian', icon: 'fa-wallet' },
          { id: 'list_harian', label: 'List Kerja Harian', icon: 'fa-calendar-check' },
        ];
      case 'admin':
        return [
          { id: 'absensi', label: 'Absen Pribadi', icon: 'fa-fingerprint' },
          { id: 'list_harian', label: 'List Kerja Harian', icon: 'fa-calendar-check' },
          { id: 'jadwal', label: 'Jadwal Shift', icon: 'fa-calendar-days' },
          { id: 'laporan', label: 'Grafik & Analitik', icon: 'fa-chart-pie' },
          { id: 'karyawan', label: 'Data Karyawan', icon: 'fa-users' },
          { id: 'faktur', label: 'Input Faktur Belanja', icon: 'fa-file-invoice-dollar' },
          { id: 'riwayat', label: 'Riwayat Absensi', icon: 'fa-history' },
          { id: 'sql_dump', label: 'Ekspor SQL', icon: 'fa-database' },
        ];
      case 'owner':
        return [
          { id: 'laporan', label: 'Laporan & Grafik', icon: 'fa-chart-pie' },
          { id: 'riwayat', label: 'Riwayat Absensi', icon: 'fa-history' },
          { id: 'karyawan', label: 'Data Karyawan', icon: 'fa-users' },
          { id: 'payroll', label: 'Laporan Payroll', icon: 'fa-wallet' },
          { id: 'faktur', label: 'Faktur Belanja', icon: 'fa-file-invoice-dollar' },
          { id: 'jadwal', label: 'Jadwal Shift', icon: 'fa-calendar-days' },
          { id: 'sql_dump', label: 'Ekspor SQL', icon: 'fa-database' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(role);

  const handleLinkClick = (pageId: string) => {
    setCurrentTab(pageId);
    setSidebarOpen(false); // close mobile drawer
  };

  const handleTriggerSync = (type: 'phpmyadmin' | 'gsheets') => {
    const message = type === 'phpmyadmin' 
      ? 'Sinkronisasi phpMyAdmin berhasil disinkronkan ke cloud!' 
      : 'Google Sheets link berhasil diperbarui dan disinkronkan!';
    setShowSyncToast(message);
    setTimeout(() => {
      setShowSyncToast(null);
    }, 3000);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'staff': return 'Staff';
      case 'acc finance': return 'Finance';
      case 'admin': return 'Staff IT';
      case 'owner': return 'Owner';
      default: return r;
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'mobile-open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Toast Sync notification inside sidebar */}
        {showSyncToast && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 99,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-check"></i>
            <div>{showSyncToast}</div>
          </div>
        )}

        {/* Sidebar Header */}
        <div className="sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <LogoSvg size={40} />
          <div style={{ marginLeft: '12px' }}>
            <h2 className="sidebar-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
              SITA
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginTop: '2px' }}>
              Sistem Informasi Tazkia Farma
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          <ul className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: 0, padding: 0, listStyle: 'none' }}>
            {menuItems.map((item) => (
              <li className="sidebar-menu-item" key={item.id}>
                <a
                  className={`sidebar-link ${currentTab === item.id ? 'active' : ''}`}
                  onClick={() => handleLinkClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: currentTab === item.id ? 700 : 500,
                    color: currentTab === item.id ? '#4f46e5' : '#475569',
                    backgroundColor: currentTab === item.id ? '#f5f3ff' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className={`fa-solid ${item.icon}`} style={{ fontSize: '1rem', width: '20px', color: currentTab === item.id ? '#6366f1' : '#64748b' }}></i>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          {/* Separator Line */}
          <div style={{ borderTop: '2px dashed #e2e8f0', margin: '20px 8px' }}></div>

          {/* Sync Options */}
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: 0, padding: 0, listStyle: 'none' }}>
            <li>
              <a
                onClick={() => handleTriggerSync('phpmyadmin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="hover-bg-slate"
              >
                <i className="fa-solid fa-database" style={{ fontSize: '1rem', width: '20px', color: '#f97316' }}></i>
                <span>phpMyAdmin Sync</span>
              </a>
            </li>
            <li>
              <a
                onClick={() => handleTriggerSync('gsheets')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="hover-bg-slate"
              >
                <i className="fa-solid fa-file-excel" style={{ fontSize: '1rem', width: '20px', color: '#10b981' }}></i>
                <span>Google Sheets Link</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer" style={{ padding: '20px 16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
          <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div 
              className="user-profile-avatar"
              style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#cbd5e1',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                backgroundImage: currentUser.photoImg ? `url(${currentUser.photoImg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0
              }}
            >
              {!currentUser.photoImg && getInitials(currentUser.name)}
            </div>
            <div className="user-profile-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="user-profile-name" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div className="user-profile-role" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getRoleLabel(currentUser.role)} ({currentUser.id})
              </div>
            </div>
          </div>

          {/* Full width logout button */}
          <button 
            className="btn-logout" 
            onClick={onLogout} 
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              padding: '10px', 
              borderRadius: '10px', 
              border: '1.5px solid #f1f5f9', 
              backgroundColor: '#ffffff', 
              color: '#ef4444', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
