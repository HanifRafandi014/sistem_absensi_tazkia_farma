import React, { useState } from 'react';
import { Employee, UserRole } from '../types';

interface ModuleKaryawanProps {
  currentUser: Employee;
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onBulkDeleteEmployees: (ids: string[]) => void;
  onImportEmployees: (imported: Employee[]) => void;
}

export const ModuleKaryawan: React.FC<ModuleKaryawanProps> = ({
  currentUser,
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBulkDeleteEmployees,
  onImportEmployees
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isOwner = currentUser.role === 'owner';

  // Modal control states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEmpId, setEditEmpId] = useState('');

  // Form Fields State
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [mainJobdesk, setMainJobdesk] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Document Uploads (Base64 strings)
  const [photoImg, setPhotoImg] = useState<string | null>(null);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<string | null>(null);
  const [diplomaFile, setDiplomaFile] = useState<string | null>(null);

  // File Upload text previews
  const [cvFileName, setCvFileName] = useState('');
  const [diplomaFileName, setDiplomaFileName] = useState('');

  // Table Filter & Bulk Selection States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Document Modal Lightbox state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Filter employees
  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = filterRole === 'All' || emp.role === filterRole;
      const matchBranch = filterBranch === 'All' || emp.branch === filterBranch;

      return matchSearch && matchRole && matchBranch;
    });
  };

  const filtered = getFilteredEmployees();

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedEmployees = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedEmployees.map(emp => emp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (empId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, empId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== empId));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} karyawan terpilih secara permanen?`)) {
      onBulkDeleteEmployees(selectedIds);
      setSelectedIds([]);
      setCurrentPage(1);
    }
  };

  // Base64 helper
  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void, nameSetter?: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (nameSetter) nameSetter(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setName('');
    setPosition('');
    setPhone('');
    setBranch('Apotek Tazkia Farma1');
    setRole('staff');
    setMainJobdesk('');
    setUsername('');
    setPassword('');
    setPhotoImg(null);
    setSignatureImg(null);
    setCvFile(null);
    setDiplomaFile(null);
    setCvFileName('');
    setDiplomaFileName('');
    setShowFormModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setIsEditMode(true);
    setEditEmpId(emp.id);
    setName(emp.name);
    setPosition(emp.position);
    setPhone(emp.phone);
    setBranch(emp.branch);
    setRole(emp.role);
    setMainJobdesk(emp.mainJobdesk);
    setUsername(emp.username);
    setPassword(''); // leave blank unless changing
    setPhotoImg(emp.photoImg);
    setSignatureImg(emp.signatureImg);
    setCvFile(emp.cvFile);
    setDiplomaFile(emp.diplomaFile);
    setCvFileName(emp.cvFile ? 'CV_Tersimpan.pdf' : '');
    setDiplomaFileName(emp.diplomaFile ? 'Ijazah_Tersimpan.pdf' : '');
    setShowFormModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      const oldEmp = employees.find(emp => emp.id === editEmpId);
      if (!oldEmp) return;

      const updated: Employee = {
        ...oldEmp,
        name,
        position,
        phone,
        branch,
        role,
        mainJobdesk,
        username,
        photoImg,
        signatureImg,
        cvFile,
        diplomaFile,
        passwordHash: password ? password : oldEmp.passwordHash // leave unchanged if blank
      };
      onUpdateEmployee(updated);
      alert('Data karyawan berhasil diupdate!');
    } else {
      // Auto increment ID (AB01, AB02...)
      const ids = employees.map(emp => parseInt(emp.id.replace('AB', '')));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const nextId = 'AB' + String(maxId + 1).padStart(2, '0');

      const newEmp: Employee = {
        id: nextId,
        name,
        position,
        phone,
        branch,
        role,
        mainJobdesk,
        photoImg,
        signatureImg,
        cvFile,
        diplomaFile,
        username: username || nextId.toLowerCase(),
        passwordHash: password || '123456', // default
        basicSalary: 4500000, // default starter
        bonus: 0
      };
      onAddEmployee(newEmp);
      alert(`Karyawan baru berhasil ditambahkan dengan ID: ${nextId}!`);
    }

    setShowFormModal(false);
  };

  const handleDeleteRow = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus karyawan "${name}"? Semua riwayat absen dan kinerjanya juga akan terhapus.`)) {
      onDeleteEmployee(id);
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  // XLSX Import Handler using SheetJS
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const XLSX = (window as any).XLSX;
        if (!XLSX) return;

        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Read sheets as array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          alert('File Excel kosong atau tidak terbaca!');
          return;
        }

        // Validate Headers: Check if keys exist in case insensitive manner (fuzzy matching)
        const keys = Object.keys(rawJson[0]);
        const keyMap: { [key: string]: string } = {};

        const findKey = (target: string) => {
          return keys.find(k => k.toLowerCase().replace(/\s+/g, '').includes(target.toLowerCase()));
        };

        const namaKey = findKey('nama');
        const idKey = findKey('id');
        const jabatanKey = findKey('jabatan');
        const phoneKey = findKey('hp') || findKey('telepon') || findKey('phone');

        if (!namaKey || !idKey || !jabatanKey || !phoneKey) {
          alert('Format Kolom Tidak Valid! Pastikan terdapat kolom "Nama", "ID", "Jabatan", dan "No HP" (tidak sensitif huruf besar/kecil).');
          return;
        }

        // Map data to Employee objects, filtering duplicates
        const importedEmployees: Employee[] = [];
        rawJson.forEach((row) => {
          const empId = String(row[idKey]).trim().toUpperCase();
          
          // Avoid duplicate inside spreadsheet or local state
          const isDuplicateState = employees.some(emp => emp.id === empId);
          const isDuplicateImport = importedEmployees.some(emp => emp.id === empId);

          if (!isDuplicateState && !isDuplicateImport) {
            importedEmployees.push({
              id: empId,
              name: String(row[namaKey]).trim(),
              position: String(row[jabatanKey]).trim(),
              phone: String(row[phoneKey]).trim(),
              branch: 'Apotek Tazkia Farma1', // Default
              role: 'staff',
              mainJobdesk: 'Staff diimpor dari file excel harian.',
              photoImg: null,
              signatureImg: null,
              cvFile: null,
              diplomaFile: null,
              username: empId.toLowerCase(),
              passwordHash: '123456', // default starter
              basicSalary: 4500000,
              bonus: 0
            });
          }
        });

        if (importedEmployees.length > 0) {
          onImportEmployees(importedEmployees);
          alert(`Berhasil mengimpor ${importedEmployees.length} karyawan baru dari Excel!`);
        } else {
          alert('Semua ID karyawan di Excel sudah ada di database lokal (tidak ada data baru yang diimpor).');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal memproses file Excel. Pastikan format file .xlsx/.xls valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Export data Excel
  const handleExportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const excelData = filtered.map((emp, idx) => ({
      'No': idx + 1,
      'ID Karyawan': emp.id,
      'Nama': emp.name,
      'Jabatan': emp.position,
      'No HP': emp.phone,
      'Cabang': emp.branch,
      'Role': emp.role.toUpperCase(),
      'Jobdesk Utama': emp.mainJobdesk,
      'Gaji Pokok (Rp)': emp.basicSalary
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Karyawan');
    
    const maxLens = Object.keys(excelData[0] || {}).map(key => Math.max(key.length, 10));
    worksheet['!cols'] = maxLens.map(l => ({ wch: l + 4 }));

    XLSX.writeFile(workbook, `Database_Karyawan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const triggerDownloadBase64 = (base64Data: string | null, defaultFilename: string) => {
    if (!base64Data) return;
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique branches
  const branches = Array.from(new Set(employees.map(e => e.branch)));

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i>
            Data Master & Dokumen Karyawan
          </h2>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isAdmin && (
              <>
                {/* Excel Import button wrapper */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button className="btn btn-secondary btn-sm">
                    <i className="fa-solid fa-file-import"></i> Impor Excel
                  </button>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleImportExcel}
                    style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    title="Impor Database Karyawan"
                  />
                </div>
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <i className="fa-solid fa-user-plus"></i> Tambah Karyawan Baru
                </button>
              </>
            )}
            <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={filtered.length === 0}>
              <i className="fa-solid fa-file-excel"></i> Ekspor Excel Karyawan
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Toolbar Search & filters */}
          <div className="toolbar-row">
            <div className="search-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Cari karyawan, jabatan, ID..."
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

              {/* Role Filter */}
              <select
                className="filter-select"
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">Semua Role</option>
                <option value="staff">Staff</option>
                <option value="acc finance">Accounting Finance</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          {/* BULK ACTION BAR */}
          {isAdmin && selectedIds.length > 0 && (
            <div className="bulk-action-bar">
              <span className="bulk-action-text">
                <i className="fa-solid fa-circle-info"></i> {selectedIds.length} Karyawan terpilih untuk bulk action
              </span>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                <i className="fa-solid fa-user-minus"></i> Hapus Terpilih
              </button>
            </div>
          )}

          {/* TABLE DISPLAY */}
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  {isAdmin && (
                    <th className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedEmployees.length && paginatedEmployees.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>Foto</th>
                  <th>ID</th>
                  <th>Nama Karyawan</th>
                  <th>Jabatan / Kontak</th>
                  <th>Role Portal</th>
                  <th style={{ width: '25%' }}>Jobdesk Utama</th>
                  <th>Berkas Administrasi</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp.id} style={selectedIds.includes(emp.id) ? { backgroundColor: 'rgba(108, 92, 231, 0.04)' } : {}}>
                      {isAdmin && (
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(emp.id)}
                            onChange={(e) => handleSelectRow(emp.id, e.target.checked)}
                          />
                        </td>
                      )}
                      <td>
                        <div className="avatar-cell-container">
                          {emp.photoImg ? (
                            <img
                              src={emp.photoImg}
                              className="avatar-thumbnail"
                              alt={emp.name}
                              onClick={() => setLightboxSrc(emp.photoImg)}
                              style={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <div className="avatar-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                              {emp.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.branch}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{emp.position}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-phone" style={{ fontSize: '0.7rem' }}></i> {emp.phone}</div>
                      </td>
                      <td>
                        <span className={`badge ${emp.role === 'admin' ? 'badge-danger' : (emp.role === 'acc finance' ? 'badge-info' : (emp.role === 'owner' ? 'badge-success' : 'badge-warning'))}`}>
                          {emp.role === 'admin' ? 'Staff IT' : emp.role === 'acc finance' ? 'Finance' : emp.role === 'owner' ? 'Owner' : 'Staff'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {emp.mainJobdesk}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                          {emp.cvFile ? (
                            <a href="#" className="file-link-btn" onClick={() => triggerDownloadBase64(emp.cvFile, `CV_${emp.name.replace(/\s+/g, '_')}.pdf`)}>
                              <i className="fa-regular fa-file-pdf text-red"></i> Download CV.pdf
                            </a>
                          ) : <span style={{ color: '#ccc' }}>- CV Kosong</span>}

                          {emp.diplomaFile ? (
                            <a href="#" className="file-link-btn" onClick={() => triggerDownloadBase64(emp.diplomaFile, `Ijazah_${emp.name.replace(/\s+/g, '_')}.pdf`)}>
                              <i className="fa-solid fa-graduation-cap"></i> Download Ijazah.pdf
                            </a>
                          ) : <span style={{ color: '#ccc' }}>- Ijazah Kosong</span>}

                          {emp.signatureImg ? (
                            <a href="#" className="file-link-btn" onClick={() => setLightboxSrc(emp.signatureImg)}>
                              <i className="fa-solid fa-signature"></i> Lihat TTD Digital
                            </a>
                          ) : <span style={{ color: '#ccc' }}>- TTD Kosong</span>}
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(emp)} title="Edit Karyawan" style={{ padding: '6px' }}>
                              <i className="fa-solid fa-user-gear"></i>
                            </button>
                            {emp.id !== currentUser.id && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRow(emp.id, emp.name)} title="Hapus Karyawan" style={{ padding: '6px' }}>
                                <i className="fa-solid fa-user-slash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Tidak ada karyawan yang terdaftar atau memenuhi kriteria.
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
                Menampilkan <strong>{paginatedEmployees.length}</strong> dari <strong>{filtered.length}</strong> data karyawan
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

      {/* POPUP MODAL: ADD / EDIT EMPLOYEE FORM (Admin Only) */}
      {showFormModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>
                <i className={`fa-solid ${isEditMode ? 'fa-user-gear' : 'fa-user-plus'}`} style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                {isEditMode ? 'Update Data Karyawan' : 'Daftarkan Karyawan Baru'}
              </h3>
              <button className="btn-close-modal" onClick={() => setShowFormModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Name */}
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Karyawan <span>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Budi Prasetyo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Position */}
                <div className="form-group">
                  <label className="form-label">Jabatan Pekerjaan <span>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Staff Gudang Logistik"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label">No Handphone / WA <span>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                {/* Branch */}
                <div className="form-group">
                  <label className="form-label">Penempatan Cabang <span>*</span></label>
                  <select
                    className="form-control"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                  >
                    <option value="Apotek Tazkia Farma1">Apotek Tazkia Farma1</option>
                    <option value="Apotek Kedai Sehat">Apotek Kedai Sehat</option>
                    <option value="Apotek Surya Sehat">Apotek Surya Sehat</option>
                    <option value="Apotek Wonodadi">Apotek Wonodadi</option>
                  </select>
                </div>

                {/* Role */}
                <div className="form-group">
                  <label className="form-label">Otoritas Portal (Role) <span>*</span></label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    required
                  >
                    <option value="staff">Staff Lapangan</option>
                    <option value="acc finance">Accounting Finance</option>
                    <option value="admin">Staff IT</option>
                    <option value="owner">Owner / Direksi</option>
                  </select>
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="form-label">Username Login <span>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username portal unik..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Password Login {isEditMode ? ' (Kosongkan jika tidak ingin mengubah)' : ' *'}</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={isEditMode ? "Masukkan sandi baru..." : "Masukkan sandi awal..."}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEditMode}
                  />
                </div>

                {/* Jobdesk Utama */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Uraian Jobdesk Utama Pekerjaan <span>*</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Uraikan tanggung jawab utama karyawan ini..."
                    value={mainJobdesk}
                    onChange={(e) => setMainJobdesk(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* DOCUMENT UPLOADS */}
                <div style={{ gridColumn: 'span 2', fontWeight: 700, fontSize: '0.9rem', borderTop: '1px solid var(--border)', paddingTop: '12px', color: 'var(--primary)' }}>
                  <i className="fa-solid fa-folder-open"></i> Upload Dokumen & Foto Karyawan (Base64)
                </div>

                {/* Foto Pas Karyawan */}
                <div className="form-group">
                  <label className="form-label">Foto Pas Karyawan</label>
                  <div className="file-upload-zone">
                    <i className="fa-regular fa-image file-upload-icon"></i>
                    <p className="file-upload-text">Upload Foto JPG/PNG</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileRead(e, setPhotoImg)}
                      style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
                      id="upload-photo"
                    />
                    <label htmlFor="upload-photo" className="btn btn-secondary btn-sm" style={{ marginTop: '8px', display: 'inline-flex' }}>Pilih Foto</label>
                    {photoImg && (
                      <div className="file-upload-preview">
                        <i className="fa-solid fa-check"></i> Foto Diunggah
                      </div>
                    )}
                  </div>
                </div>

                {/* Tanda Tangan Digital */}
                <div className="form-group">
                  <label className="form-label">Ttd Digital Karyawan</label>
                  <div className="file-upload-zone">
                    <i className="fa-solid fa-signature file-upload-icon"></i>
                    <p className="file-upload-text">Upload TTD PNG</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileRead(e, setSignatureImg)}
                      style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
                      id="upload-signature"
                    />
                    <label htmlFor="upload-signature" className="btn btn-secondary btn-sm" style={{ marginTop: '8px', display: 'inline-flex' }}>Pilih TTD</label>
                    {signatureImg && (
                      <div className="file-upload-preview">
                        <i className="fa-solid fa-check"></i> TTD Terpasang
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload berkas CV */}
                <div className="form-group">
                  <label className="form-label">Upload Berkas CV (PDF)</label>
                  <div className="file-upload-zone">
                    <i className="fa-regular fa-file-pdf file-upload-icon" style={{ color: 'var(--danger)' }}></i>
                    <p className="file-upload-text">{cvFileName ? cvFileName : 'Klik atau drag file CV PDF'}</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileRead(e, setCvFile, setCvFileName)}
                      style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
                      id="upload-cv"
                    />
                    <label htmlFor="upload-cv" className="btn btn-secondary btn-sm" style={{ marginTop: '8px', display: 'inline-flex' }}>Pilih Berkas PDF</label>
                  </div>
                </div>

                {/* Upload berkas Ijazah */}
                <div className="form-group">
                  <label className="form-label">Upload Ijazah Terakhir (PDF)</label>
                  <div className="file-upload-zone">
                    <i className="fa-regular fa-file-pdf file-upload-icon" style={{ color: 'var(--danger)' }}></i>
                    <p className="file-upload-text">{diplomaFileName ? diplomaFileName : 'Klik atau drag file Ijazah PDF'}</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileRead(e, setDiplomaFile, setDiplomaFileName)}
                      style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
                      id="upload-diploma"
                    />
                    <label htmlFor="upload-diploma" className="btn btn-secondary btn-sm" style={{ marginTop: '8px', display: 'inline-flex' }}>Pilih Berkas PDF</label>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? 'Update Data Karyawan' : 'Daftarkan Karyawan'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX MODAL */}
      {lightboxSrc && (
        <div className="modal-backdrop" onClick={() => setLightboxSrc(null)} style={{ zIndex: 2000 }}>
          <div style={{ maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <img src={lightboxSrc} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }} alt="Pratinjau Dokumen" />
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

export default ModuleKaryawan;
