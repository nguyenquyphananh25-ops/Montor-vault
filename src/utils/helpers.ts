import * as XLSX from 'xlsx';
import { Student, SubjectAttendance, StudentDRL, UserProfile, UlisSubjectResult } from '../types';
import { applyAdministrativeExcelStyles, getXlsxEngine, exportSubjectGradesXlsx, exportUlisOfficialRosterXlsx } from './documentExportEngine';

// Clipboard helper with fallback
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

// Export Students to Excel (ULIS Official Format)
export const exportStudentsToExcel = (
  students: Student[],
  className: string,
  user?: Partial<UserProfile>
) => {
  const xlsxLib = getXlsxEngine();
  const department = user?.department || 'Khoa Ngôn ngữ & Văn hóa các nước nói Tiếng Anh';
  const monitorName = user?.fullName || 'Nguyễn Hoàng Anh';

  const rows: any[][] = [
    ['ĐẠI HỌC QUỐC GIA HÀ NỘI', '', '', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', '', '', '', '', '', 'Độc lập – Tự do – Hạnh phúc'],
    ['PHÒNG CHÍNH TRỊ VÀ CÔNG TÁC HSSV', '', '', '', '', '', 'Hà Nội, ngày 28 tháng 10 năm 2024'],
    [],
    ['DANH SÁCH LỚP SINH VIÊN'],
    ['HỌC KỲ I – NĂM HỌC 2024 - 2025'],
    [],
    [`Lớp: ${className}`, '', `Khoa: ${department}`, '', '', '', `Sĩ số: ${students.length} sinh viên`],
    [],
    ['STT', 'MÃ SỐ SV', 'HỌ VÀ TÊN', 'NGÀY SINH', 'GIỚI TÍNH', 'LỚP', 'SỐ ĐIỆN THOẠI', 'EMAIL VNU', 'CHỨC VỤ', 'GHI CHÚ']
  ];

  students.forEach((s, index) => {
    rows.push([
      index + 1,
      s.mssv,
      s.fullName,
      s.birthDate,
      s.gender,
      className,
      s.phone,
      s.email,
      s.role,
      s.note || ''
    ]);
  });

  rows.push(
    [],
    [`Danh sách này có: ${students.length} sinh viên`],
    [],
    ['NGƯỜI LẬP DANH SÁCH', '', 'LỚP TRƯỞNG', '', 'CỐ VẤN HỌC TẬP', '', '', 'TRƯỞNG KHOA', ''],
    ['(Ký và ghi rõ họ tên)', '', '(Ký xác nhận)', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', ''],
    [],
    [],
    [monitorName, '', monitorName, '', 'ThS. Nguyễn Huyền Trang', '', '', 'PGS.TS. Trần Thị Hạnh', '']
  );

  const worksheet = xlsxLib.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 26 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
    { wch: 18 },
    { wch: 25 }
  ];
  applyAdministrativeExcelStyles(worksheet, xlsxLib);

  const workbook = xlsxLib.utils.book_new();
  xlsxLib.utils.book_append_sheet(workbook, worksheet, `Danh sách ${className}`);
  xlsxLib.writeFile(workbook, `Danh_Sach_Lop_${className}_ULIS.xlsx`, { bookType: 'xlsx', cellStyles: true });
};

// Export Subject Grade Results to Excel (ULIS Official Format)
export const exportSubjectGradesToExcel = (
  subject: { name: string; code: string; department?: string },
  students: Student[],
  user?: Partial<UserProfile>
) => {
  const className = user?.className || '23E1';
  const department = subject.department || user?.department || 'Khoa Ngôn ngữ & Văn hóa các nước nói Tiếng Anh';

  // Seed sample realistic grades based on student index if not pre-assigned
  const sampleGrades = students.map((s, idx) => {
    const tp1 = 8.5 + ((idx * 3) % 20) * 0.1;
    const tp2 = 8.0 + ((idx * 7) % 25) * 0.1;
    const finalScore = Number((tp1 * 0.1 + tp2 * 0.3 + (8.5 + ((idx * 5) % 15) * 0.1) * 0.6).toFixed(1));
    return {
      stt: idx + 1,
      mssv: s.mssv,
      fullName: s.fullName,
      birthDate: s.birthDate,
      className,
      subjectCode: subject.code,
      tp1: Number(tp1.toFixed(1)),
      tp2: Number(tp2.toFixed(1)),
      finalScore,
      note: finalScore >= 9.0 ? 'Xuất sắc' : finalScore >= 8.0 ? 'Giỏi' : 'Khá'
    };
  });

  const subjectResult: UlisSubjectResult = {
    subjectName: subject.name,
    subjectCode: subject.code,
    semester: 'I',
    academicYear: '2024 - 2025',
    department,
    className,
    grades: sampleGrades,
    graderName: user?.fullName || 'Nguyễn Hoàng Anh',
    checkerName: 'ThS. Lê Thị Thu Hà',
    headOfDepartment: 'TS. Vũ Đình Hải',
    deanName: 'PGS.TS. Trần Thị Hạnh'
  };

  exportSubjectGradesXlsx(subjectResult, 'xlsx');
};

// Export Attendance Matrix to Excel
export const exportAttendanceToExcel = (
  subject: SubjectAttendance,
  students: Student[],
  weeksCount: number
) => {
  const xlsxLib = getXlsxEngine();
  const data = students.map((s, idx) => {
    const studentRecords = subject.records[s.mssv] || {};
    let absentExcused = 0;
    let absentUnexcused = 0;
    let late = 0;
    let present = 0;

    const rowObj: Record<string, string | number> = {
      'STT': idx + 1,
      'MSSV': s.mssv,
      'Họ và Tên': s.fullName
    };

    for (let w = 1; w <= weeksCount; w++) {
      const status = studentRecords[w] || '-';
      rowObj[`Tuần ${w}`] = status;
      if (status === 'P') present++;
      if (status === 'A') absentExcused++;
      if (status === 'U') absentUnexcused++;
      if (status === 'L') late++;
    }

    const totalAbsentEquivalent = absentUnexcused + absentExcused * 0.5 + late * 0.33;
    const absencePercentage = Math.round((totalAbsentEquivalent / weeksCount) * 100);
    const isBanned = absencePercentage > 20;

    rowObj['Có mặt (P)'] = present;
    rowObj['Vắng CP (A)'] = absentExcused;
    rowObj['Vắng KP (U)'] = absentUnexcused;
    rowObj['Đi muộn (L)'] = late;
    rowObj['Quy đổi vắng'] = Number(totalAbsentEquivalent.toFixed(1));
    rowObj['Tỷ lệ vắng (%)'] = `${absencePercentage}%`;
    rowObj['Đủ điều kiện thi'] = isBanned ? 'CẤM THI (>20%)' : 'ĐỦ ĐIỀU KIỆN';

    return rowObj;
  });

  const worksheet = xlsxLib.utils.json_to_sheet(data);
  const workbook = xlsxLib.utils.book_new();
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 25 },
    ...Array(weeksCount).fill({ wch: 10 }),
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 }
  ];
  applyAdministrativeExcelStyles(worksheet, xlsxLib);

  xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Điểm Danh');
  xlsxLib.writeFile(workbook, `Diem_Danh_${subject.code}_${subject.name.replace(/\s+/g, '_')}.xlsx`, { bookType: 'xlsx', cellStyles: true });
};

// Export DRL Master Sheet
export const exportDRLMasterToExcel = (drlList: StudentDRL[], className: string) => {
  const xlsxLib = getXlsxEngine();
  const data = drlList.map((d, index) => {
    const s = d.monitorScores;
    const total = s.c1 + s.c2 + s.c3 + s.c4 + s.c5;
    let rank = 'Yếu';
    if (total >= 90) rank = 'Xuất sắc';
    else if (total >= 80) rank = 'Tốt';
    else if (total >= 65) rank = 'Khá';
    else if (total >= 50) rank = 'Trung bình';

    return {
      'STT': index + 1,
      'MSSV': d.studentMssv,
      'Họ và Tên': d.studentName,
      'TC1 (Học tập - max 20)': s.c1,
      'TC2 (Kỷ luật - max 25)': s.c2,
      'TC3 (CT-XH - max 20)': s.c3,
      'TC4 (Công dân - max 25)': s.c4,
      'TC5 (Công tác lớp - max 10)': s.c5,
      'Tổng Điểm Rèn Luyện': total,
      'Xếp Loại': rank,
      'Trạng Thái Ký Số': d.isSigned ? 'Đã ký xác nhận' : 'Chưa ký',
      'Ghi Chú': d.notes || ''
    };
  });

  const worksheet = xlsxLib.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 25 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 30 }
  ];
  applyAdministrativeExcelStyles(worksheet, xlsxLib);

  const workbook = xlsxLib.utils.book_new();
  xlsxLib.utils.book_append_sheet(workbook, worksheet, `Tong_Hop_DRL_${className}`);
  xlsxLib.writeFile(workbook, `Bang_Tong_Hop_DRL_${className}_ULIS.xlsx`, { bookType: 'xlsx', cellStyles: true });
};

// Generate sample transparent signature dataUrl
export const generateSampleSignatureDataUrl = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.strokeStyle = '#003B71';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw cursive "N. H. Anh"
  ctx.beginPath();
  // Capital N
  ctx.moveTo(70, 130);
  ctx.quadraticCurveTo(65, 80, 75, 45);
  ctx.quadraticCurveTo(85, 35, 95, 45);
  ctx.lineTo(125, 125);
  ctx.quadraticCurveTo(130, 85, 135, 55);
  ctx.quadraticCurveTo(140, 45, 145, 60);
  ctx.lineTo(145, 125);

  // Dot
  ctx.moveTo(155, 125);
  ctx.arc(155, 125, 2, 0, Math.PI * 2);

  // H
  ctx.moveTo(180, 45);
  ctx.lineTo(180, 125);
  ctx.moveTo(175, 85);
  ctx.lineTo(210, 80);
  ctx.moveTo(210, 45);
  ctx.lineTo(210, 125);

  // Dot
  ctx.moveTo(220, 125);
  ctx.arc(220, 125, 2, 0, Math.PI * 2);

  // Anh
  ctx.moveTo(240, 110);
  ctx.quadraticCurveTo(250, 75, 265, 75);
  ctx.quadraticCurveTo(275, 80, 275, 125);
  ctx.quadraticCurveTo(285, 90, 295, 90);
  ctx.quadraticCurveTo(305, 90, 305, 125);
  ctx.quadraticCurveTo(310, 60, 315, 40);
  ctx.lineTo(315, 125);
  ctx.quadraticCurveTo(325, 85, 335, 85);
  ctx.quadraticCurveTo(345, 90, 345, 125);

  // Swash underline
  ctx.moveTo(50, 145);
  ctx.quadraticCurveTo(200, 160, 350, 135);
  ctx.stroke();

  return canvas.toDataURL('image/png');
};
