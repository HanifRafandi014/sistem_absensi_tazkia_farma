import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// --- 1. SINKRONISASI MOCK DATA (Wajib di Atas untuk Vercel Compiler) ---
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_DAILY_REPORTS, 
  INITIAL_SHIFTS, 
  INITIAL_INVOICES, 
  INITIAL_PAYROLL 
} from '../src/initialData';

// Load environment variables
dotenv.config();

// Default values for database connection
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

// Mock database fallback for Vercel/AI Studio Sandbox preview
const fallbackDb: {
  employees: any[];
  attendance: any[];
  daily_reports: any[];
  shifts: any[];
  invoices: any[];
  payroll: any[];
} = {
  employees: [],
  attendance: [],
  daily_reports: [],
  shifts: [],
  invoices: [],
  payroll: []
};

// --- 2. SEED FALLBACK DATABASE SECARA SINKRONUS ---
try {
  fallbackDb.employees = INITIAL_EMPLOYEES.map(e => ({
    id: e.id,
    name: e.name,
    position: e.position,
    phone: e.phone,
    branch: e.branch,
    role: e.role,
    main_jobdesk: e.mainJobdesk,
    basic_salary: e.basicSalary,
    bonus: e.bonus,
    username: e.username,
    password_hash: e.passwordHash,
  }));
  fallbackDb.attendance = INITIAL_ATTENDANCE.map(a => ({
    id: a.id,
    employee_id: a.employeeId,
    employee_name: a.employeeName,
    date: a.date,
    check_in_time: a.checkInTime,
    check_out_time: a.checkOutTime,
    status: a.status,
    keterangan: a.keterangan,
  }));
  fallbackDb.daily_reports = INITIAL_DAILY_REPORTS.map(r => ({
    id: r.id,
    employee_id: r.employeeId,
    employee_name: r.employeeName,
    position: r.position,
    branch_name: r.branchName,
    shift: r.shift,
    date: r.date,
    daily_task: r.dailyTask,
    shift_revenue: r.shiftRevenue,
  }));
  fallbackDb.shifts = INITIAL_SHIFTS.map(s => ({
    id: s.id,
    employee_id: s.employeeId,
    employee_name: s.employeeName,
    shift_type: s.shiftType,
    date: s.date,
  }));
  fallbackDb.invoices = INITIAL_INVOICES.map(i => ({
    id: i.id,
    invoice_no: i.invoiceNo,
    branch_name: i.branchName,
    date: i.date,
    total: i.total,
    invoice_photo: i.invoicePhoto,
  }));
  fallbackDb.payroll = INITIAL_PAYROLL.map(p => ({
    id: p.id,
    employee_id: p.employeeId,
    employee_name: p.employeeName,
    position: p.position,
    basic_salary: p.basicSalary,
    bonus: p.bonus,
    total_salary: p.totalSalary,
    period: p.period,
    date_paid: p.datePaid,
    status: p.status,
  }));
  console.log('Seeded memory-fallback database successfully.');
} catch (err) {
  console.error('Failed to seed memory-fallback database:', err);
}

async function connectDatabase() {
  // Cegah serverless function Vercel crash/timeout karena mencoba menyambung ke localhost laptop Anda
  if (process.env.VERCEL) {
    console.log(`\n======================================================`);
    console.log(`ℹ️ INTEGRASI VERCEL TERDETEKSI ONLINE.`);
    console.log(`Aplikasi otomatis beralih ke MODE DEMO DENGAN PERSISTENCE MEMORI.`);
    console.log(`======================================================\n`);
    isDbConnected = false;
    return;
  }

  try {
    pool = mysql.createPool(dbConfig);
    // Test the connection
    const connection = await pool.getConnection();
    console.log(`\n======================================================`);
    console.log(`✅ BERHASIL TERHUBUNG KE MYSQL DATABASE LOCALHOST!`);
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`======================================================\n`);
    connection.release();
    isDbConnected = true;

    // Create table shifts if not exists
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
    } catch (e) {
      console.warn('Could not run DDL check for shifts table (perhaps user table structures mismatch):', e);
    }

  } catch (error: any) {
    console.log(`\n======================================================`);
    console.log(`⚠️ INFO: Database MySQL tidak aktif / tidak dapat dihubungi.`);
    console.log(`Detail error: ${error.message}`);
    console.log(`Aplikasi menggunakan MODE DEMO DENGAN PERSISTENCE MEMORI.`);
    console.log(`======================================================\n`);
    isDbConnected = false;
  }
}

async function startServer() {
  await connectDatabase();

  const app = express();
  const PORT = 3000;

  // --- 3. BODY PARSERS (Wajib Paling Atas) ---
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- 4. ENDPOINT API EXPRESS ---

  // API Status & Configuration Endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      databaseConnected: isDbConnected,
      config: {
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user
      }
    });
  });

  // --- EMPLOYEES API ---
  app.get('/api/employees', async (req, res) => {
    if (isDbConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM employees');
        const mapped = rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          position: r.position,
          phone: r.phone,
          branch: r.branch,
          role: r.role,
          mainJobdesk: r.main_jobdesk || '',
          signatureImg: null,
          cvFile: null,
          diplomaFile: null,
          photoImg: null,
          basicSalary: Number(r.basic_salary || 0),
          bonus: Number(r.bonus || 0),
          username: r.username,
          passwordHash: r.password_hash
        }));
        return res.json(mapped);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const mapped = fallbackDb.employees.map(r => ({
        id: r.id,
        name: r.name,
        position: r.position,
        phone: r.phone,
        branch: r.branch,
        role: r.role,
        mainJobdesk: r.main_jobdesk || '',
        signatureImg: null,
        cvFile: null,
        diplomaFile: null,
        photoImg: null,
        basicSalary: Number(r.basic_salary || 0),
        bonus: Number(r.bonus || 0),
        username: r.username,
        passwordHash: r.password_hash
      }));
      return res.json(mapped);
    }
  });

  app.post('/api/employees', async (req, res) => {
    const emp = req.body;
    if (isDbConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO employees (id, name, position, phone, branch, role, main_jobdesk, basic_salary, bonus, username, password_hash) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [emp.id, emp.name, emp.position, emp.phone, emp.branch, emp.role, emp.mainJobdesk || '', emp.basicSalary || 0, emp.bonus || 0, emp.username, emp.passwordHash]
        );
        return res.json({ success: true, employee: emp });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.employees.push({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        phone: emp.phone,
        branch: emp.branch,
        role: emp.role,
        main_jobdesk: emp.mainJobdesk || '',
        basic_salary: emp.basicSalary || 0,
        bonus: emp.bonus || 0,
        username: emp.username,
        password_hash: emp.passwordHash
      });
      return res.json({ success: true, employee: emp });
    }
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
    } else {
      const idx = fallbackDb.employees.findIndex(e => e.id === id);
      if (idx !== -1) {
        fallbackDb.employees[idx] = {
          ...fallbackDb.employees[idx],
          name: emp.name,
          position: emp.position,
          phone: emp.phone,
          branch: emp.branch,
          role: emp.role,
          main_jobdesk: emp.mainJobdesk || '',
          basic_salary: emp.basicSalary || 0,
          bonus: emp.bonus || 0
        };
      }
      return res.json({ success: true });
    }
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
    } else {
      fallbackDb.employees = fallbackDb.employees.filter(e => e.id !== id);
      return res.json({ success: true });
    }
  });

  app.post('/api/employees/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs array required' });
    }
    if (isDbConnected && pool) {
      try {
        await pool.query('DELETE FROM employees WHERE id IN (?)', [ids]);
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.employees = fallbackDb.employees.filter(e => !ids.includes(e.id));
      return res.json({ success: true });
    }
  });

  // --- ATTENDANCE API ---
  app.get('/api/attendance', async (req, res) => {
    if (isDbConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM attendance ORDER BY date DESC, check_in_time DESC');
        const mapped = rows.map((r: any) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
          checkInTime: r.check_in_time,
          checkOutTime: r.check_out_time,
          status: r.status,
          keterangan: r.keterangan || ''
        }));
        return res.json(mapped);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const mapped = fallbackDb.attendance.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        date: r.date,
        checkInTime: r.check_in_time,
        checkOutTime: r.check_out_time,
        status: r.status,
        keterangan: r.keterangan || ''
      }));
      return res.json(mapped);
    }
  });

  app.post('/api/attendance', async (req, res) => {
    const att = req.body;
    if (isDbConnected && pool) {
      try {
        const [existing]: any = await pool.query('SELECT id FROM attendance WHERE id=? OR (employee_id=? AND date=?)', [att.id, att.employeeId, att.date]);
        if (existing.length > 0) {
          const idToUpdate = existing[0].id;
          await pool.query(
            'UPDATE attendance SET check_in_time=?, check_out_time=?, status=?, keterangan=? WHERE id=?',
            [att.checkInTime, att.checkOutTime, att.status, att.keterangan || '', idToUpdate]
          );
        } else {
          await pool.query(
            'INSERT INTO attendance (id, employee_id, employee_name, date, check_in_time, check_out_time, status, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [att.id, att.employeeId, att.employeeName, att.date, att.checkInTime, att.checkOutTime, att.status, att.keterangan || '']
          );
        }
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const idx = fallbackDb.attendance.findIndex(a => (a.id === att.id) || (a.employee_id === att.employeeId && a.date === att.date));
      if (idx !== -1) {
        fallbackDb.attendance[idx] = {
          ...fallbackDb.attendance[idx],
          check_in_time: att.checkInTime,
          check_out_time: att.checkOutTime,
          status: att.status,
          keterangan: att.keterangan || ''
        };
      } else {
        fallbackDb.attendance.unshift({
          id: att.id,
          employee_id: att.employeeId,
          employee_name: att.employeeName,
          date: att.date,
          check_in_time: att.checkInTime,
          check_out_time: att.checkOutTime,
          status: att.status,
          keterangan: att.keterangan || ''
        });
      }
      return res.json({ success: true });
    }
  });

  // --- DAILY REPORTS API ---
  app.get('/api/daily-reports', async (req, res) => {
    if (isDbConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM daily_reports ORDER BY date DESC, id DESC');
        const mapped = rows.map((r: any) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          position: r.position,
          branchName: r.branch_name,
          shift: r.shift,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
          dailyTask: r.daily_task,
          shiftRevenue: Number(r.shift_revenue || 0)
        }));
        return res.json(mapped);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const mapped = fallbackDb.daily_reports.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        position: r.position,
        branchName: r.branch_name,
        shift: r.shift,
        date: r.date,
        dailyTask: r.daily_task,
        shiftRevenue: Number(r.shift_revenue || 0)
      }));
      return res.json(mapped);
    }
  });

  app.post('/api/daily-reports', async (req, res) => {
    const dr = req.body;
    if (isDbConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO daily_reports (id, employee_id, employee_name, position, branch_name, shift, date, daily_task, shift_revenue) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [dr.id, dr.employeeId, dr.employeeName, dr.position, dr.branchName, dr.shift, dr.date, dr.dailyTask, dr.shiftRevenue || 0]
        );
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.daily_reports.unshift({
        id: dr.id,
        employee_id: dr.employeeId,
        employee_name: dr.employeeName,
        position: dr.position,
        branch_name: dr.branchName,
        shift: dr.shift,
        date: dr.date,
        daily_task: dr.dailyTask,
        shift_revenue: dr.shiftRevenue || 0
      });
      return res.json({ success: true });
    }
  });

  // --- SHIFTS API ---
  app.get('/api/shifts', async (req, res) => {
    if (isDbConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM shifts ORDER BY date DESC');
        const mapped = rows.map((r: any) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          shiftType: r.shift_type,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date
        }));
        return res.json(mapped);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const mapped = fallbackDb.shifts.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        shiftType: r.shift_type,
        date: r.date
      }));
      return res.json(mapped);
    }
  });

  app.post('/api/shifts', async (req, res) => {
    const s = req.body;
    if (isDbConnected && pool) {
      try {
        await pool.query(
          'INSERT INTO shifts (id, employee_id, employee_name, shift_type, date) VALUES (?, ?, ?, ?, ?)',
          [s.id, s.employeeId, s.employeeName, s.shiftType, s.date]
        );
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.shifts.push({
        id: s.id,
        employee_id: s.employeeId,
        employee_name: s.employeeName,
        shift_type: s.shiftType,
        date: s.date
      });
      return res.json({ success: true });
    }
  });

  app.delete('/api/shifts/:id', async (req, res) => {
    const { id } = req.params;
    if (isDbConnected && pool) {
      try {
        await pool.query('DELETE FROM shifts WHERE id=?', [id]);
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.shifts = fallbackDb.shifts.filter(sh => sh.id !== id);
      return res.json({ success: true });
    }
  });

  // --- INVOICES API ---
  app.get('/api/invoices', async (req, res) => {
    if (isDbConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM invoices ORDER BY date DESC, id DESC');
        const mapped = rows.map((r: any) => ({
          id: r.id,
          invoiceNo: r.invoice_no,
          branchName: r.branch_name,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
          total: Number(r.total || 0),
          invoicePhoto: r.invoice_photo || null
        }));
        return res.json(mapped);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const mapped = fallbackDb.invoices.map(r => ({
        id: r.id,
        invoiceNo: r.invoice_no,
        branchName: r.branch_name,
        date: r.date,
        total: Number(r.total || 0),
        invoicePhoto: r.invoice_photo || null
      }));
      return res.json(mapped);
    }
  });

  app.post('/api/invoices', async (req, res) => {
    const inv = req.body;
    if (isDbConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO invoices (id, invoice_no, branch_name, date, total, invoice_photo) VALUES (?, ?, ?, ?, ?, ?)`,
          [inv.id, inv.invoiceNo, inv.branchName, inv.date, inv.total || 0, inv.invoicePhoto || null]
        );
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.invoices.unshift({
        id: inv.id,
        invoice_no: inv.invoiceNo,
        branch_name: inv.branchName,
        date: inv.date,
        total: inv.total || 0,
        invoice_photo: inv.invoicePhoto || null
      });
      return res.json({ success: true });
    }
  });

  // --- PAYROLL API ---
  app.get('/api/payroll', async (req, res) => {
    if (isDbConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM payroll ORDER BY period DESC, id DESC');
        const mapped = rows.map((r: any) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          position: r.position,
          basicSalary: Number(r.basic_salary || 0),
          bonus: Number(r.bonus || 0),
          totalSalary: Number(r.total_salary || 0),
          period: r.period,
          datePaid: r.date_paid instanceof Date ? r.date_paid.toISOString().split('T')[0] : r.date_paid,
          status: r.status
        }));
        return res.json(mapped);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      const mapped = fallbackDb.payroll.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        position: r.position,
        basicSalary: Number(r.basic_salary || 0),
        bonus: Number(r.bonus || 0),
        totalSalary: Number(r.total_salary || 0),
        period: r.period,
        datePaid: r.date_paid,
        status: r.status
      }));
      return res.json(mapped);
    }
  });

  app.post('/api/payroll', async (req, res) => {
    const p = req.body;
    if (isDbConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO payroll (id, employee_id, employee_name, position, basic_salary, bonus, total_salary, period, date_paid, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.employeeId, p.employeeName, p.position, p.basicSalary || 0, p.bonus || 0, p.totalSalary || 0, p.period, p.datePaid, p.status]
        );
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      fallbackDb.payroll.unshift({
        id: p.id,
        employee_id: p.employeeId,
        employee_name: p.employeeName,
        position: p.position,
        basic_salary: p.basicSalary || 0,
        bonus: p.bonus || 0,
        total_salary: p.totalSalary || 0,
        period: p.period,
        date_paid: p.datePaid,
        status: p.status
      });
      return res.json({ success: true });
    }
  });

  // --- 5. VITE MIDDLEWARE OR STATIC SERVER (Wajib di Paling Bawah) ---
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- 6. LISTEN SERVER (Hanya berjalan di Localhost / Development komputer lokal) ---
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🚀 SERVER SEDANG BERJALAN DI PORT ${PORT}!`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`======================================================\n`);
    });
  }

  // Mengembalikan instance app Express untuk digunakan oleh Vercel engine
  return app;
}

// Inisialisasi pembentukan rute aplikasi Express
const appPromise = startServer();

// EXPORT APP UNTUK VERCEL SERVERLESS HANDLER
export default appPromise;