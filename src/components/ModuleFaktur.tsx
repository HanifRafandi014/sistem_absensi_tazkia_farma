import React, { useState } from 'react';
import { Employee, Invoice } from '../types';
import { formatRupiah } from '../utils';

interface ModuleFakturProps {
  currentUser: Employee;
  invoices: Invoice[];
  onAddInvoice: (newInv: Invoice) => void;
}

export const ModuleFaktur: React.FC<ModuleFakturProps> = ({
  currentUser,
  invoices,
  onAddInvoice
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Form Fields
  const [invoiceNo, setInvoiceNo] = useState('');
  const [branchName, setBranchName] = useState('Cabang Jakarta Pusat');
  const [jenisFaktur, setJenisFaktur] = useState<'Kongsionasi' | 'Pembelian' | 'SP OOT'>('Pembelian');
  const [namaSupplier, setNamaSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [total, setTotal] = useState<number>(0);
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterJenisFaktur, setFilterJenisFaktur] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Image Lightbox State
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Filter list
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      const matchSearch = 
        inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.namaSupplier && inv.namaSupplier.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchBranch = filterBranch === 'All' || inv.branchName === filterBranch;
      const matchJenis = filterJenisFaktur === 'All' || inv.jenisFaktur === filterJenisFaktur;
      const matchMonth = filterMonth === 'All' || inv.date.startsWith(filterMonth);

      return matchSearch && matchBranch && matchJenis && matchMonth;
    });
  };

  const filtered = getFilteredInvoices();

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedInvoices = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Base64 file reader for receipt photo (< 1mb validation)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Gagal! Ukuran berkas foto melebihi batas 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setInvoicePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNo.trim()) {
      alert('Harap isi No Faktur!');
      return;
    }

    if (!namaSupplier.trim()) {
      alert('Harap isi Nama Supplier!');
      return;
    }

    // Check duplicate
    if (invoices.some(inv => inv.invoiceNo.toLowerCase() === invoiceNo.trim().toLowerCase())) {
      alert('Nomor Faktur sudah terdaftar sebelumnya!');
      return;
    }

    const newInv: Invoice = {
      id: 'INV_' + Date.now().toString().slice(-6),
      invoiceNo: invoiceNo.trim(),
      branchName,
      jenisFaktur,
      namaSupplier: namaSupplier.trim(),
      date,
      total,
      invoicePhoto
    };

    onAddInvoice(newInv);
    setInvoiceNo('');
    setNamaSupplier('');
    setJenisFaktur('Pembelian');
    setTotal(0);
    setInvoicePhoto(null);
    setFeedback('Faktur belanja baru berhasil diinput ke sistem!');
    setTimeout(() => setFeedback(null), 3000);
    setCurrentPage(1);
  };

  // Excel Export
  const handleExportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const excelData = filtered.map((inv, idx) => ({
      'No': idx + 1,
      'ID Faktur': inv.id,
      'Nomor Faktur': inv.invoiceNo,
      'Cabang': inv.branchName,
      'Jenis Faktur': inv.jenisFaktur,
      'Nama Supplier': inv.namaSupplier,
      'Tanggal Input': inv.date,
      'Total Belanja (Rp)': inv.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    
    const maxLens = Object.keys(excelData[0] || {}).map(key => Math.max(key.length, 10));
    worksheet['!cols'] = maxLens.map(l => ({ wch: l + 4 }));

    XLSX.writeFile(workbook, `Rekap_Faktur_Belanja_${filterMonth !== 'All' ? filterMonth : 'Semua_Bulan'}.xlsx`);
  };

  const branches = Array.from(new Set(invoices.map(i => i.branchName)));

  return (
    <div className="fade-in">
      
      {/* INPUT FORM (Only for Admin) */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fa-solid fa-receipt" style={{ color: 'var(--primary)' }}></i>
              Input Faktur / Nota Belanja Kantor Baru
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
              
              {/* Invoice No */}
              <div className="form-group">
                <label className="form-label">Nomor Faktur Belanja <span>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: FAK/2026/07/213"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  required
                />
              </div>

              {/* Branch Selection */}
              <div className="form-group">
                <label className="form-label">Cabang Pembelanjaan <span>*</span></label>
                <select
                  className="form-control"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  required
                >
                  <option value="Cabang Jakarta Pusat">Cabang Jakarta Pusat</option>
                  <option value="Cabang Bandung Timur">Cabang Bandung Timur</option>
                  <option value="Cabang Surabaya Barat">Cabang Surabaya Barat</option>
                  <option value="Cabang Head Office">Cabang Head Office</option>
                </select>
              </div>

              {/* Jenis Faktur */}
              <div className="form-group">
                <label className="form-label">Jenis Faktur <span>*</span></label>
                <select
                  className="form-control"
                  value={jenisFaktur}
                  onChange={(e) => setJenisFaktur(e.target.value as any)}
                  required
                >
                  <option value="Pembelian">Pembelian</option>
                  <option value="Kongsionasi">Kongsionasi</option>
                  <option value="SP OOT">SP OOT</option>
                </select>
              </div>

              {/* Nama Supplier */}
              <div className="form-group">
                <label className="form-label">Nama Supplier <span>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: PT. Kimia Farma / Distributor Jaya"
                  value={namaSupplier}
                  onChange={(e) => setNamaSupplier(e.target.value)}
                  required
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label">Tanggal Transaksi <span>*</span></label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Total Belanja */}
              <div className="form-group">
                <label className="form-label">Total Belanja (IDR / Rupiah) <span>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', fontWeight: 600 }}>Rp</span>
                  <input
                    type="number"
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="Masukkan total nominal pembelanjaan..."
                    value={total || ''}
                    onChange={(e) => setTotal(Number(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Upload Invoice Receipt Photo */}
              <div className="form-group form-grid-full">
                <label className="form-label">Foto Bukti Nota / Faktur Belanja (Maks 1MB) <span>*</span></label>
                <div className="file-upload-zone" style={{ padding: '24px' }}>
                  <i className="fa-solid fa-camera file-upload-icon" style={{ fontSize: '1.8rem' }}></i>
                  <p className="file-upload-text">Klik untuk Upload / Ambil Foto Bukti Pembelian</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mendukung format JPG, PNG, GIF</p>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
                    id="upload-receipt-photo"
                  />
                  <label htmlFor="upload-receipt-photo" className="btn btn-secondary btn-sm" style={{ marginTop: '10px', display: 'inline-flex' }}>
                    Pilih File Foto
                  </label>

                  {invoicePhoto && (
                    <div className="file-upload-preview" style={{ marginTop: '12px' }}>
                      <i className="fa-solid fa-circle-check"></i> Foto Nota Belanja Berhasil Diunggah!
                      <img src={invoicePhoto} alt="Preview" style={{ display: 'block', maxWidth: '80px', maxHeight: '60px', marginTop: '6px', borderRadius: '4px', border: '1px solid var(--border)', margin: '6px auto' }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-grid-full" style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-file-invoice-dollar"></i> Simpan Faktur Belanja
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW FACTURS LIST */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i>
            Tabel Rekapitulasi Faktur & Pengeluaran Kantor
          </h2>
          <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={filtered.length === 0}>
            <i className="fa-solid fa-file-excel"></i> Export Excel
          </button>
        </div>

        <div className="card-body">
          {/* Filters Row */}
          <div className="toolbar-row">
            <div className="search-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Cari nomor faktur / supplier..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="filter-group">
              {/* Branch Filter */}
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

              {/* Jenis Faktur Filter */}
              <select
                className="filter-select"
                value={filterJenisFaktur}
                onChange={(e) => { setFilterJenisFaktur(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">Semua Jenis Faktur</option>
                <option value="Pembelian">Pembelian</option>
                <option value="Kongsionasi">Kongsionasi</option>
                <option value="SP OOT">SP OOT</option>
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

          {/* Table display */}
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID Faktur</th>
                  <th>Nomor Faktur Belanja</th>
                  <th>Cabang Operasional</th>
                  <th>Jenis Faktur</th>
                  <th>Nama Supplier</th>
                  <th>Tanggal Input</th>
                  <th>Total Pengeluaran (Rp)</th>
                  <th style={{ textAlign: 'center' }}>Pratinjau Nota Bukti</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((inv, idx) => (
                    <tr key={inv.id}>
                      <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{inv.id}</td>
                      <td style={{ fontWeight: 600 }}>{inv.invoiceNo}</td>
                      <td>{inv.branchName}</td>
                      <td>
                        <span className={`badge ${
                          inv.jenisFaktur === 'Pembelian' ? 'badge-info' : 
                          inv.jenisFaktur === 'Kongsionasi' ? 'badge-warning' : 'badge-secondary'
                        }`}>
                          {inv.jenisFaktur || '-'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.namaSupplier || '-'}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--danger)' }}>
                        {formatRupiah(inv.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {inv.invoicePhoto ? (
                          <img
                            src={inv.invoicePhoto}
                            className="invoice-preview-img"
                            alt="Faktur"
                            onClick={() => setLightboxSrc(inv.invoicePhoto)}
                            title="Klik untuk Perbesar Foto Nota"
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            <i className="fa-solid fa-ban"></i> Tanpa Bukti
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-file-excel" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                      Belum ada faktur belanja kantor yang diinput.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filtered.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Menampilkan <strong>{paginatedInvoices.length}</strong> dari <strong>{filtered.length}</strong> data faktur
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

      {/* RECEIPT IMAGE LIGHTBOX MODAL */}
      {lightboxSrc && (
        <div className="modal-backdrop" onClick={() => setLightboxSrc(null)} style={{ zIndex: 2000 }}>
          <div style={{ maxWidth: '90%', maxHeight: '90%', backgroundColor: 'white', padding: '16px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
            <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700 }}>Pratinjau Foto Bukti Pembayaran</h4>
            <img src={lightboxSrc} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain' }} alt="Nota Faktur Bukti" />
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLightboxSrc(null)}>
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModuleFaktur;