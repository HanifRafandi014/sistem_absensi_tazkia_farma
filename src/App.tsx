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
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_DAILY_REPORTS, 
  INITIAL_SHIFTS, 
  INITIAL_INVOICES, 
  INITIAL_PAYROLL 
} from './initialData';
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
import ModuleSqlExport from './components/ModuleSqlExport';

export default function App() {
  // --- CORE SYSTEM DATABASES (React States) ---
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendances, setAttendances] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(INITIAL_DAILY_REPORTS);
  const [shifts, setShifts] = useState<ShiftSchedule[]>(INITIAL_SHIFTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [payrolls, setPayrolls] = useState<Payroll[]>(INITIAL_PAYROLL);

  // --- AUTHENTICATION & PORTAL STATES ---
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // --- SYSTEM DATE & TIME ENGINE (Real-time Asia/Jakarta) ---
  const [simulatedDate, setSimulatedDate] = useState(() => getJakartaDateTime().dateStr);
  const [simulatedTime, setSimulatedTime] = useState(() => getJakartaDateTime().timeStr);

  // --- NAVIGATION STATE ---
  const [currentTab, setCurrentTab] = useState<string>('absensi');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- VISUAL DESIGN PRESETS HUB ENGINE ---
  const [designTheme, setDesignTheme] = useState<string>('clean-light');

  useEffect(() => {
    // Apply theme class to document element
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
        setCurrentTab('laporan'); // Owner doesn't do check-ins or daily logs, defaults to reports
      } else {
        setCurrentTab('absensi'); // Staff, Finance, and Staff IT (admin) do check-ins
      }
    }
  }, [currentUser]);

  // --- CORE APP ACTION HANDLERS ---

  // Check-In and Check-Out Attendance
  const handleRecordAttendance = (newAtt: Attendance) => {
    // Check if check-in or update (check-out)
    const existingIndex = attendances.findIndex(att => att.employeeId === newAtt.employeeId && att.date === newAtt.date);
    if (existingIndex !== -1) {
      const updated = [...attendances];
      updated[existingIndex] = newAtt;
      setAttendances(updated);
    } else {
      setAttendances([newAtt, ...attendances]);
    }
  };

  // Add Daily Report Log
  const handleAddReport = (newRep: DailyReport) => {
    setDailyReports([newRep, ...dailyReports]);
  };

  // Assign New Shift Schedule (Admin)
  const handleAddShift = (newShift: ShiftSchedule) => {
    setShifts([newShift, ...shifts]);
  };

  // Delete Shift Schedule (Admin)
  const handleDeleteShift = (id: string) => {
    setShifts(shifts.filter(s => s.id !== id));
  };

  // Add Employee (Admin CRUD)
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees([...employees, newEmp]);
  };

  // Update Employee (Admin CRUD)
  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees(employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));
  };

  // Delete Employee (Admin CRUD)
  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  // Bulk Delete Employees (Admin CRUD)
  const handleBulkDeleteEmployees = (ids: string[]) => {
    setEmployees(employees.filter(emp => !ids.includes(emp.id)));
  };

  // Excel Bulk Import Employees (Admin)
  const handleImportEmployees = (imported: Employee[]) => {
    setEmployees([...employees, ...imported]);
  };

  // Input Invoice (Admin)
  const handleAddInvoice = (newInv: Invoice) => {
    setInvoices([newInv, ...invoices]);
  };

  // Update Employee Salary structure (Finance)
  const handleUpdateSalary = (empId: string, basic: number, bonus: number) => {
    setEmployees(employees.map(emp => emp.id === empId ? { ...emp, basicSalary: basic, bonus } : emp));
  };

  // Execute Payment (Finance)
  const handlePaySalary = (newPayroll: Payroll) => {
    setPayrolls([newPayroll, ...payrolls]);
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

    // Hash user-input password using SHA-256 helper
    const hashedInput = await hashPassword(loginPassword);

    // For ease of testing, permit simple direct comparisons for preset accounts (e.g. "123456") or exact hash match
    if (loginPassword === user.passwordHash || hashedInput === user.passwordHash || user.passwordHash === '123456') {
      setCurrentUser(user);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setAuthError('Kata sandi login Anda salah! Silakan coba lagi.');
    }
  };

  // Quick Account Login Selector
  const triggerQuickLogin = (role: UserRole) => {
    const matched = employees.find(emp => emp.role === role);
    if (matched) {
      setCurrentUser(matched);
      setAuthError(null);
    }
  };

  const triggerQuickLoginByUsername = (username: string) => {
    const matched = employees.find(emp => emp.username.trim().toLowerCase() === username.trim().toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      setAuthError(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSidebarOpen(false);
  };

  // RENDER PORTAL LAYOUT OR LOGIN PAGE
  return (
    <div className={`app-root-container theme-${designTheme}`}>
      {currentUser ? (
        // --- PORTAL LAYOUT ---
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

              {currentTab === 'riwayat' && (
                <ModuleRiwayatAbsensi
                  currentUser={currentUser}
                  attendances={attendances}
                />
              )}

              {currentTab === 'list_harian' && (
                <ModuleDailyReport
                  currentUser={currentUser}
                  simulatedDate={simulatedDate}
                  dailyReports={dailyReports}
                  onAddReport={handleAddReport}
                />
              )}

              {currentTab === 'jadwal' && (
                <ModuleJadwalShift
                  currentUser={currentUser}
                  simulatedDate={simulatedDate}
                  employees={employees}
                  shifts={shifts}
                  onAddShift={handleAddShift}
                  onDeleteShift={handleDeleteShift}
                />
              )}

              {currentTab === 'karyawan' && (
                <ModuleKaryawan
                  currentUser={currentUser}
                  employees={employees}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onBulkDeleteEmployees={handleBulkDeleteEmployees}
                  onImportEmployees={handleImportEmployees}
                />
              )}

              {currentTab === 'faktur' && (
                <ModuleFaktur
                  currentUser={currentUser}
                  invoices={invoices}
                  onAddInvoice={handleAddInvoice}
                />
              )}

              {currentTab === 'laporan' && (
                <ModuleLaporan
                  currentUser={currentUser}
                  employees={employees}
                  attendances={attendances}
                />
              )}

              {currentTab === 'payroll' && (
                <ModulePayroll
                  currentUser={currentUser}
                  employees={employees}
                  payrolls={payrolls}
                  onUpdateSalary={handleUpdateSalary}
                  onPaySalary={handlePaySalary}
                />
              )}

              {currentTab === 'sql_dump' && (
                <ModuleSqlExport
                  currentUser={currentUser}
                  employees={employees}
                  attendances={attendances}
                  dailyReports={dailyReports}
                  shifts={shifts}
                  invoices={invoices}
                  payrolls={payrolls}
                />
              )}
            </div>
          </div>

        </div>
      ) : (
        // --- AUTHENTICATION LOGIN PAGE ---
        <div className="login-backdrop">
          <div className="login-card-container" style={{ maxWidth: '480px', borderRadius: '24px', padding: '42px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            
            {/* Header Brand Logo */}
            <div className="login-logo-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
              <Logo size={64} />
              <h1 className="login-title" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginTop: '16px', letterSpacing: '-0.02em' }}>Sistem Absensi & Payroll</h1>
              <p className="login-subtitle" style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>Dashboard Internal Staf, HR & Admin Office</p>
            </div>

            {authError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <div>{authError}</div>
              </div>
            )}

            {/* QUICK SANDBOX ACCOUNTS LOGIN PANEL (PLACED AT TOP LIKE IMAGE) */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                <i className="fa-solid fa-key" style={{ color: '#64748b' }}></i> KREDENSI UJI COBA CEPAT:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => triggerQuickLoginByUsername('budi')} 
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #818cf8', backgroundColor: '#ffffff', color: '#4f46e5', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Staf: Budi (budi)
                </button>
                <button 
                  type="button" 
                  onClick={() => triggerQuickLoginByUsername('hr')} 
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Finance: Ahmad (hr)
                </button>
                <button 
                  type="button" 
                  onClick={() => triggerQuickLoginByUsername('admin')} 
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Staff IT: Hanif (admin)
                </button>
                <button 
                  type="button" 
                  onClick={() => triggerQuickLoginByUsername('owner')} 
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #10b981', backgroundColor: '#ffffff', color: '#047857', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Owner: Hendra (owner)
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>Username / Nama / ID Karyawan</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#ffffff',
                    color: '#1e293b'
                  }}
                  placeholder="Masukkan username dsb..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>Kata Sandi (Password)</label>
                <input
                  type="password"
                  className="form-control"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#ffffff',
                    color: '#1e293b'
                  }}
                  placeholder="••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn" 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  fontSize: '0.92rem', 
                  fontWeight: '700', 
                  backgroundColor: '#6366f1', 
                  border: 'none', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fa-solid fa-right-to-bracket"></i> Masuk ke Dashboard
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.7rem', color: '#94a3b8' }}>
              PT. Solusi Kantor Modern Sejahtera &copy; 2026. Hak Cipta Dilindungi.
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
