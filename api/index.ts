import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';

// Import mock data statis lokal gudang backend
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_DAILY_REPORTS, 
  INITIAL_SHIFTS, 
  INITIAL_INVOICES, 
  INITIAL_PAYROLL 
} from './initialData';

// Load environment variables dari root folder
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tazkia_farma_db',
  connectTimeout: 5000,
};

let pool: mysql.Pool | null = null;
let isDbConnected = false;

// Mock database fallback container
const fallbackDb: any = {
  employees: [...INITIAL_EMPLOYEES],
  attendance: [...INITIAL_ATTENDANCE],
  daily_reports: [...INITIAL_DAILY_REPORTS],
  shifts: [...INITIAL_SHIFTS],
  invoices: [...INITIAL_INVOICES],
  payroll: [...INITIAL_PAYROLL]
};

async function connectDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log(`\n======================================================`);
    console.log(`✅ BERHASIL TERHUBUNG KE MYSQL DATABASE!`);
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`======================================================\n`);
    connection.release();
    isDbConnected = true;

    // Sinkronisasi otomatis struktur tabel shifts jika belum ada di database
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`shifts\` (
          \`id\` VARCHAR(10) PRIMARY KEY,
          \`employee_id\` VARCHAR(10) NOT NULL,
          \`employee_name\` VARCHAR(100) NOT NULL,
          \`shift_type\` ENUM('Pagi', 'Sore') NOT NULL,
          \`date\` DATE NOT NULL,
          FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e: any) {
      console.warn('⚠️ Gagal memvalidasi struktur tabel shifts:', e.message);
    }
  } catch (error: any) {
    console.log(`\n======================================================`);
    console.log(`⚠️ INFO: Database MySQL offline / gagal dihubungi.`);
    console.log(`Detail error: ${error.message}`);
    console.log(`Aplikasi menggunakan MODE DEMO INTERNAL MEMORI.`);
    console.log(`======================================================\n`);
    isDbConnected = false;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Endpoint: Cek Status Integrasi
app.get('/api/status', (req, res) => {
  res.json({
    databaseConnected: isDbConnected,
    config: { host: dbConfig.host, database: dbConfig.database, user: dbConfig.user }
  });
});

// --- API EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM employees');
      return res.json(rows.map((r: any) => ({
        id: r.id, name: r.name, position: r.position, phone: r.phone, branch: r.branch, role: r.role,
        mainJobdesk: r.main_jobdesk || '', signatureImg: null, cvFile: null, diplomaFile: null, photoImg: null,
        basicSalary: Number(r.basic_salary || 0), bonus: Number(r.bonus || 0), username: r.username, passwordHash: r.password_hash
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json(fallbackDb.employees);
});

app.post('/api/employees', async (req, res) => {
  const emp = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO employees (id, name, position, phone, branch, role, main_jobdesk, basic_salary, bonus, username, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [emp.id, emp.name, emp.position, emp.phone, emp.branch, emp.role, emp.mainJobdesk || '', emp.basicSalary || 0, emp.bonus || 0, emp.username, emp.passwordHash]
      );
      return res.json({ success: true, employee: emp });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  fallbackDb.employees.push(emp);
  return res.json({ success: true, employee: emp });
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const emp = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query(
        `UPDATE employees SET name=?, position=?, phone=?, branch=?, role=?, main_jobdesk=?, basic_salary=?, bonus=? WHERE id=?`,
        [emp.name, emp.position, emp.phone, emp.branch, emp.role, emp.mainJobdesk || '', emp.basicSalary || 0, emp.bonus || 0, id]
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  const idx = fallbackDb.employees.findIndex((e: any) => e.id === id);
  if (idx !== -1) fallbackDb.employees[idx] = { ...fallbackDb.employees[idx], ...emp };
  return res.json({ success: true });
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConnected && pool) {
    try {
      await pool.query('DELETE FROM employees WHERE id=?', [id]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  fallbackDb.employees = fallbackDb.employees.filter((e: any) => e.id !== id);
  return res.json({ success: true });
});

app.post('/api/employees/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query('DELETE FROM employees WHERE id IN (?)', [ids]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  fallbackDb.employees = fallbackDb.employees.filter((e: any) => !ids.includes(e.id));
  return res.json({ success: true });
});

// --- API ATTENDANCE ---
app.get('/api/attendance', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM attendance ORDER BY date DESC, check_in_time DESC');
      return res.json(rows.map((r: any) => ({
        id: r.id, employeeId: r.employee_id, employeeName: r.employee_name,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        checkInTime: r.check_in_time, checkOutTime: r.check_out_time, status: r.status, keterangan: r.keterangan || ''
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json(fallbackDb.attendance);
});

app.post('/api/attendance', async (req, res) => {
  const att = req.body;
  if (isDbConnected && pool) {
    try {
      const [existing]: any = await pool.query('SELECT id FROM attendance WHERE id=? OR (employee_id=? AND date=?)', [att.id, att.employeeId, att.date]);
      if (existing.length > 0) {
        await pool.query('UPDATE attendance SET check_in_time=?, check_out_time=?, status=?, keterangan=? WHERE id=?', [att.checkInTime, att.checkOutTime, att.status, att.keterangan || '', existing[0].id]);
      } else {
        await pool.query('INSERT INTO attendance (id, employee_id, employee_name, date, check_in_time, check_out_time, status, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [att.id, att.employeeId, att.employeeName, att.date, att.checkInTime, att.checkOutTime, att.status, att.keterangan || '']);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: true });
});

// --- API DAILY REPORTS ---
app.get('/api/daily-reports', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM daily_reports ORDER BY date DESC, id DESC');
      return res.json(rows.map((r: any) => ({
        id: r.id, employeeId: r.employee_id, employeeName: r.employee_name, position: r.position,
        branchName: r.branch_name, shift: r.shift, date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        dailyTask: r.daily_task, shiftRevenue: Number(r.shift_revenue || 0)
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json(fallbackDb.daily_reports);
});

app.post('/api/daily-reports', async (req, res) => {
  const dr = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query(`INSERT INTO daily_reports (id, employee_id, employee_name, position, branch_name, shift, date, daily_task, shift_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [dr.id, dr.employeeId, dr.employeeName, dr.position, dr.branchName, dr.shift, dr.date, dr.dailyTask, dr.shiftRevenue || 0]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: true });
});

// --- API SHIFTS ---
app.get('/api/shifts', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM shifts ORDER BY date DESC');
      return res.json(rows.map((r: any) => ({
        id: r.id, employeeId: r.employee_id, employeeName: r.employee_name, shiftType: r.shift_type,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json(fallbackDb.shifts);
});

app.post('/api/shifts', async (req, res) => {
  const s = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query('INSERT INTO shifts (id, employee_id, employee_name, shift_type, date) VALUES (?, ?, ?, ?, ?)', [s.id, s.employeeId, s.employeeName, s.shiftType, s.date]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: true });
});

app.delete('/api/shifts/:id', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      await pool.query('DELETE FROM shifts WHERE id=?', [req.params.id]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: true });
});

// --- API INVOICES ---
app.get('/api/invoices', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM invoices ORDER BY date DESC, id DESC');
      return res.json(rows.map((r: any) => ({
        id: r.id, invoiceNo: r.invoice_no, branchName: r.branch_name,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        total: Number(r.total || 0), invoicePhoto: r.invoice_photo || null
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json(fallbackDb.invoices);
});

app.post('/api/invoices', async (req, res) => {
  const inv = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query(`INSERT INTO invoices (id, invoice_no, branch_name, date, total, invoice_photo) VALUES (?, ?, ?, ?, ?, ?)`, [inv.id, inv.invoiceNo, inv.branchName, inv.date, inv.total || 0, inv.invoicePhoto || null]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: true });
});

// --- API PAYROLL ---
app.get('/api/payroll', async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM payroll ORDER BY period DESC, id DESC');
      return res.json(rows.map((r: any) => ({
        id: r.id, employeeId: r.employee_id, employeeName: r.employee_name, position: r.position,
        basicSalary: Number(r.basic_salary || 0), bonus: Number(r.bonus || 0), totalSalary: Number(r.total_salary || 0),
        period: r.period, datePaid: r.date_paid instanceof Date ? r.date_paid.toISOString().split('T')[0] : r.date_paid, status: r.status
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json(fallbackDb.payroll);
});

app.post('/api/payroll', async (req, res) => {
  const p = req.body;
  if (isDbConnected && pool) {
    try {
      await pool.query(`INSERT INTO payroll (id, employee_id, employee_name, position, basic_salary, bonus, total_salary, period, date_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [p.id, p.employeeId, p.employeeName, p.position, p.basicSalary || 0, p.bonus || 0, p.totalSalary || 0, p.period, p.datePaid, p.status]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: true });
});

// Pemicu awal jalannya server terpisah
async function startServer() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 API NODE EXPRESS SERVER RUNNING ON PORT ${PORT}`);
  });
}

startServer();