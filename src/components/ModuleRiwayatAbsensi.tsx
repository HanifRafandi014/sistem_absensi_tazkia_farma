import React, { useState } from 'react';
import { Employee, Attendance } from '../types';

interface ModuleRiwayatAbsensiProps {
  currentUser: Employee;
  attendances: Attendance[];
}

export const ModuleRiwayatAbsensi: React.FC<ModuleRiwayatAbsensiProps> = ({
  currentUser,
  attendances
}) => {
  const isStaff = currentUser.role === 'staff';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('All'); // YYYY-MM
  const [filterStatus, setFilterStatus] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Attendance list
  const getFilteredAttendance = () => {
    return attendances.filter((att) => {
      // If Staff: only see their own attendance
      if (isStaff && att.employeeId !== currentUser.id) {
        return false;
      }

      const matchSearch = att.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        att.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMonth = filterMonth === 'All' || att.date.startsWith(filterMonth);
      const matchStatus = filterStatus === 'All' || att.status === filterStatus;

      return matchSearch && matchMonth && matchStatus;
    });
  };

  const filteredAttendance = getFilteredAttendance();

  // Sort: Newest date first, then by check-in time
  const sortedAttendance = [...filteredAttendance].sort((a, b) => b.date.localeCompare(a.date));

  // Pagination
  const totalPages = Math.ceil(sortedAttendance.length / itemsPerPage) || 1;
  const paginatedAttendance = sortedAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Excel export using SheetJS
  const handleExportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const excelData = sortedAttendance.map((a, index) => ({
      'No': index + 1,
      'ID Absensi': a.id,
      'ID Karyawan': a.employeeId,
      'Nama Karyawan': a.employeeName,
      'Role': a.role.toUpperCase(),
      'Tanggal': a.date,
      'Jam Masuk (Check-In)': a.checkInTime || '-',
      'Jam Pulang (Check-Out)': a.checkOutTime || '-',
      'Status': a.status === 'H' ? 'HADIR' : (a.status === 'S' ? 'SAKIT' : (a.status === 'I' ? 'IZIN' : (a.status === 'A' ? 'ALPA' : 'TERLAMBAT'))),
      'Keterangan / Alasan': a.keterangan || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat_Absensi');
    
    // Auto column widths
    const maxLens = Object.keys(excelData[0] || {}).map(key => Math.max(key.length, 10));
    worksheet['!cols'] = maxLens.map(l => ({ wch: l + 4 }));

    XLSX.writeFile(
      workbook, 
      `Riwayat_Absensi_${isStaff ? currentUser.name.replace(/\s+/g, '_') : 'Seluruh_Karyawan'}_${filterMonth !== 'All' ? filterMonth : 'Semua_Bulan'}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)' }}></i>
            {isStaff ? 'Riwayat Absensi Saya' : 'Laporan & Riwayat Absensi Karyawan'}
          </h2>
          <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={sortedAttendance.length === 0}>
            <i className="fa-solid fa-file-excel"></i> Export Excel
          </button>
        </div>

        <div className="card-body">
          {/* Toolbar Filters */}
          <div className="toolbar-row">
            
            {/* Search (only for Admin/Finance/Owner) */}
            {!isStaff ? (
              <div className="search-wrapper">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama atau ID karyawan..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            ) : <div />}

            <div className="filter-group">
              {/* Status Filter */}
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">Semua Status</option>
                <option value="H">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="S">Sakit</option>
                <option value="I">Izin</option>
                <option value="A">Alpa</option>
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

          {/* Table Display */}
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID Karyawan</th>
                  <th>Nama Karyawan</th>
                  <th>Tanggal</th>
                  <th>Jam Datang</th>
                  <th>Jam Pulang</th>
                  <th>Status</th>
                  <th>Keterangan / Alasan</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttendance.length > 0 ? (
                  paginatedAttendance.map((a, idx) => {
                    // Decide status class
                    let statusBadge = 'badge-success';
                    if (a.status === 'Terlambat') statusBadge = 'badge-orange';
                    else if (a.status === 'S') statusBadge = 'badge-info';
                    else if (a.status === 'I') statusBadge = 'badge-warning';
                    else if (a.status === 'A') statusBadge = 'badge-danger';

                    const statusLabel = a.status === 'H' ? 'Hadir' : (a.status === 'S' ? 'Sakit' : (a.status === 'I' ? 'Izin' : (a.status === 'A' ? 'Alpa' : 'Terlambat')));

                    return (
                      <tr key={a.id}>
                        <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.employeeId}</td>
                        <td style={{ fontWeight: 600 }}>{a.employeeName}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{a.date}</td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>{a.checkInTime || '-'}</td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>{a.checkOutTime || '-'}</td>
                        <td>
                          <span className={`badge ${statusBadge}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.keterangan || '-'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-folder-minus" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
                      Tidak ada catatan riwayat absensi yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredAttendance.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Menampilkan <strong>{paginatedAttendance.length}</strong> dari <strong>{filteredAttendance.length}</strong> riwayat absensi
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

export default ModuleRiwayatAbsensi;
