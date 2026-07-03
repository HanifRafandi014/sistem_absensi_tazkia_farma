import React, { useState } from 'react';
import { Employee, Payroll } from '../types';
import { formatRupiah } from '../utils';

interface ModulePayrollProps {
  currentUser: Employee;
  employees: Employee[];
  payrolls: Payroll[];
  onUpdateSalary: (empId: string, basic: number, bonus: number) => void;
  onPaySalary: (newPayroll: Payroll) => void;
}

export const ModulePayroll: React.FC<ModulePayrollProps> = ({
  currentUser,
  employees,
  payrolls,
  onUpdateSalary,
  onPaySalary
}) => {
  const isFinance = currentUser.role === 'acc finance' || currentUser.role === 'owner';

  // State for Edit Salary Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetEmp, setTargetEmp] = useState<Employee | null>(null);
  const [basicSalary, setBasicSalary] = useState(0);
  const [bonus, setBonus] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('2026-07');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Pagination for Payments History Table
  const [historyPage, setHistoryPage] = useState(1);

  // Filter Employees (only staff & finance can be paid)
  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      if (emp.role !== 'staff' && emp.role !== 'acc finance') return false;

      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.position.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSearch;
    });
  };

  const filteredEmployees = getFilteredEmployees();

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter Payments History
  const filteredPayrolls = payrolls.filter(p => p.period === filterMonth);

  // History pagination
  const totalHistoryPages = Math.ceil(filteredPayrolls.length / itemsPerPage) || 1;
  const paginatedPayrolls = filteredPayrolls.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  const handleOpenEdit = (emp: Employee) => {
    setTargetEmp(emp);
    setBasicSalary(emp.basicSalary);
    setBonus(emp.bonus);
    setShowEditModal(true);
  };

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmp) return;

    onUpdateSalary(targetEmp.id, basicSalary, bonus);
    setShowEditModal(false);
    setTargetEmp(null);
  };

  // Pay salary & generate PDF slip
  const handlePaySalary = (emp: Employee) => {
    // Check if already paid for selected month
    const isAlreadyPaid = payrolls.some(p => p.employeeId === emp.id && p.period === filterMonth);
    if (isAlreadyPaid) {
      alert(`Gaji karyawan ${emp.name} untuk periode ${filterMonth} sudah dibayarkan!`);
      return;
    }

    const totalSalary = emp.basicSalary + emp.bonus;
    const newPayroll: Payroll = {
      id: 'PAY_' + Date.now().toString().slice(-6),
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      basicSalary: emp.basicSalary,
      bonus: emp.bonus,
      totalSalary,
      period: filterMonth,
      datePaid: new Date().toISOString().split('T')[0],
      status: 'Paid'
    };

    onPaySalary(newPayroll);
    alert(`Pembayaran gaji sebesar ${formatRupiah(totalSalary)} untuk ${emp.name} sukses diproses! Slip gaji PDF akan diunduh otomatis.`);

    // Generate PDF Slip Gaji dynamically using jsPDF
    const { jsPDF } = (window as any).jspdf;
    if (jsPDF) {
      const doc = new jsPDF();
      
      // Border Frame
      doc.setDrawColor(108, 92, 231);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 194, 280);

      // Logo Text or Header
      doc.setFont('Inter', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(108, 92, 231);
      doc.text('SLIP GAJI KARYAWAN RESMI', 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(99, 110, 114);
      doc.text('PT. SOLUSI KANTOR MODERN SEJAHTERA', 105, 36, { align: 'center' });
      
      // Divider
      doc.setDrawColor(223, 230, 233);
      doc.setLineWidth(0.5);
      doc.line(15, 42, 195, 42);

      // Metadata Info
      doc.setFontSize(11);
      doc.setTextColor(45, 52, 54);
      doc.text(`ID Transaksi : ${newPayroll.id}`, 20, 52);
      doc.text(`Periode Gaji : ${filterMonth}`, 20, 58);
      doc.text(`Tanggal Bayar: ${newPayroll.datePaid}`, 20, 64);

      doc.text(`Nama Karyawan: ${emp.name}`, 110, 52);
      doc.text(`Jabatan       : ${emp.position}`, 110, 58);
      doc.text(`ID Karyawan   : ${emp.id}`, 110, 64);

      doc.line(15, 72, 195, 72);

      // Table Header
      doc.setFont('Inter', 'bold');
      doc.text('DESKRIPSI PENDAPATAN', 20, 84);
      doc.text('JUMLAH (IDR)', 180, 84, { align: 'right' });

      doc.line(15, 90, 195, 90);

      // Row 1: Gaji Pokok
      doc.setFont('Inter', 'normal');
      doc.text('Gaji Pokok Utama', 20, 102);
      doc.text(formatRupiah(emp.basicSalary), 180, 102, { align: 'right' });

      // Row 2: Bonus & Insentif
      doc.text('Bonus & Insentif Kinerja', 20, 112);
      doc.text(formatRupiah(emp.bonus), 180, 112, { align: 'right' });

      doc.line(15, 122, 195, 122);

      // Total Salary
      doc.setFont('Inter', 'bold');
      doc.text('TOTAL SALARY BERSIH (TAKE HOME PAY)', 20, 134);
      doc.text(formatRupiah(totalSalary), 180, 134, { align: 'right' });

      doc.line(15, 142, 195, 142);

      // Signature Area
      doc.setFontSize(10);
      doc.text('Mengetahui,', 25, 170);
      doc.text('Accounting Finance Officer', 25, 205);
      doc.text(`( Siti Rahma )`, 25, 212);

      doc.text('Penerima,', 145, 170);
      doc.text('Karyawan Ybs,', 145, 205);
      doc.text(`( ${emp.name} )`, 145, 212);

      doc.save(`Slip_Gaji_${emp.name.replace(/\s+/g, '_')}_${filterMonth}.pdf`);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const excelData = filteredPayrolls.map((p, index) => ({
      'No': index + 1,
      'ID Pembayaran': p.id,
      'ID Karyawan': p.employeeId,
      'Nama': p.employeeName,
      'Jabatan': p.position,
      'Gaji Pokok (Rp)': p.basicSalary,
      'Bonus (Rp)': p.bonus,
      'Total Gaji (Rp)': p.totalSalary,
      'Periode': p.period,
      'Tanggal Transfer': p.datePaid,
      'Status': p.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Payroll');
    
    // Auto column width
    const maxLens = Object.keys(excelData[0] || {}).map(key => Math.max(key.length, 10));
    worksheet['!cols'] = maxLens.map(l => ({ wch: l + 4 }));

    XLSX.writeFile(workbook, `Laporan_Gaji_Karyawan_${filterMonth}.xlsx`);
  };

  return (
    <div className="fade-in">
      
      {/* 1. MANAGEMENT PAYROLL TABLE (Acc Finance view) */}
      {isFinance && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--primary)' }}></i>
              Kelola Struktur Gaji & Kirim Gaji Karyawan
            </h2>
          </div>

          <div className="card-body">
            {/* Toolbar search */}
            <div className="toolbar-row">
              <div className="search-wrapper">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari staff..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              <div className="filter-group">
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pilih Periode Pembayaran:</span>
                <select
                  className="filter-select"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
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
                    <th>ID Karyawan</th>
                    <th>Nama Karyawan</th>
                    <th>Jabatan</th>
                    <th>Gaji Pokok (IDR)</th>
                    <th>Bonus / Insentif (IDR)</th>
                    <th>Total Gaji (IDR)</th>
                    <th style={{ textAlign: 'center' }}>Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((emp, idx) => {
                      const isPaid = payrolls.some(p => p.employeeId === emp.id && p.period === filterMonth);
                      return (
                        <tr key={emp.id} style={isPaid ? { backgroundColor: 'rgba(0, 184, 148, 0.04)' } : {}}>
                          <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{emp.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.branch}</div>
                          </td>
                          <td>{emp.position}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{formatRupiah(emp.basicSalary)}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{formatRupiah(emp.bonus)}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary)' }}>
                            {formatRupiah(emp.basicSalary + emp.bonus)}
                          </td>
                           <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              {currentUser.role === 'acc finance' && (
                                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(emp)} title="Edit Struktur Gaji">
                                  <i className="fa-solid fa-pen-to-square"></i> Edit Gaji
                                </button>
                              )}
                              
                              {isPaid ? (
                                <span className="badge badge-success">
                                  <i className="fa-solid fa-circle-check"></i> Sudah Dibayar
                                </span>
                              ) : (
                                currentUser.role === 'acc finance' ? (
                                  <button className="btn btn-primary btn-sm" onClick={() => handlePaySalary(emp)}>
                                    <i className="fa-solid fa-receipt"></i> Bayar Gaji
                                  </button>
                                ) : (
                                  <span className="badge badge-warning">
                                    <i className="fa-solid fa-clock"></i> Belum Dibayar
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Tidak ada data karyawan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredEmployees.length > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Menampilkan <strong>{paginatedEmployees.length}</strong> dari <strong>{filteredEmployees.length}</strong> data staff
                </div>
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Sblmnya
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, margin: '0 8px' }}>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PAYMENTS HISTORY LIST (Available to Acc Finance (Manage) and Admin/Owner (View-Only)) */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)' }}></i>
            Riwayat Pembayaran Transfer Gaji Karyawan
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Show period selector for logs view */}
            {!isFinance && (
              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ padding: '6px 12px', minWidth: '130px' }}
              >
                <option value="2026-07">Juli 2026</option>
                <option value="2026-06">Juni 2026</option>
                <option value="2026-05">Mei 2026</option>
              </select>
            )}
            <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={filteredPayrolls.length === 0}>
              <i className="fa-solid fa-file-excel"></i> Export Excel Pembayaran
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID Slip</th>
                  <th>Karyawan</th>
                  <th>Jabatan</th>
                  <th>Periode Bulan</th>
                  <th>Transfer Masuk (IDR)</th>
                  <th>Tanggal Bayar</th>
                  <th>Status Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayrolls.length > 0 ? (
                  paginatedPayrolls.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{(historyPage - 1) * itemsPerPage + idx + 1}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{p.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.employeeId}</div>
                      </td>
                      <td>{p.position}</td>
                      <td>
                        <strong style={{ textTransform: 'uppercase' }}>{p.period}</strong>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--success)' }}>
                        {formatRupiah(p.totalSalary)}
                      </td>
                      <td>{p.datePaid}</td>
                      <td>
                        <span className="badge badge-success">
                          <i className="fa-solid fa-check-double" style={{ marginRight: '4px' }}></i> PAID / BANK TRANSFER
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-receipt" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                      Belum ada rekaman transaksi pembayaran gaji untuk periode bulan {filterMonth}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPayrolls.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Menampilkan <strong>{paginatedPayrolls.length}</strong> dari <strong>{filteredPayrolls.length}</strong> data riwayat transfer
              </div>
              <div className="pagination-buttons">
                <button
                  className="pagination-btn"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(historyPage - 1)}
                >
                  Sblmnya
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, margin: '0 8px' }}>
                  Halaman {historyPage} dari {totalHistoryPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={historyPage === totalHistoryPages}
                  onClick={() => setHistoryPage(historyPage + 1)}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL: EDIT SALARY STRUCTURE */}
      {showEditModal && targetEmp && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3><i className="fa-solid fa-wallet" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> Kelola Struktur Gaji</h3>
              <button className="btn-close-modal" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveSalary}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <strong>Karyawan:</strong> {targetEmp.name} <br />
                  <strong>Jabatan:</strong> {targetEmp.position} <br />
                  <strong>Cabang:</strong> {targetEmp.branch}
                </div>

                <div className="form-group">
                  <label className="form-label">Gaji Pokok Utama (IDR) <span>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', fontWeight: 600 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '38px', width: '100%' }}
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(Number(e.target.value))}
                      min="100000"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bonus & Insentif Kinerja (IDR)</label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', fontWeight: 600 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '38px', width: '100%' }}
                      value={bonus}
                      onChange={(e) => setBonus(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: '#e6f7f4', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Gaji Baru:</span>
                  <span>{formatRupiah(basicSalary + bonus)}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Struktur Gaji
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ModulePayroll;
