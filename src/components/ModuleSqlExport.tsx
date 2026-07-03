import React, { useState } from 'react';
import { Employee, Attendance, DailyReport, ShiftSchedule, Invoice, Payroll } from '../types';
import { generateSQLDump } from '../utils';

interface ModuleSqlExportProps {
  currentUser: Employee;
  employees: Employee[];
  attendances: Attendance[];
  dailyReports: DailyReport[];
  shifts: ShiftSchedule[];
  invoices: Invoice[];
  payrolls: Payroll[];
}

export const ModuleSqlExport: React.FC<ModuleSqlExportProps> = ({
  currentUser,
  employees,
  attendances,
  dailyReports,
  shifts,
  invoices,
  payrolls
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner';
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="alert alert-danger fade-in">
        <i className="fa-solid fa-circle-exclamation"></i>
        <div>Akses Ditolak! Hanya administrator utama dan Owner yang memiliki otoritas untuk mengekspor database relasional SQL perusahaan.</div>
      </div>
    );
  }

  // Generate the SQL script string using utility
  const sqlDump = generateSQLDump(
    employees,
    attendances,
    dailyReports,
    invoices,
    payrolls
  );

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(sqlDump);
    setFeedback('Sukses! Script SQL berhasil disalin ke clipboard.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlDump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sistem_Absensi_Database_Backup_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setFeedback('Sukses! File database relasional .sql berhasil diunduh.');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-database" style={{ color: 'var(--primary)' }}></i>
            Database Relasional SQL Exporter & Backup Engine
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyClipboard}>
              <i className="fa-solid fa-copy"></i> Salin SQL Script
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadSql}>
              <i className="fa-solid fa-download"></i> Download SQL File
            </button>
          </div>
        </div>

        <div className="card-body">
          {feedback && (
            <div className="alert alert-success">
              <i className="fa-solid fa-circle-check"></i>
              <div>{feedback}</div>
            </div>
          )}

          <div style={{ padding: '14px', backgroundColor: '#efedfd', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500, marginBottom: '20px', lineHeight: '1.4' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i> 
            <strong>Info Migrasi Server:</strong> Script SQL di bawah ini secara otomatis mendefinisikan struktur skema relational tables (DDL) serta menghasilkan insert statements (DML) data real-time perusahaan Anda. Script ini siap di-import langsung ke sistem database PostgreSQL / MySQL server lokal maupun cloud server produksi.
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', right: '14px', backgroundColor: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, pointerEvents: 'none', textTransform: 'uppercase' }}>
              Relational DDL / DML Schema
            </div>
            
            <textarea
              className="form-control"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                color: '#2d3436',
                backgroundColor: '#f1f2f6',
                borderColor: 'var(--border)',
                whiteSpace: 'pre',
                overflowX: 'auto',
                padding: '20px',
                height: '450px',
                width: '100%',
                borderRadius: 'var(--radius)'
              }}
              value={sqlDump}
              readOnly
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>
              Total Baris Terdefinisi: <strong>{sqlDump.split('\n').length} baris SQL</strong>
            </div>
            <div>
              Status Sinkronisasi: <span style={{ color: 'var(--success)', fontWeight: 700 }}>● Terkoneksi (Local Sandbox)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModuleSqlExport;
