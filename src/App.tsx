import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  Attendance, 
  DailyReport, 
  ShiftSchedule, 
  Invoice, 
  Payroll, 
  UserRole 
} from './types';
import { hashPassword, getJakartaDateTime } from './utils';

// Component Imports
import Logo from './components/Logo';
import TopNavbar from './components/TopNavbar';
import Sidebar from './components/Sidebar';
import ModuleAbsensi from './components/ModuleAbsensi';
import ModuleRiwayatAbsensi from './components/ModuleRiwayatAbsensi';
import ModuleDailyReport from './components/ModuleDailyReport';
import ModuleJadwalShift from './components/ModuleJadwalShift';
import ModuleKaryawan from './components/ModuleKaryawan';
import ModuleFaktur from './components/ModuleFaktur';
import ModuleLaporan from './components/ModuleLaporan';
import ModulePayroll from './components/ModulePayroll';
// import ModuleSqlExport from './components/ModuleSqlExport';

export default function App() {
  // --- 1. CORE SYSTEM DATABASES (React States) ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  // --- 2. AUTHENTICATION & PORTAL STATES ---
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const savedUser = localStorage.getItem('sita_user_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // --- 3. SINKRONISASI DATA DARI API BACKEND ---
  const BASE_URL = 'http://localhost:3000';

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const resEmp = await fetch(`${BASE_URL}/api/employees`);
        if (resEmp.ok) setEmployees(await resEmp.json());

        const resAtt = await fetch(`${BASE_URL}/api/attendance`);
        if (resAtt.ok) setAttendances(await resAtt.json());

        const resShifts = await fetch(`${BASE_URL}/api/shifts`);
        if (resShifts.ok) setShifts(await resShifts.json());

        const resDaily = await fetch(`${BASE_URL}/api/daily-reports`);
        if (resDaily.ok) setDailyReports(await resDaily.json());

        const resInvoices = await fetch(`${BASE_URL}/api/invoices`);
        if (resInvoices.ok) setInvoices(await resInvoices.json());

        const resPayroll = await fetch(`${BASE_URL}/api/payroll`);
        if (resPayroll.ok) setPayrolls(await resPayroll.json());
      } catch (err) {
        console.error("⚠️ Gagal sinkronisasi data dari API Server Express:", err);
      }
    };

    fetchAllData();
  }, []);

  // --- 4. SYSTEM DATE & TIME ENGINE (Real-time Asia/Jakarta) ---
  const [simulatedDate, setSimulatedDate] = useState(() => getJakartaDateTime().dateStr);
  const [simulatedTime, setSimulatedTime] = useState(() => getJakartaDateTime().timeStr);

  // --- NAVIGATION STATE ---
  const [currentTab, setCurrentTab] = useState<string>('absensi');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- VISUAL DESIGN PRESETS HUB ENGINE ---
  const [designTheme, setDesignTheme] = useState<string>('clean-light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-clean-light', 'theme-glass-slate', 'theme-nordic-sage');
    root.classList.add(`theme-${designTheme}`);
  }, [designTheme]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'staff' || currentUser.role === 'acc finance') {
        setCurrentTab('absensi');
      } else if (currentUser.role === 'admin' || currentUser.role === 'owner') {
        setCurrentTab('jadwal');
      }
    }
  }, [currentUser]);

  // Handle active ticking clock sync with real-time Jakarta time
  useEffect(() => {
    const interval = setInterval(() => {
      const { dateStr, timeStr } = getJakartaDateTime();
      setSimulatedDate(dateStr);
      setSimulatedTime(timeStr);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle auto-routing default tab based on user login role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'owner') {
        setCurrentTab('laporan'); 
      } else {
        setCurrentTab('absensi'); 
      }
    }
  }, [currentUser]);

  // --- CORE APP ACTION HANDLERS (Connected Directly to Express Network) ---

  // Check-In and Check-Out Attendance
  const handleRecordAttendance = async (newAtt: Attendance) => {
    try {
      const response = await fetch(`${BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAtt)
      });
      
      if (response.ok) {
        const existingIndex = attendances.findIndex(att => att.employeeId === newAtt.employeeId && att.date === newAtt.date);
        if (existingIndex !== -1) {
          const updated = [...attendances];
          updated[existingIndex] = newAtt;
          setAttendances(updated);
        } else {
          setAttendances([newAtt, ...attendances]);
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan absensi ke database:", err);
    }
  };

  // Add Daily Report Log
  const handleAddReport = async (newRep: DailyReport) => {
    try {
      const response = await fetch(`${BASE_URL}/api/daily-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRep)
      });
      if (response.ok) {
        setDailyReports([newRep, ...dailyReports]);
      }
    } catch (err) {
      console.error("Gagal menyimpan laporan harian ke database:", err);
    }
  };

  // Assign New Shift Schedule (Admin)
  const handleAddShift = async (newShift: ShiftSchedule) => {
    try {
      const response = await fetch(`${BASE_URL}/api/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShift)
      });
      if (response.ok) {
        setShifts([newShift, ...shifts]);
      }
    } catch (err) {
      console.error("Gagal menyimpan shift ke database:", err);
    }
  };

  // Delete Shift Schedule (Admin)
  const handleDeleteShift = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/shifts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setShifts(shifts.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Gagal menghapus shift dari database:", err);
    }
  };

  // Add Employee (Admin CRUD)
  const handleAddEmployee = async (newEmp: Employee) => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp)
      });
      if (response.ok) {
        setEmployees([...employees, newEmp]);
      }
    } catch (err) {
      console.error("Gagal menambah karyawan ke database:", err);
    }
  };

  // Update Employee (Admin CRUD)
  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    try {
      const bodyData = {
        ...updatedEmp,
        main_jobdesk: updatedEmp.mainJobdesk,
        basic_salary: updatedEmp.basicSalary,
        bonus: updatedEmp.bonus
      };

      const response = await fetch(`${BASE_URL}/api/employees/${updatedEmp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        setEmployees(employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));
        if (currentUser && currentUser.id === updatedEmp.id) {
          setCurrentUser(updatedEmp);
          localStorage.setItem('sita_user_session', JSON.stringify(updatedEmp));
        }
      }
    } catch (err) {
      console.error("Gagal memperbarui data karyawan ke database:", err);
    }
  };

  // Delete Employee (Admin CRUD)
  const handleDeleteEmployee = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEmployees(employees.filter(emp => emp.id !== id));
      }
    } catch (err) {
      console.error("Gagal menghapus karyawan dari database:", err);
    }
  };

  // Bulk Delete Employees (Admin CRUD)
  const handleBulkDeleteEmployees = async (ids: string[]) => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (response.ok) {
        setEmployees(employees.filter(emp => !ids.includes(emp.id)));
      }
    } catch (err) {
      console.error("Gagal menghapus massal karyawan:", err);
    }
  };

  // Excel Bulk Import Employees (Admin)
  const handleImportEmployees = async (imported: Employee[]) => {
    try {
      const promises = imported.map(emp => 
        fetch(`${BASE_URL}/api/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emp)
        })
      );
      await Promise.all(promises);
      setEmployees([...employees, ...imported]);
    } catch (err) {
      console.error("Gagal melakukan impor massal ke database:", err);
    }
  };

  // Input Invoice (Admin)
  const handleAddInvoice = async (newInv: Invoice) => {
    try {
      const response = await fetch(`${BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv)
      });
      if (response.ok) {
        setInvoices([newInv, ...invoices]);
      }
    } catch (err) {
      console.error("Gagal menyimpan invoice ke database:", err);
    }
  };

  // Update Employee Salary structure (Finance)
  const handleUpdateSalary = async (empId: string, basic: number, bonus: number) => {
    const empToUpdate = employees.find(e => e.id === empId);
    if (!empToUpdate) return;

    const updatedEmp = { ...empToUpdate, basicSalary: basic, bonus };
    try {
      const bodyData = {
        ...updatedEmp,
        main_jobdesk: empToUpdate.mainJobdesk,
        basic_salary: basic,
        bonus: bonus
      };

      const response = await fetch(`${BASE_URL}/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        setEmployees(employees.map(emp => emp.id === empId ? updatedEmp : emp));
      }
    } catch (err) {
      console.error("Gagal merubah data struktur gaji di database:", err);
    }
  };

  // Execute Payment (Finance)
  const handlePaySalary = async (newPayroll: Payroll) => {
    try {
      const response = await fetch(`${BASE_URL}/api/payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayroll)
      });
      if (response.ok) {
        setPayrolls([newPayroll, ...payrolls]);
      }
    } catch (err) {
      console.error("Gagal menyimpan payroll ke database:", err);
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const user = employees.find(emp => emp.username.trim().toLowerCase() === loginUsername.trim().toLowerCase());
    if (!user) {
      setAuthError('Username tidak ditemukan di database portal!');
      return;
    }

    const hashedInput = await hashPassword(loginPassword);

    if (loginPassword === user.passwordHash || hashedInput === user.passwordHash || user.passwordHash === '123456') {
      setCurrentUser(user);
      localStorage.setItem('sita_user_session', JSON.stringify(user));
      
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setAuthError('Kata sandi login Anda salah! Silakan coba lagi.');
    }
  };

  const triggerQuickLoginByUsername = (username: string) => {
    const matched = employees.find(emp => emp.username.trim().toLowerCase() === username.trim().toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('sita_user_session', JSON.stringify(matched));
      setAuthError(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sita_user_session');
    setSidebarOpen(false);
  };

  return (
    <div className={`app-root-container theme-${designTheme}`}>
      {currentUser ? (
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
          
          <Sidebar
            currentUser={currentUser}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="main-content-layout">
             <TopNavbar
              currentUser={currentUser}
              simulatedDate={simulatedDate}
              simulatedTime={simulatedTime}
              onToggleSidebar={() => setSidebarOpen(prev => !prev)}
              pageTitle={
                currentTab === 'absensi' ? 'Portal Absensi & Check-In' :
                currentTab === 'riwayat' ? 'Riwayat & Log Kehadiran' :
                currentTab === 'list_harian' ? 'Log Kinerja Harian' :
                currentTab === 'jadwal' ? 'Penjadwalan Shift Karyawan' :
                currentTab === 'karyawan' ? 'Database Karyawan' :
                currentTab === 'payroll' ? 'Manajemen Penggajian / Payroll' :
                currentTab === 'faktur' ? 'Faktur & Pengeluaran' :
                currentTab === 'laporan' ? 'Dashboard Grafik & Analitik' :
                currentTab === 'sql_dump' ? 'Ekspor SQL & Integrasi' :
                'Sistem Portal Kantor'
              }
            />

            <div className="view-scroll-viewport">
              {currentTab === 'absensi' && (
                <ModuleAbsensi
                  currentUser={currentUser}
                  simulatedDate={simulatedDate}
                  simulatedTime={simulatedTime}
                  shifts={shifts}
                  attendances={attendances}
                  onAddAttendance={handleRecordAttendance}
                  onUpdateAttendance={handleRecordAttendance}
                />
              )}

              {currentTab === 'riwayat' && <ModuleRiwayatAbsensi currentUser={currentUser} attendances={attendances} />}
              {currentTab === 'list_harian' && <ModuleDailyReport currentUser={currentUser} simulatedDate={simulatedDate} dailyReports={dailyReports} onAddReport={handleAddReport} />}
              {currentTab === 'jadwal' && <ModuleJadwalShift currentUser={currentUser} simulatedDate={simulatedDate} employees={employees} shifts={shifts} onAddShift={handleAddShift} onDeleteShift={handleDeleteShift} />}
              {currentTab === 'karyawan' && <ModuleKaryawan currentUser={currentUser} employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} onBulkDeleteEmployees={handleBulkDeleteEmployees} onImportEmployees={handleImportEmployees} />}
              {currentTab === 'faktur' && <ModuleFaktur currentUser={currentUser} invoices={invoices} onAddInvoice={handleAddInvoice} />}
              {currentTab === 'laporan' && <ModuleLaporan currentUser={currentUser} employees={employees} attendances={attendances} />}
              {currentTab === 'payroll' && <ModulePayroll currentUser={currentUser} employees={employees} payrolls={payrolls} onUpdateSalary={handleUpdateSalary} onPaySalary={handlePaySalary} />}
              {/* {currentTab === 'sql_dump' && <ModuleSqlExport currentUser={currentUser} employees={employees} attendances={attendances} dailyReports={dailyReports} shifts={shifts} invoices={invoices} payrolls={payrolls} />} */}
            </div>
          </div>

        </div>
      ) : (
        <div className="login-backdrop">
          <div className="login-card-container" style={{ maxWidth: '480px', borderRadius: '24px', padding: '42px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div className="login-logo-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
              <Logo size={64} />
              <h1 className="login-title" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginTop: '16px', letterSpacing: '-0.02em' }}>Sistem Informasi Tazkia Farma</h1>
              <p className="login-subtitle" style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>Dashboard SITA</p>
            </div>

            {authError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <div>{authError}</div>
              </div>
            )}

            {/* <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                <i className="fa-solid fa-key" style={{ color: '#64748b' }}></i> KREDENSI UJI COBA CEPAT:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button type="button" onClick={() => triggerQuickLoginByUsername('budi')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #818cf8', backgroundColor: '#ffffff', color: '#4f46e5', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Staf: Budi (budi)</button>
                <button type="button" onClick={() => triggerQuickLoginByUsername('hr')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Finance: Ahmad (hr)</button>
                <button type="button" onClick={() => triggerQuickLoginByUsername('admin')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Staff IT: Hanif (admin)</button>
                <button type="button" onClick={() => triggerQuickLoginByUsername('owner')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #10b981', backgroundColor: '#ffffff', color: '#047857', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Owner: Hendra (owner)</button>
              </div>
            </div> */}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>Username / Nama / ID Karyawan</label>
                <input type="text" className="form-control" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem' }} placeholder="Masukkan username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>Kata Sandi (Password)</label>
                <input type="password" className="form-control" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem' }} placeholder="•••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '700', backgroundColor: '#6366f1', border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <i className="fa-solid fa-right-to-bracket"></i> Masuk ke Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}