import React, { useState } from 'react';
import { Employee, Attendance } from '../types';

interface ModuleLaporanProps {
  currentUser: Employee;
  employees: Employee[];
  attendances: Attendance[];
}

export const ModuleLaporan: React.FC<ModuleLaporanProps> = ({
  currentUser,
  employees,
  attendances
}) => {
  // Date range filters (default to last 30 days)
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  // Selected employee to view detailed breakdown
  const [selectedEmpId, setSelectedEmpId] = useState('All');

  // Aggregated data computation
  const getAggregatedData = () => {
    // Filter attendances within date range
    const inRangeAtts = attendances.filter(att => att.date >= startDate && att.date <= endDate);

    // Filter by employee if selected
    const filteredAtts = selectedEmpId === 'All' 
      ? inRangeAtts 
      : inRangeAtts.filter(a => a.employeeId === selectedEmpId);

    // List of employees to aggregate (only staff and finance who do attendance)
    const activeEmployees = employees.filter(e => e.role === 'staff' || e.role === 'acc finance' || e.role === 'admin');

    const result = activeEmployees.map(emp => {
      const empAtts = inRangeAtts.filter(a => a.employeeId === emp.id);
      
      const hadir = empAtts.filter(a => a.status === 'H').length;
      const terlambat = empAtts.filter(a => a.status === 'Terlambat').length;
      const sakit = empAtts.filter(a => a.status === 'S').length;
      const izin = empAtts.filter(a => a.status === 'I').length;
      const alpa = empAtts.filter(a => a.status === 'A').length;
      const totalDays = empAtts.length;

      return {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        branch: emp.branch,
        hadir,
        terlambat,
        sakit,
        izin,
        alpa,
        totalDays,
        lateRate: totalDays > 0 ? Math.round((terlambat / (hadir + terlambat || 1)) * 100) : 0
      };
    });

    return {
      individual: result,
      totals: {
        hadir: filteredAtts.filter(a => a.status === 'H').length,
        terlambat: filteredAtts.filter(a => a.status === 'Terlambat').length,
        sakit: filteredAtts.filter(a => a.status === 'S').length,
        izin: filteredAtts.filter(a => a.status === 'I').length,
        alpa: filteredAtts.filter(a => a.status === 'A').length,
        total: filteredAtts.length
      }
    };
  };

  const reportData = getAggregatedData();
  const totals = reportData.totals;

  const latenessRate = totals.total > 0 
    ? Math.round((totals.terlambat / (totals.hadir + totals.terlambat || 1)) * 100) 
    : 0;

  // Export PDF using jsPDF + AutoTable
  const handleExportPDF = () => {
    const { jsPDF } = (window as any).jspdf;
    if (!jsPDF) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFont('Inter', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(108, 92, 231); // brand primary
    doc.text('REKAPITULASI LAPORAN ABSENSI KANTOR', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(45, 52, 54);
    doc.text(`Periode Laporan: ${startDate} s/d ${endDate}`, 14, 26);
    doc.text(`Dicetak Oleh: ${currentUser.name} (${currentUser.position})`, 14, 32);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 38);

    // Summary Box
    doc.setFillColor(241, 242, 246);
    doc.roundedRect(14, 44, 182, 22, 4, 4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(99, 110, 114);
    doc.text('RINGKASAN KEHADIRAN (Seluruh Karyawan):', 18, 50);
    doc.setTextColor(45, 52, 54);
    doc.text(`Hadir: ${totals.hadir} Hari  |  Terlambat: ${totals.terlambat} Hari  |  Sakit: ${totals.sakit} Hari  |  Izin: ${totals.izin} Hari  |  Alpa: ${totals.alpa} Hari`, 18, 58);

    // Build Table Body
    const headers = [['No', 'ID', 'Nama Karyawan', 'Jabatan', 'Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpa', 'Rasio Terlambat']];
    const rows = reportData.individual.map((emp, idx) => [
      idx + 1,
      emp.id,
      emp.name,
      emp.position,
      emp.hadir,
      emp.terlambat,
      emp.sakit,
      emp.izin,
      emp.alpa,
      `${emp.lateRate}%`
    ]);

    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 72,
      theme: 'grid',
      headStyles: { fillColor: [108, 92, 231], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 },
      columnStyles: {
        2: { cellWidth: 40 },
        3: { cellWidth: 35 }
      }
    });

    doc.save(`Rekap_Absensi_Karyawan_${startDate}_${endDate}.pdf`);
  };

  // Export Excel using SheetJS
  const handleExportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const excelData = reportData.individual.map((emp, idx) => ({
      'No': idx + 1,
      'ID Karyawan': emp.id,
      'Nama': emp.name,
      'Jabatan': emp.position,
      'Cabang': emp.branch,
      'Hadir (Hari)': emp.hadir,
      'Terlambat (Hari)': emp.terlambat,
      'Sakit (Hari)': emp.sakit,
      'Izin (Hari)': emp.izin,
      'Alpa (Hari)': emp.alpa,
      'Persentase Terlambat': `${emp.lateRate}%`,
      'Total Terdaftar': emp.totalDays
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Kehadiran');
    
    // Auto column widths
    const maxLens = Object.keys(excelData[0] || {}).map(key => Math.max(key.length, 10));
    worksheet['!cols'] = maxLens.map(l => ({ wch: l + 4 }));

    XLSX.writeFile(workbook, `Rekap_Absensi_Karyawan_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="fade-in">
      
      {/* FILTER CONTROL BOARD */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-sliders" style={{ color: 'var(--primary)' }}></i>
            Filter Rekapitulasi Laporan Kehadiran
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} disabled={reportData.individual.length === 0}>
              <i className="fa-solid fa-file-pdf" style={{ color: 'var(--danger)' }}></i> Cetak PDF
            </button>
            <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={reportData.individual.length === 0}>
              <i className="fa-solid fa-file-excel"></i> Cetak Excel
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="toolbar-row" style={{ marginBottom: 0 }}>
            <div className="filter-group">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tanggal Mulai</span>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ minWidth: '160px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tanggal Akhir</span>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ minWidth: '160px' }}
                />
              </div>
            </div>

            <div className="filter-group">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pilih Fokus Grafik Karyawan</span>
                <select
                  className="filter-select"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  style={{ minWidth: '220px' }}
                >
                  <option value="All">Semua Karyawan (Kumulatif)</option>
                  {employees
                    .filter(emp => emp.role === 'staff' || emp.role === 'acc finance' || emp.role === 'admin')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS DASHBOARD CARDS */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-green">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Total Hadir</div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>{totals.hadir} Hari</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon icon-orange">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Total Terlambat</div>
            <div className="stat-card-value" style={{ color: 'var(--terlambat)' }}>{totals.terlambat} Hari</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <i className="fa-solid fa-file-medical"></i>
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Sakit / Izin</div>
            <div className="stat-card-value" style={{ color: 'var(--primary)' }}>{totals.sakit + totals.izin} Hari</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon icon-red">
            <i className="fa-solid fa-circle-xmark"></i>
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Mangkir / Alpa</div>
            <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{totals.alpa} Hari</div>
          </div>
        </div>
      </div>

      {/* DUAL COLUMN: GRAPH AND DATA LIST */}
      <div className="analytics-grid">
        
        {/* INTERACTIVE CUSTOM GRAPH CHART CONTAINER */}
        <div className="analytics-chart-container">
          <h3 className="card-title" style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '14px' }}>
            <i className="fa-solid fa-chart-bar" style={{ color: 'var(--primary)' }}></i>
            Visualisasi Rasio Kehadiran Individu Karyawan
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Grafik di bawah menggambarkan persentase Rasio Keterlambatan kerja (semakin kecil, semakin disiplin).
          </p>

          <div className="chart-bar-list">
            {reportData.individual.map(emp => {
              // Calculate rasio hadir tepat waktu vs telat
              const totalHadirSesi = emp.hadir + emp.terlambat;
              const disciplineRate = totalHadirSesi > 0 
                ? Math.round((emp.hadir / totalHadirSesi) * 100)
                : 100;

              return (
                <div className="chart-bar-item" key={emp.id}>
                  <span className="chart-bar-label" title={emp.name}>{emp.name}</span>
                  <div className="chart-bar-track">
                    <div 
                      className="chart-bar-fill" 
                      style={{ 
                        width: `${disciplineRate}%`, 
                        backgroundColor: disciplineRate >= 90 ? 'var(--success)' : (disciplineRate >= 70 ? 'var(--warning)' : 'var(--danger)')
                      }}
                      title={`Tepat Waktu: ${disciplineRate}%`}
                    ></div>
                  </div>
                  <span className="chart-bar-value">{disciplineRate}%</span>
                </div>
              );
            })}
          </div>

          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: 'var(--success)' }}></span>
              <span>Disiplin Tinggi (&ge;90%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: 'var(--warning)' }}></span>
              <span>Perlu Perbaikan (70%-89%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: 'var(--danger)' }}></span>
              <span>Disiplin Rendah (&lt;70%)</span>
            </div>
          </div>
        </div>

        {/* RATIO LATENESS RATE PANEL */}
        <div className="analytics-chart-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '20px' }}>Rasio Keterlambatan Kumulatif</h3>
          
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '10px solid #f1f2f6', borderTopColor: 'var(--terlambat)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
              {latenessRate}%
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '20px', lineHeight: '1.4' }}>
            Dari total <strong>{totals.hadir + totals.terlambat}</strong> kehadiran kerja yang tercatat, sebanyak <strong>{totals.terlambat}</strong> kedatangan terdeteksi terlambat masuk shift.
          </p>
        </div>

      </div>

      {/* TABLE DATA LIST */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tabel Rekapitulasi Absensi</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID</th>
                  <th>Nama Karyawan</th>
                  <th>Jabatan</th>
                  <th>Cabang</th>
                  <th>Hadir (H)</th>
                  <th>Terlambat (T)</th>
                  <th>Sakit (S)</th>
                  <th>Izin (I)</th>
                  <th>Alpa (A)</th>
                  <th>Rasio Terlambat</th>
                </tr>
              </thead>
              <tbody>
                {reportData.individual.map((emp, idx) => (
                  <tr key={emp.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{emp.id}</td>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td>{emp.position}</td>
                    <td>{emp.branch}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{emp.hadir} Hari</td>
                    <td style={{ fontWeight: 600, color: 'var(--terlambat)' }}>{emp.terlambat} Hari</td>
                    <td>{emp.sakit} Hari</td>
                    <td>{emp.izin} Hari</td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{emp.alpa} Hari</td>
                    <td>
                      <span className={`badge ${emp.lateRate > 30 ? 'badge-danger' : (emp.lateRate > 10 ? 'badge-warning' : 'badge-success')}`}>
                        {emp.lateRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ModuleLaporan;
