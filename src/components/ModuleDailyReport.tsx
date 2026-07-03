import React, { useState } from 'react';
import { Employee, DailyReport } from '../types';
import { formatRupiah } from '../utils';

interface ModuleDailyReportProps {
  currentUser: Employee;
  simulatedDate: string;
  dailyReports: DailyReport[];
  onAddReport: (newReport: DailyReport) => void;
}

export const ModuleDailyReport: React.FC<ModuleDailyReportProps> = ({
  currentUser,
  simulatedDate,
  dailyReports,
  onAddReport
}) => {
  const isOwner = currentUser.role === 'owner';
  const isAdminOrFinance = currentUser.role === 'admin' || currentUser.role === 'acc finance';

  // State for form
  const [shift, setShift] = useState<'Pagi' | 'Sore'>('Pagi');
  const [date, setDate] = useState(simulatedDate);
  const [dailyTask, setDailyTask] = useState('');
  const [shiftRevenue, setShiftRevenue] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter States for the list table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All'); // YYYY-MM
  const [filterBranch, setFilterBranch] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter daily reports list
  const getFilteredReports = () => {
    return dailyReports.filter((rep) => {
      // Role constraints: staff only sees their own reports
      if (currentUser.role === 'staff' && rep.employeeId !== currentUser.id) {
        return false;
      }
      
      const matchSearch = 
        rep.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rep.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.dailyTask.toLowerCase().includes(searchTerm.toLowerCase());

      const matchShift = filterShift === 'All' || rep.shift === filterShift;
      const matchBranch = filterBranch === 'All' || rep.branchName === filterBranch;
      
      const matchMonth = filterMonth === 'All' || rep.date.startsWith(filterMonth);

      return matchSearch && matchShift && matchBranch && matchMonth;
    });
  };

  const filteredReports = getFilteredReports();

  // Pagination computation
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyTask.trim()) {
      setFeedback('Harap isi Tugas Harian Anda hari ini!');
      return;
    }

    const newReport: DailyReport = {
      id: 'REP_' + Date.now().toString().slice(-6),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      position: currentUser.position,
      branchName: currentUser.branch,
      shift,
      date,
      dailyTask,
      shiftRevenue
    };

    onAddReport(newReport);
    setDailyTask('');
    setShiftRevenue(0);
    setFeedback('Laporan list harian Anda berhasil disimpan!');
    setTimeout(() => setFeedback(null), 3000);
    setCurrentPage(1); // Reset page to 1
  };

  // Excel export using SheetJS
  const handleExportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    // Map data for clean headers in excel
    const excelData = filteredReports.map((r, index) => ({
      'No': index + 1,
      'ID Laporan': r.id,
      'Karyawan': r.employeeName,
      'Jabatan': r.position,
      'Cabang': r.branchName,
      'Tanggal': r.date,
      'Shift': r.shift,
      'Tugas Harian': r.dailyTask,
      'Omset Shift (Rp)': r.shiftRevenue
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Harian');
    
    // Auto-fit column widths
    const maxLens = Object.keys(excelData[0] || {}).map(key => Math.max(key.length, 10));
    worksheet['!cols'] = maxLens.map(l => ({ wch: l + 4 }));

    XLSX.writeFile(
      workbook, 
      `Laporan_List_Harian_${filterMonth !== 'All' ? filterMonth : 'Semua_Bulan'}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Get unique branches for filtering
  const branches = Array.from(new Set(dailyReports.map(r => r.branchName)));

  return (
    <div className="fade-in">
      {/* FORM TO ADD REPORT (Disabled for Owner) */}
      {!isOwner && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fa-solid fa-file-pen" style={{ color: 'var(--primary)' }}></i>
              Isi Laporan List Kerja Harian
            </h2>
          </div>
          <div className="card-body">
            {feedback && (
              <div className="alert alert-success">
                <i className="fa-solid fa-circle-check"></i>
                <div>{feedback}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-grid">
              
              {/* Employee Name (Disabled) */}
              <div className="form-group">
                <label className="form-label">Nama Karyawan <span>(Terkunci)</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={currentUser.name}
                  disabled
                  style={{ backgroundColor: '#f1f2f6', color: 'var(--text-muted)' }}
                />
              </div>

              {/* Position (Disabled) */}
              <div className="form-group">
                <label className="form-label">Jabatan Karyawan <span>(Terkunci)</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={currentUser.position}
                  disabled
                  style={{ backgroundColor: '#f1f2f6', color: 'var(--text-muted)' }}
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label">Tanggal Laporan</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Shift Selection */}
              <div className="form-group">
                <label className="form-label">Shift Kerja</label>
                <select
                  className="form-control"
                  value={shift}
                  onChange={(e) => setShift(e.target.value as 'Pagi' | 'Sore')}
                >
                  <option value="Pagi">Shift Pagi (07.00 - 15.00)</option>
                  <option value="Sore">Shift Sore (13.00 - 21.00)</option>
                </select>
              </div>

              {/* Shift Revenue */}
              <div className="form-group form-grid-full">
                <label className="form-label">Omset Shift Hari Ini (IDR / Rupiah)</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', fontWeight: 600, fontSize: '0.85rem' }}>Rp</span>
                  <input
                    type="number"
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="Masukkan jumlah omset selama shift, isi 0 jika tidak ada transaksi..."
                    value={shiftRevenue || ''}
                    onChange={(e) => setShiftRevenue(Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>

              {/* Daily Tasks */}
              <div className="form-group form-grid-full">
                <label className="form-label">Tugas & Kinerja Harian <span>*</span></label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Detail kegiatan hari ini (contoh: mempacking 20 koli barang, melayani 5 customer, stock opname bulanan...)"
                  value={dailyTask}
                  onChange={(e) => setDailyTask(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-grid-full" style={{ textAlign: 'right', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Simpan Laporan Harian
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW REPORTS LIST */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i>
            {currentUser.role === 'staff' ? 'Riwayat List Harian Saya' : 'Laporan List Harian Seluruh Karyawan'}
          </h2>
          <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={filteredReports.length === 0}>
            <i className="fa-solid fa-file-excel"></i> Export Excel
          </button>
        </div>

        <div className="card-body">
          {/* Toolbar Filters */}
          <div className="toolbar-row">
            
            {/* Realtime Search (Disabled for staff since they only see their own anyway) */}
            {currentUser.role !== 'staff' ? (
              <div className="search-wrapper">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama karyawan, tugas..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            ) : <div />}

            <div className="filter-group">
              {/* Branch Filter (only for admin/finance/owner) */}
              {currentUser.role !== 'staff' && (
                <select
                  className="filter-select"
                  value={filterBranch}
                  onChange={(e) => { setFilterBranch(e.target.value); setCurrentPage(1); }}
                >
                  <option value="All">Semua Cabang</option>
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}

              {/* Shift Filter */}
              <select
                className="filter-select"
                value={filterShift}
                onChange={(e) => { setFilterShift(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">Semua Shift</option>
                <option value="Pagi">Shift Pagi</option>
                <option value="Sore">Shift Sore</option>
              </select>

              {/* Month Filter */}
              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">Semua Bulan</option>
                <option value="2026-07">Juli 2026</option>
                <option value="2026-06">Juni 2026</option>
                <option value="2026-05">Mei 2026</option>
              </select>
            </div>

          </div>

          {/* TABLE DISPLAY */}
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Karyawan</th>
                  <th>Jabatan</th>
                  <th>Cabang</th>
                  <th>Tanggal</th>
                  <th>Shift</th>
                  <th style={{ width: '40%' }}>Tugas Harian</th>
                  <th>Omset</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.length > 0 ? (
                  paginatedReports.map((rep, idx) => (
                    <tr key={rep.id}>
                      <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rep.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {rep.employeeId}</div>
                      </td>
                      <td>{rep.position}</td>
                      <td>{rep.branchName}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{rep.date}</td>
                      <td>
                        <span className={`badge ${rep.shift === 'Pagi' ? 'badge-info' : 'badge-warning'}`}>
                          {rep.shift}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                          {rep.dailyTask}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: rep.shiftRevenue > 0 ? 'var(--success)' : 'var(--text)' }}>
                        {rep.shiftRevenue > 0 ? formatRupiah(rep.shiftRevenue) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      <i className="fa-regular fa-folder-open" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
                      Belum ada laporan list harian kerja yang memenuhi filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredReports.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Menampilkan <strong>{paginatedReports.length}</strong> dari <strong>{filteredReports.length}</strong> data laporan
              </div>
              <div className="pagination-buttons">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <i className="fa-solid fa-chevron-left"></i> Sblmnya
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, margin: '0 8px' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Selanjutnya <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ModuleDailyReport;
