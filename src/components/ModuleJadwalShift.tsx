import React, { useState } from 'react';
import { Employee, ShiftSchedule } from '../types';

interface ModuleJadwalShiftProps {
  currentUser: Employee;
  simulatedDate: string;
  employees: Employee[];
  shifts: ShiftSchedule[];
  onAddShift: (newShift: ShiftSchedule) => void;
  onDeleteShift: (id: string) => void;
}

export const ModuleJadwalShift: React.FC<ModuleJadwalShiftProps> = ({
  currentUser,
  simulatedDate,
  employees,
  shifts,
  onAddShift,
  onDeleteShift
}) => {
  const isStaffOrFinance = currentUser.role === 'staff' || currentUser.role === 'acc finance';
  const isAdmin = currentUser.role === 'admin';

  // State for Admin Modal Form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [shiftType, setShiftType] = useState<'Pagi' | 'Sore'>('Pagi');
  const [shiftDate, setShiftDate] = useState(simulatedDate);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter Schedules
  const getFilteredShifts = () => {
    return shifts.filter((s) => {
      // If Staff or Finance: only show their own schedules
      if (isStaffOrFinance && s.employeeId !== currentUser.id) {
        return false;
      }

      const matchSearch = s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMonth = filterMonth === 'All' || s.date.startsWith(filterMonth);
      const matchType = filterType === 'All' || s.shiftType === filterType;

      return matchSearch && matchMonth && matchType;
    });
  };

  const filteredShifts = getFilteredShifts();

  // Sorting: newest date first, then by employee ID
  const sortedShifts = [...filteredShifts].sort((a, b) => b.date.localeCompare(a.date));

  // Pagination compute
  const totalPages = Math.ceil(sortedShifts.length / itemsPerPage) || 1;
  const paginatedShifts = sortedShifts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setFeedback('Silakan pilih karyawan terlebih dahulu!');
      return;
    }

    const employeeObj = employees.find(emp => emp.id === selectedEmpId);
    if (!employeeObj) return;

    // Check for duplicate shift assignment on same date
    const isDuplicate = shifts.some(s => s.employeeId === selectedEmpId && s.date === shiftDate);
    if (isDuplicate) {
      setFeedback(`Karyawan ${employeeObj.name} sudah memiliki jadwal shift pada tanggal ${shiftDate}!`);
      return;
    }

    const newShift: ShiftSchedule = {
      id: 'SH_' + Date.now().toString().slice(-6),
      employeeId: selectedEmpId,
      employeeName: employeeObj.name,
      shiftType,
      date: shiftDate
    };

    onAddShift(newShift);
    setFeedback('Sukses! Jadwal shift berhasil ditugaskan.');
    setTimeout(() => {
      setShowAssignModal(false);
      setSelectedEmpId('');
      setFeedback(null);
    }, 1500);
    setCurrentPage(1);
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-calendar-days" style={{ color: 'var(--primary)' }}></i>
            {isStaffOrFinance ? 'Jadwal Shift Kerja Saya' : 'Penjadwalan Shift Seluruh Karyawan'}
          </h2>
          
          {/* Admin Schedule assign button */}
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssignModal(true)}>
              <i className="fa-solid fa-calendar-plus"></i> Atur Jadwal Shift Baru
            </button>
          )}
        </div>

        <div className="card-body">
          {/* Filters Area */}
          <div className="toolbar-row">
            
            {/* Search (only for Admin/Owner) */}
            {!isStaffOrFinance ? (
              <div className="search-wrapper">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama / ID karyawan..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            ) : <div />}

            <div className="filter-group">
              {/* Shift Type Filter */}
              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
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

          {/* Table */}
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Karyawan</th>
                  <th>Tanggal Penugasan</th>
                  <th>Jenis Shift</th>
                  <th>Jam Kerja (WIB)</th>
                  <th>Status Aturan</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedShifts.length > 0 ? (
                  paginatedShifts.map((s, idx) => {
                    const isToday = s.date === simulatedDate;
                    return (
                      <tr key={s.id} style={isToday ? { backgroundColor: 'rgba(108, 92, 231, 0.05)' } : {}}>
                        <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.employeeName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {s.employeeId}</div>
                        </td>
                        <td>
                          <strong>{s.date}</strong> {isToday && <span className="badge badge-success" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>Hari Ini</span>}
                        </td>
                        <td>
                          <span className={`badge ${s.shiftType === 'Pagi' ? 'badge-info' : 'badge-warning'}`}>
                            Shift {s.shiftType}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>
                          {s.shiftType === 'Pagi' ? '07.00 - 15.00' : '13.00 - 21.00'}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            {s.shiftType === 'Pagi' 
                              ? 'Terlambat > 07:00 | Pulang terkunci sebelum 15:00' 
                              : 'Terlambat > 13:00 | Pulang terkunci sebelum 21:00'
                            }
                          </div>
                        </td>
                        {isAdmin && (
                          <td>
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => onDeleteShift(s.id)}
                              title="Hapus Jadwal"
                              style={{ padding: '4px 8px', borderRadius: '4px' }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
                      Belum ada jadwal shift kerja yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredShifts.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Menampilkan <strong>{paginatedShifts.length}</strong> dari <strong>{filteredShifts.length}</strong> data shift
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

      {/* POPUP MODAL: ASSIGN SHIFT (Only for Admin) */}
      {showAssignModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3><i className="fa-solid fa-calendar-plus" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> Atur Jadwal Shift</h3>
              <button className="btn-close-modal" onClick={() => setShowAssignModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAssignShift}>
              <div className="modal-body">
                {feedback && (
                  <div className={`alert ${feedback.includes('Sukses') ? 'alert-success' : 'alert-danger'}`}>
                    <i className={`fa-solid ${feedback.includes('Sukses') ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                    <div>{feedback}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Karyawan <span>*</span></label>
                  <select
                    className="form-control"
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Staff / Finance / IT --</option>
                    {employees
                      .filter(emp => emp.role === 'staff' || emp.role === 'acc finance' || emp.role === 'admin')
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position} - {emp.id})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Penugasan <span>*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Shift Kerja <span>*</span></label>
                  <select
                    className="form-control"
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as 'Pagi' | 'Sore')}
                  >
                    <option value="Pagi">Shift Pagi (07.00 - 15.00)</option>
                    <option value="Sore">Shift Sore (13.00 - 21.00)</option>
                  </select>
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: '#efedfd', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                  <i className="fa-solid fa-circle-question" style={{ marginRight: '6px' }}></i> 
                  Sistem akan mengunci check-out staff hingga shift berakhir, serta menandai kedatangan terlambat jika masuk melewati jam shift.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Jadwal Shift
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ModuleJadwalShift;
