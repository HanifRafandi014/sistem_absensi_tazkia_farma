import { Employee, Attendance, DailyReport, ShiftSchedule, Invoice, Payroll } from './types';

// Simple helper to get date strings relative to today (2026-07-03)
const getRelativeDate = (offsetDays: number): string => {
  const baseDate = new Date('2026-07-03T00:00:00');
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate.toISOString().split('T')[0];
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'AB01',
    name: 'Budi Santoso',
    position: 'Staff IT',
    phone: '081234567890',
    branch: 'Cabang Jakarta Pusat',
    role: 'staff',
    mainJobdesk: 'Melakukan stock opname harian, packing pengiriman, dan serah terima barang kurir.',
    signatureImg: null,
    cvFile: null,
    diplomaFile: null,
    photoImg: null,
    basicSalary: 4500000,
    bonus: 200000,
    username: 'budi',
    passwordHash: '123456'
  },
  {
    id: 'AB02',
    name: 'Ahmad Jaelani',
    position: 'Accounting Finance',
    phone: '082198765432',
    branch: 'Cabang Bandung Timur',
    role: 'acc finance',
    mainJobdesk: 'Memproses pesanan online, update stok sistem marketplace, dan CS chat.',
    signatureImg: null,
    cvFile: null,
    diplomaFile: null,
    photoImg: null,
    basicSalary: 6000000,
    bonus: 200000,
    username: 'hr',
    passwordHash: '123456'
  },
  {
    id: 'AB03',
    name: 'Siti Aminah',
    position: 'Staff Apotek',
    phone: '085711223344',
    branch: 'Cabang Head Office',
    role: 'staff',
    mainJobdesk: 'Menyusun laporan keuangan bulanan, perpajakan, rekonsiliasi kas bank, dan penggajian karyawan.',
    signatureImg: null,
    cvFile: null,
    diplomaFile: null,
    photoImg: null,
    basicSalary: 4200000,
    bonus: 200000,
    username: 'siti',
    passwordHash: '123456'
  },
  {
    id: 'AB04',
    name: 'Hanif Rafandi',
    position: 'Staff IT & Admin',
    phone: '089988776655',
    branch: 'Cabang Head Office',
    role: 'admin',
    mainJobdesk: 'Mengelola database karyawan, mengatur jadwal shift, audit invoice, dan troubleshooting IT.',
    signatureImg: null,
    cvFile: null,
    diplomaFile: null,
    photoImg: null,
    basicSalary: 8500000,
    bonus: 0,
    username: 'admin',
    passwordHash: '123456'
  },
  {
    id: 'AB05',
    name: 'Hendra Wijaya',
    position: 'Managing Director & Owner',
    phone: '081122334455',
    branch: 'Cabang Head Office',
    role: 'owner',
    mainJobdesk: 'Pengawasan bisnis strategis, ekspansi cabang, dan otorisasi anggaran tahunan.',
    signatureImg: null,
    cvFile: null,
    diplomaFile: null,
    photoImg: null,
    basicSalary: 15000000,
    bonus: 2000000,
    username: 'owner',
    passwordHash: '123456'
  }
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  // 2026-07-01
  {
    id: 'ATT01',
    employeeId: 'AB01',
    employeeName: 'Budi Santoso',
    role: 'staff',
    date: getRelativeDate(-2), // 2026-07-01
    checkInTime: '06:55:00',
    checkOutTime: '15:02:00',
    status: 'H',
    keterangan: 'Masuk pagi tepat waktu'
  },
  {
    id: 'ATT02',
    employeeId: 'AB02',
    employeeName: 'Ahmad Jaelani',
    role: 'acc finance',
    date: getRelativeDate(-2), // 2026-07-01
    checkInTime: '13:05:00',
    checkOutTime: '21:01:00',
    status: 'Terlambat',
    keterangan: 'Terlambat 5 menit karena kendala lalu lintas di Pasteur'
  },
  {
    id: 'ATT03',
    employeeId: 'AB03',
    employeeName: 'Siti Aminah',
    role: 'staff',
    date: getRelativeDate(-2), // 2026-07-01
    checkInTime: '07:45:00',
    checkOutTime: '16:30:00',
    status: 'H',
    keterangan: 'Masuk HO tepat waktu'
  },
  {
    id: 'ATT04',
    employeeId: 'AB04',
    employeeName: 'Hanif Rafandi',
    role: 'admin',
    date: getRelativeDate(-2), // 2026-07-01
    checkInTime: '07:50:00',
    checkOutTime: '17:05:00',
    status: 'H',
    keterangan: 'Masuk HO'
  },

  // 2026-07-02
  {
    id: 'ATT05',
    employeeId: 'AB01',
    employeeName: 'Budi Santoso',
    role: 'staff',
    date: getRelativeDate(-1), // 2026-07-02
    checkInTime: '07:08:00',
    checkOutTime: '15:05:00',
    status: 'Terlambat',
    keterangan: 'Kereta KRL terlambat dari Stasiun Kranji'
  },
  {
    id: 'ATT06',
    employeeId: 'AB02',
    employeeName: 'Ahmad Jaelani',
    role: 'acc finance',
    date: getRelativeDate(-1), // 2026-07-02
    checkInTime: null,
    checkOutTime: null,
    status: 'S',
    keterangan: 'Sakit demam tinggi, ada surat dokter terlampir di WhatsApp'
  },
  {
    id: 'ATT07',
    employeeId: 'AB03',
    employeeName: 'Siti Aminah',
    role: 'staff',
    date: getRelativeDate(-1), // 2026-07-02
    checkInTime: '07:55:00',
    checkOutTime: '16:45:00',
    status: 'H',
    keterangan: 'Kehadiran rutin'
  },
  {
    id: 'ATT08',
    employeeId: 'AB04',
    employeeName: 'Hanif Rafandi',
    role: 'admin',
    date: getRelativeDate(-1), // 2026-07-02
    checkInTime: '08:00:00',
    checkOutTime: '17:00:00',
    status: 'H',
    keterangan: 'Audit lapangan'
  },

  // 2026-07-03 (Today) - No check-ins seeded yet, staff will do this!
];

export const INITIAL_SHIFTS: ShiftSchedule[] = [
  // Budi Santoso Shifts
  { id: 'SH01', employeeId: 'AB01', employeeName: 'Budi Santoso', shiftType: 'Pagi', date: getRelativeDate(-2) }, // July 1
  { id: 'SH02', employeeId: 'AB01', employeeName: 'Budi Santoso', shiftType: 'Pagi', date: getRelativeDate(-1) }, // July 2
  { id: 'SH03', employeeId: 'AB01', employeeName: 'Budi Santoso', shiftType: 'Pagi', date: getRelativeDate(0) },  // July 3 (Today)
  { id: 'SH04', employeeId: 'AB01', employeeName: 'Budi Santoso', shiftType: 'Pagi', date: getRelativeDate(1) },  // July 4
  { id: 'SH05', employeeId: 'AB01', employeeName: 'Budi Santoso', shiftType: 'Pagi', date: getRelativeDate(2) },  // July 5

  // Ahmad Jaelani Shifts
  { id: 'SH06', employeeId: 'AB02', employeeName: 'Ahmad Jaelani', shiftType: 'Sore', date: getRelativeDate(-2) }, // July 1
  { id: 'SH07', employeeId: 'AB02', employeeName: 'Ahmad Jaelani', shiftType: 'Sore', date: getRelativeDate(-1) }, // July 2
  { id: 'SH08', employeeId: 'AB02', employeeName: 'Ahmad Jaelani', shiftType: 'Sore', date: getRelativeDate(0) },  // July 3 (Today)
  { id: 'SH09', employeeId: 'AB02', employeeName: 'Ahmad Jaelani', shiftType: 'Sore', date: getRelativeDate(1) },  // July 4
  { id: 'SH10', employeeId: 'AB02', employeeName: 'Ahmad Jaelani', shiftType: 'Sore', date: getRelativeDate(2) },  // July 5

  // Siti Aminah Shifts
  { id: 'SH11', employeeId: 'AB03', employeeName: 'Siti Aminah', shiftType: 'Pagi', date: getRelativeDate(-2) },
  { id: 'SH12', employeeId: 'AB03', employeeName: 'Siti Aminah', shiftType: 'Pagi', date: getRelativeDate(-1) },
  { id: 'SH13', employeeId: 'AB03', employeeName: 'Siti Aminah', shiftType: 'Pagi', date: getRelativeDate(0) },
  { id: 'SH14', employeeId: 'AB03', employeeName: 'Siti Aminah', shiftType: 'Pagi', date: getRelativeDate(1) },

  // Hanif Rafandi Shifts
  { id: 'SH15', employeeId: 'AB04', employeeName: 'Hanif Rafandi', shiftType: 'Pagi', date: getRelativeDate(-2) },
  { id: 'SH16', employeeId: 'AB04', employeeName: 'Hanif Rafandi', shiftType: 'Pagi', date: getRelativeDate(-1) },
  { id: 'SH17', employeeId: 'AB04', employeeName: 'Hanif Rafandi', shiftType: 'Pagi', date: getRelativeDate(0) }
];

export const INITIAL_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'DR01',
    employeeId: 'AB01',
    employeeName: 'Budi Santoso',
    position: 'Staff IT',
    branchName: 'Cabang Jakarta Pusat',
    shift: 'Pagi',
    date: getRelativeDate(-2), // 2026-07-01
    dailyTask: 'Menerima pasokan barang masuk dari pusat sebanyak 15 koli. Membantu bongkar muat dan menyusun ke rak A3-B2. Melakukan stock opname produk elektronik dan melaporkan adanya selisih 1 unit.',
    shiftRevenue: 12500000
  },
  {
    id: 'DR02',
    employeeId: 'AB02',
    employeeName: 'Ahmad Jaelani',
    position: 'Accounting Finance',
    branchName: 'Cabang Bandung Timur',
    shift: 'Sore',
    date: getRelativeDate(-2), // 2026-07-01
    dailyTask: 'Memproses 45 pesanan Shopee & Tokopedia. Menjawab 12 chat CS komplain pelanggan terkait barang pecah belah. Berhasil diselesaikan dengan opsi retur barang.',
    shiftRevenue: 18400000
  },
  {
    id: 'DR03',
    employeeId: 'AB03',
    employeeName: 'Siti Aminah',
    position: 'Staff Apotek',
    branchName: 'Cabang Head Office',
    shift: 'Pagi',
    date: getRelativeDate(-2), // 2026-07-01
    dailyTask: 'Menginput mutasi kas harian untuk 3 cabang. Menagih faktur jatuh tempo kepada 2 distributor retail. Membayar tagihan listrik dan wifi HO.',
    shiftRevenue: 0
  },
  {
    id: 'DR04',
    employeeId: 'AB01',
    employeeName: 'Budi Santoso',
    position: 'Staff IT',
    branchName: 'Cabang Jakarta Pusat',
    shift: 'Pagi',
    date: getRelativeDate(-1), // 2026-07-02
    dailyTask: 'Melakukan packing untuk 35 paket pengiriman kurir kargo. Menyapu area gudang logistik agar rapi dan bersih. Serah terima barang dengan supir ekspedisi.',
    shiftRevenue: 9800000
  },
  {
    id: 'DR05',
    employeeId: 'AB03',
    employeeName: 'Siti Aminah',
    position: 'Staff Apotek',
    branchName: 'Cabang Head Office',
    shift: 'Pagi',
    date: getRelativeDate(-1), // 2026-07-02
    dailyTask: 'Membuat draf penggajian untuk periode Juni 2026. Melakukan rekonsiliasi e-commerce settlement sheet dengan rekening koran BCA. Hasil balance.',
    shiftRevenue: 0
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV01',
    invoiceNo: 'FAK/2026/07/001',
    branchName: 'Cabang Jakarta Pusat',
    date: getRelativeDate(-2), // 2026-07-01
    total: 3500000,
    invoicePhoto: null
  },
  {
    id: 'INV02',
    invoiceNo: 'FAK/2026/07/002',
    branchName: 'Cabang Bandung Timur',
    date: getRelativeDate(-2), // 2026-07-01
    total: 1250000,
    invoicePhoto: null
  },
  {
    id: 'INV03',
    invoiceNo: 'FAK/2026/07/003',
    branchName: 'Cabang Surabaya Barat',
    date: getRelativeDate(-1), // 2026-07-02
    total: 6450000,
    invoicePhoto: null
  }
];

export const INITIAL_PAYROLL: Payroll[] = [
  {
    id: 'PAY01',
    employeeId: 'AB01',
    employeeName: 'Budi Santoso',
    position: 'Staff IT',
    basicSalary: 4500000,
    bonus: 250000,
    totalSalary: 4750000,
    period: '2026-06',
    datePaid: getRelativeDate(-5), // June 28, 2026
    status: 'Paid'
  },
  {
    id: 'PAY02',
    employeeId: 'AB02',
    employeeName: 'Ahmad Jaelani',
    position: 'Accounting Finance',
    basicSalary: 6000000,
    bonus: 200000,
    totalSalary: 6200000,
    period: '2026-06',
    datePaid: getRelativeDate(-5), // June 28, 2026
    status: 'Paid'
  },
  {
    id: 'PAY03',
    employeeId: 'AB03',
    employeeName: 'Siti Aminah',
    position: 'Staff Apotek',
    basicSalary: 4200000,
    bonus: 200000,
    totalSalary: 4400000,
    period: '2026-06',
    datePaid: getRelativeDate(-5), // June 28, 2026
    status: 'Paid'
  }
];
