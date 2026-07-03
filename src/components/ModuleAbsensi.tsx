import React, { useState, useEffect } from 'react';
import { Employee, Attendance, ShiftSchedule } from '../types';
import { checkLateness, checkOutAllowed } from '../utils';

interface ModuleAbsensiProps {
  currentUser: Employee;
  simulatedDate: string;
  simulatedTime: string;
  attendances: Attendance[];
  shifts: ShiftSchedule[];
  onAddAttendance: (newAtt: Attendance) => void;
  onUpdateAttendance: (updatedAtt: Attendance) => void;
}

export const ModuleAbsensi: React.FC<ModuleAbsensiProps> = ({
  currentUser,
  simulatedDate,
  simulatedTime,
  attendances,
  shifts,
  onAddAttendance,
  onUpdateAttendance
}) => {
  // Find today's shift schedule for this user
  const todayShift = shifts.find(
    (s) => s.employeeId === currentUser.id && s.date === simulatedDate
  );

  // Find today's attendance record for this user
  const todayAtt = attendances.find(
    (a) => a.employeeId === currentUser.id && a.date === simulatedDate
  );

  const [status, setStatus] = useState<'H' | 'S' | 'I' | 'A'>('H');
  const [keterangan, setKeterangan] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Auto detect if the arrival would be late if selecting "Hadir"
  const currentShiftType = todayShift?.shiftType || 'Pagi'; // defaults to Pagi if no shift set
  const latenessCheck = checkLateness(currentShiftType, simulatedTime);
  const checkoutCheck = checkOutAllowed(currentShiftType, simulatedTime);

  useEffect(() => {
    // Clear feedback when dates change
    setFeedback(null);
  }, [simulatedDate]);

  const handleCheckIn = () => {
    // Determine status
    let finalStatus: 'H' | 'S' | 'I' | 'A' | 'Terlambat' = status;
    if (status === 'H') {
      finalStatus = latenessCheck.isLate ? 'Terlambat' : 'H';
    }

    const finalKeterangan = status === 'H' 
      ? (latenessCheck.isLate ? `Terlambat masuk shift. Jam Datang: ${simulatedTime}` : 'Hadir tepat waktu')
      : keterangan;

    if ((status === 'S' || status === 'I' || status === 'A') && !keterangan.trim()) {
      setFeedback({ type: 'danger', text: 'Keterangan harus diisi jika Sakit, Izin, atau Alpa.' });
      return;
    }

    const newAttendance: Attendance = {
      id: 'ATT_' + Date.now().toString().slice(-6),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      role: currentUser.role,
      date: simulatedDate,
      checkInTime: status === 'H' ? `${simulatedTime}:00` : null,
      checkOutTime: null,
      status: finalStatus,
      keterangan: finalKeterangan
    };

    onAddAttendance(newAttendance);
    setFeedback({ type: 'success', text: `Absensi datang berhasil disimpan! Status: ${finalStatus === 'Terlambat' ? 'TERLAMBAT' : finalStatus}` });
    setKeterangan('');
  };

  const handleCheckOut = () => {
    if (!todayAtt) return;

    if (!checkoutCheck.isAllowed) {
      setFeedback({ 
        type: 'danger', 
        text: `Check-out ditolak! Jam kerja shift ${currentShiftType} belum berakhir. Tombol check-out terkunci hingga pukul ${checkoutCheck.limitStr}.` 
      });
      return;
    }

    const updated: Attendance = {
      ...todayAtt,
      checkOutTime: `${simulatedTime}:00`
    };

    onUpdateAttendance(updated);
    setFeedback({ type: 'success', text: 'Absensi pulang (check-out) berhasil direkam! Selamat beristirahat.' });
  };

  return (
    <div className="fade-in">
      {/* Shift Information Banner */}
      <div className="shift-details-card">
        <h3 className="shift-active-badge">
          <i className="fa-solid fa-circle-info"></i> Info Jadwal Kerja Hari Ini
        </h3>
        {todayShift ? (
          <div className="shift-grid">
            <div className="shift-item">
              <span className="shift-label">Shift Kerja</span>
              <span className="shift-value" style={{ color: 'var(--primary)' }}>
                Shift {todayShift.shiftType} {todayShift.shiftType === 'Pagi' ? '(07.00 - 15.00)' : '(13.00 - 21.00)'}
              </span>
            </div>
            <div className="shift-item">
              <span className="shift-label">Batas Waktu Masuk</span>
              <span className="shift-value">Maksimal Pukul {todayShift.shiftType === 'Pagi' ? '07:00 WIB' : '13:00 WIB'}</span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Anda tidak memiliki jadwal shift yang ditugaskan hari ini ({simulatedDate}). Secara default menggunakan aturan Shift Pagi.
          </div>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <i className={`fa-solid ${feedback.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
          <div>{feedback.text}</div>
        </div>
      )}

      {/* Dual Independent Attendance Cards */}
      <div className="checkin-out-section">
        
        {/* CARD 1: CHECK-IN */}
        <div className="action-card">
          <div className="action-card-header">
            <div>
              <h3 className="action-card-title">1. Absensi Datang</h3>
              <p className="action-card-subtitle">Pencatatan Kehadiran Masuk Shift</p>
            </div>
            <span className="action-card-badge">Check-In</span>
          </div>

          <div className="action-card-time">
            <i className="fa-regular fa-clock" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
            {simulatedTime}
          </div>

          <div className="action-card-footer">
            {todayAtt ? (
              <div style={{ padding: '16px', backgroundColor: '#e6f7f4', borderRadius: 'var(--radius)', border: '1px solid rgba(0, 184, 148, 0.2)' }}>
                <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-check"></i> Sudah Check-In
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text)' }}>
                  <strong>Jam Masuk:</strong> {todayAtt.checkInTime || '-'} <br />
                  <strong>Status:</strong> <span className={`badge badge-${todayAtt.status === 'Terlambat' ? 'orange' : (todayAtt.status === 'H' ? 'success' : 'danger')}`}>{todayAtt.status}</span> <br />
                  <strong>Keterangan:</strong> {todayAtt.keterangan}
                </div>
              </div>
            ) : (
              <div>
                {/* Custom Kehadiran Radio/Grid Selector */}
                <div className="attendance-role-grid">
                  <button 
                    type="button" 
                    className={`attendance-card-btn ${status === 'H' ? 'active h-active' : ''}`}
                    onClick={() => setStatus('H')}
                  >
                    <div className="status-icon-circle icon-green">
                      <i className="fa-solid fa-user-check"></i>
                    </div>
                    <span className="status-label">Hadir</span>
                  </button>

                  <button 
                    type="button" 
                    className={`attendance-card-btn ${status === 'S' ? 'active s-active' : ''}`}
                    onClick={() => setStatus('S')}
                  >
                    <div className="status-icon-circle icon-purple">
                      <i className="fa-solid fa-square-plus"></i>
                    </div>
                    <span className="status-label">Sakit</span>
                  </button>

                  <button 
                    type="button" 
                    className={`attendance-card-btn ${status === 'I' ? 'active i-active' : ''}`}
                    onClick={() => setStatus('I')}
                  >
                    <div className="status-icon-circle icon-orange">
                      <i className="fa-solid fa-file-signature"></i>
                    </div>
                    <span className="status-label">Izin</span>
                  </button>

                  <button 
                    type="button" 
                    className={`attendance-card-btn ${status === 'A' ? 'active a-active' : ''}`}
                    onClick={() => setStatus('A')}
                  >
                    <div className="status-icon-circle icon-red">
                      <i className="fa-solid fa-user-xmark"></i>
                    </div>
                    <span className="status-label">Alpa</span>
                  </button>
                </div>

                {/* Show late status warnings automatically */}
                {status === 'H' && latenessCheck.isLate && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--terlambat)', padding: '10px 14px', backgroundColor: '#fef5ed', border: '1px solid rgba(230, 126, 34, 0.2)', borderRadius: 'var(--radius)', marginBottom: '16px', fontWeight: 500 }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> Terdeteksi keterlambatan! Jam masuk ({simulatedTime}) melebihi batas shift {currentShiftType} ({latenessCheck.limitStr}). Status Anda akan tercatat sebagai <strong>TERLAMBAT</strong>.
                  </div>
                )}

                {/* Conditional Description Textarea */}
                {(status === 'S' || status === 'I' || status === 'A') && (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Keterangan / Alasan Alpa, Sakit, atau Izin <span>*</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Tulis alasan izin, gejala sakit, atau alasan tidak hadir dengan jelas..."
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                    ></textarea>
                  </div>
                )}

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckIn}>
                  <i className="fa-solid fa-fingerprint"></i> Kirim Kehadiran (Check-In)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: CHECK-OUT */}
        <div className="action-card">
          <div className="action-card-header">
            <div>
              <h3 className="action-card-title">2. Absensi Pulang</h3>
              <p className="action-card-subtitle">Pencatatan Keluar Shift Kerja</p>
            </div>
            <span className="action-card-badge" style={{ backgroundColor: '#ebf3fe', color: 'var(--info)' }}>Check-Out</span>
          </div>

          <div className="action-card-time">
            <i className="fa-solid fa-door-open" style={{ marginRight: '8px', color: 'var(--info)' }}></i>
            {simulatedTime}
          </div>

          <div className="action-card-footer">
            {!todayAtt ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fafbfc', borderRadius: 'var(--radius)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Silakan lakukan Check-In terlebih dahulu.</p>
              </div>
            ) : todayAtt.checkOutTime ? (
              <div style={{ padding: '16px', backgroundColor: '#ebf3fe', borderRadius: 'var(--radius)', border: '1px solid rgba(9, 132, 227, 0.2)' }}>
                <div style={{ color: 'var(--info)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-check"></i> Sudah Check-Out (Selesai Kerja)
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text)' }}>
                  <strong>Jam Pulang:</strong> {todayAtt.checkOutTime} <br />
                  <strong>Durasi Hari Ini:</strong> Selesai Kerja
                </div>
              </div>
            ) : todayAtt.status !== 'H' && todayAtt.status !== 'Terlambat' ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fff9f9', borderRadius: 'var(--radius)', border: '1px solid rgba(214, 48, 49, 0.15)', color: 'var(--danger)' }}>
                <i className="fa-solid fa-ban" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tidak perlu Check-Out karena hari ini berstatus Sakit, Izin, atau Alpa.</p>
              </div>
            ) : (
              <div>
                {/* Lateness constraints warning */}
                {!checkoutCheck.isAllowed ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--danger)', padding: '12px 14px', backgroundColor: '#fdebeb', border: '1px solid rgba(214, 48, 49, 0.15)', borderRadius: 'var(--radius)', marginBottom: '16px', fontWeight: 500 }}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '6px' }}></i> 
                    Check-out <strong>TERKUNCI</strong>. Aturan shift {currentShiftType} melarang kepulangan sebelum pukul <strong>{checkoutCheck.limitStr} WIB</strong>. 
                    Simulasikan jam jam pulang di atas pada panel atas untuk membuka tombol.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--success)', padding: '12px 14px', backgroundColor: '#e6f7f4', border: '1px solid rgba(0, 184, 148, 0.15)', borderRadius: 'var(--radius)', marginBottom: '16px', fontWeight: 500 }}>
                    <i className="fa-solid fa-lock-open" style={{ marginRight: '6px' }}></i>
                    Waktu kepulangan sudah terpenuhi! Tombol check-out sekarang <strong>AKTIF</strong>.
                  </div>
                )}

                <button 
                  className="btn btn-info" 
                  style={{ width: '100%' }} 
                  onClick={handleCheckOut}
                  disabled={!checkoutCheck.isAllowed}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Simpan Absensi Pulang (Check-Out)
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModuleAbsensi;
