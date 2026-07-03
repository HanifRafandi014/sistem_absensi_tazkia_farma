export type UserRole = 'staff' | 'acc finance' | 'admin' | 'owner';

export interface Employee {
  id: string; // e.g., AB01, AB02
  name: string;
  position: string; // Jabatan
  phone: string; // No HP
  branch: string; // Nama Cabang
  role: UserRole;
  mainJobdesk: string;
  signatureImg: string | null; // base64 data url
  cvFile: string | null; // base64 data url or filename
  diplomaFile: string | null; // base64 data url or filename
  photoImg: string | null; // base64 data url or avatar
  basicSalary: number;
  bonus: number;
  username: string;
  passwordHash: string; // simple string for demo, stored securely
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // HH:MM:SS
  checkOutTime: string | null; // HH:MM:SS
  status: 'H' | 'S' | 'I' | 'A' | 'Terlambat'; // H (Hadir), S (Sakit), I (Izin), A (Alpa), Terlambat
  keterangan: string;
}

export interface DailyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  branchName: string;
  shift: 'Pagi' | 'Sore';
  date: string; // YYYY-MM-DD
  dailyTask: string;
  shiftRevenue: number;
}

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftType: 'Pagi' | 'Sore'; // Pagi 07:00-15:00, Sore 13:00-21:00
  date: string; // YYYY-MM-DD
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  branchName: string;
  date: string; // YYYY-MM-DD
  total: number;
  invoicePhoto: string | null; // base64 data url
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  bonus: number;
  totalSalary: number;
  period: string; // YYYY-MM (Month Filter)
  datePaid: string; // YYYY-MM-DD
  status: 'Paid' | 'Pending';
}
