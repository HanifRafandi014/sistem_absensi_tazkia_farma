import { Employee, Attendance, DailyReport, Invoice, Payroll } from './types';

// Helper to get real time in Asia/Jakarta timezone
export function getJakartaDateTime(): { dateStr: string; timeStr: string } {
  const now = new Date();
  
  // Format to YYYY-MM-DD in Asia/Jakarta timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const dFormatter = new Intl.DateTimeFormat('en-CA', dateOptions); // en-CA consistently gives YYYY-MM-DD
  const dateStr = dFormatter.format(now);

  // Format to HH:mm:ss in Asia/Jakarta timezone
  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const tFormatter = new Intl.DateTimeFormat('en-GB', timeOptions); // en-GB consistently gives HH:mm:ss (24h)
  const timeStr = tFormatter.format(now);

  return { dateStr, timeStr };
}

// Cryptographic SHA-256 hash helper for secure login password storage
export async function hashPassword(password: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback for environments where crypto.subtle might be unavailable (unlikely in modern browsers)
    return btoa(password);
  }
}

// Rupiah currency formatter
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Check if a check-in is late based on shift type and simulated time
// Shift Pagi: 07:00. Shift Sore: 13:00.
export const checkLateness = (shiftType: 'Pagi' | 'Sore', checkInTimeStr: string): { isLate: boolean; limitStr: string } => {
  const [hours, minutes] = checkInTimeStr.split(':').map(Number);
  const checkMinutes = hours * 60 + minutes;
  const limitMinutes = shiftType === 'Pagi' ? 7 * 60 : 13 * 60; // 07:00 vs 13:00
  const limitStr = shiftType === 'Pagi' ? '07:00' : '13:00';
  return {
    isLate: checkMinutes > limitMinutes,
    limitStr
  };
};

// Check if check-out is allowed yet (Shift Pagi: 15:00, Shift Sore: 21:00)
export const checkOutAllowed = (shiftType: 'Pagi' | 'Sore', currentTimeStr: string): { isAllowed: boolean; limitStr: string } => {
  const [hours, minutes] = currentTimeStr.split(':').map(Number);
  const checkMinutes = hours * 60 + minutes;
  const limitMinutes = shiftType === 'Pagi' ? 15 * 60 : 21 * 60; // 15:00 vs 21:00
  const limitStr = shiftType === 'Pagi' ? '15:00' : '21:00';
  return {
    isAllowed: checkMinutes >= limitMinutes,
    limitStr
  };
};

// Generate SQL statement dumps for MySQL PHPMyAdmin
export const generateSQLDump = (
  employees: Employee[],
  attendances: Attendance[],
  dailyReports: DailyReport[],
  invoices: Invoice[],
  payrolls: Payroll[]
): string => {
  let sql = `-- ==========================================
-- SISTEM ABSENSI KANTOR MODERN (DATABASE DUMP)
-- Generated for MySQL / phpMyAdmin
-- Date: ${new Date().toLocaleDateString('id-ID')}
-- ==========================================\n\n`;

  // 1. Employees Table
  sql += `-- Table structure for table \`employees\`
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` VARCHAR(10) PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`position\` VARCHAR(100) NOT NULL,
  \`phone\` VARCHAR(20) NOT NULL,
  \`branch\` VARCHAR(100) NOT NULL,
  \`role\` ENUM('staff', 'acc finance', 'admin', 'owner') NOT NULL,
  \`main_jobdesk\` TEXT,
  \`basic_salary\` INT DEFAULT 0,
  \`bonus\` INT DEFAULT 0,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

  // Insert Employees
  sql += `-- Dumping data for table \`employees\`
INSERT INTO \`employees\` (\`id\`, \`name\`, \`position\`, \`phone\`, \`branch\`, \`role\`, \`main_jobdesk\`, \`basic_salary\`, \`bonus\`, \`username\`, \`password_hash\`) VALUES\n`;
  employees.forEach((emp, index) => {
    const isLast = index === employees.length - 1;
    sql += `('${emp.id}', '${emp.name.replace(/'/g, "''")}', '${emp.position.replace(/'/g, "''")}', '${emp.phone}', '${emp.branch.replace(/'/g, "''")}', '${emp.role}', '${(emp.mainJobdesk || '').replace(/'/g, "''")}', ${emp.basicSalary}, ${emp.bonus}, '${emp.username}', '${emp.passwordHash}')${isLast ? ';' : ','}\n`;
  });
  sql += `\n\n`;

  // 2. Attendance Table
  sql += `-- Table structure for table \`attendance\`
CREATE TABLE IF NOT EXISTS \`attendance\` (
  \`id\` VARCHAR(10) PRIMARY KEY,
  \`employee_id\` VARCHAR(10) NOT NULL,
  \`employee_name\` VARCHAR(100) NOT NULL,
  \`date\` DATE NOT NULL,
  \`check_in_time\` TIME DEFAULT NULL,
  \`check_out_time\` TIME DEFAULT NULL,
  \`status\` ENUM('H', 'S', 'I', 'A', 'Terlambat') NOT NULL,
  \`keterangan\` TEXT,
  FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

  if (attendances.length > 0) {
    sql += `-- Dumping data for table \`attendance\`
INSERT INTO \`attendance\` (\`id\`, \`employee_id\`, \`employee_name\`, \`date\`, \`check_in_time\`, \`check_out_time\`, \`status\`, \`keterangan\`) VALUES\n`;
    attendances.forEach((att, index) => {
      const isLast = index === attendances.length - 1;
      const checkInVal = att.checkInTime ? `'${att.checkInTime}'` : 'NULL';
      const checkOutVal = att.checkOutTime ? `'${att.checkOutTime}'` : 'NULL';
      sql += `('${att.id}', '${att.employeeId}', '${att.employeeName.replace(/'/g, "''")}', '${att.date}', ${checkInVal}, ${checkOutVal}, '${att.status}', '${(att.keterangan || '').replace(/'/g, "''")}')${isLast ? ';' : ','}\n`;
    });
    sql += `\n\n`;
  }

  // 3. Daily Reports Table
  sql += `-- Table structure for table \`daily_reports\`
CREATE TABLE IF NOT EXISTS \`daily_reports\` (
  \`id\` VARCHAR(10) PRIMARY KEY,
  \`employee_id\` VARCHAR(10) NOT NULL,
  \`employee_name\` VARCHAR(100) NOT NULL,
  \`position\` VARCHAR(100) NOT NULL,
  \`branch_name\` VARCHAR(100) NOT NULL,
  \`shift\` ENUM('Pagi', 'Sore') NOT NULL,
  \`date\` DATE NOT NULL,
  \`daily_task\` TEXT NOT NULL,
  \`shift_revenue\` INT DEFAULT 0,
  FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

  if (dailyReports.length > 0) {
    sql += `-- Dumping data for table \`daily_reports\`
INSERT INTO \`daily_reports\` (\`id\`, \`employee_id\`, \`employee_name\`, \`position\`, \`branch_name\`, \`shift\`, \`date\`, \`daily_task\`, \`shift_revenue\`) VALUES\n`;
    dailyReports.forEach((dr, index) => {
      const isLast = index === dailyReports.length - 1;
      sql += `('${dr.id}', '${dr.employeeId}', '${dr.employeeName.replace(/'/g, "''")}', '${dr.position.replace(/'/g, "''")}', '${dr.branchName.replace(/'/g, "''")}', '${dr.shift}', '${dr.date}', '${dr.dailyTask.replace(/'/g, "''")}', ${dr.shiftRevenue})${isLast ? ';' : ','}\n`;
    });
    sql += `\n\n`;
  }

  // 4. Invoices Table
  sql += `-- Table structure for table \`invoices\`
CREATE TABLE IF NOT EXISTS \`invoices\` (
  \`id\` VARCHAR(10) PRIMARY KEY,
  \`invoice_no\` VARCHAR(50) NOT NULL UNIQUE,
  \`branch_name\` VARCHAR(100) NOT NULL,
  \`date\` DATE NOT NULL,
  \`total\` INT DEFAULT 0,
  \`invoice_photo\` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

  if (invoices.length > 0) {
    sql += `-- Dumping data for table \`invoices\`
INSERT INTO \`invoices\` (\`id\`, \`invoice_no\`, \`branch_name\`, \`date\`, \`total\`, \`invoice_photo\`) VALUES\n`;
    invoices.forEach((inv, index) => {
      const isLast = index === invoices.length - 1;
      const photoVal = inv.invoicePhoto ? `'${inv.invoicePhoto}'` : 'NULL';
      sql += `('${inv.id}', '${inv.invoiceNo}', '${inv.branchName.replace(/'/g, "''")}', '${inv.date}', ${inv.total}, ${photoVal})${isLast ? ';' : ','}\n`;
    });
    sql += `\n\n`;
  }

  // 5. Payroll Table
  sql += `-- Table structure for table \`payroll\`
CREATE TABLE IF NOT EXISTS \`payroll\` (
  \`id\` VARCHAR(10) PRIMARY KEY,
  \`employee_id\` VARCHAR(10) NOT NULL,
  \`employee_name\` VARCHAR(100) NOT NULL,
  \`position\` VARCHAR(100) NOT NULL,
  \`basic_salary\` INT DEFAULT 0,
  \`bonus\` INT DEFAULT 0,
  \`total_salary\` INT DEFAULT 0,
  \`period\` VARCHAR(7) NOT NULL,
  \`date_paid\` DATE NOT NULL,
  \`status\` ENUM('Paid', 'Pending') NOT NULL,
  FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

  if (payrolls.length > 0) {
    sql += `-- Dumping data for table \`payroll\`
INSERT INTO \`payroll\` (\`id\`, \`employee_id\`, \`employee_name\`, \`position\`, \`basic_salary\`, \`bonus\`, \`total_salary\`, \`period\`, \`date_paid\`, \`status\`) VALUES\n`;
    payrolls.forEach((pr, index) => {
      const isLast = index === payrolls.length - 1;
      sql += `('${pr.id}', '${pr.employeeId}', '${pr.employeeName.replace(/'/g, "''")}', '${pr.position.replace(/'/g, "''")}', ${pr.basicSalary}, ${pr.bonus}, ${pr.totalSalary}, '${pr.period}', '${pr.datePaid}', '${pr.status}')${isLast ? ';' : ','}\n`;
    });
    sql += `\n`;
  }

  return sql;
};
