export interface UserProfile {
  fullName: string;
  mssv: string;
  password?: string;
  phone: string;
  email: string;
  className: string;
  department: string;
  birthDate: string;
  idCard: string; // CCCD
  bankAccount?: string; // Số tài khoản ngân hàng
  bankBranch?: string; // Ngân hàng & Chi nhánh
}

export interface Lecturer {
  id: string;
  name: string;
  title: string; // TS., ThS., PGS.TS.
  email: string;
  phone: string;
  zalo: string;
  department: string; // Khoa / Bộ môn
  subjects: string[];
  room: string;
}

export interface Student {
  stt: number;
  mssv: string;
  fullName: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ';
  phone: string;
  email: string;
  role: 'Lớp trưởng' | 'Lớp phó học tập' | 'Lớp phó đời sống' | 'Bí thư chi đoàn' | 'Phó Bí thư' | 'Sinh viên' | 'Ủy viên BCH';
  note?: string;
}

export type AttendanceStatus = 'P' | 'A' | 'U' | 'L'; // Present, Absent Excused (có phép), Unexcused (không phép), Late (Đi muộn)

export interface SubjectAttendance {
  id: string;
  name: string;
  code: string;
  lecturerName: string;
  totalWeeks: number;
  records: Record<string, Record<number, AttendanceStatus>>; // studentMssv -> weekNumber -> status
}

export interface DRLScores {
  c1: number; // Max 20
  c2: number; // Max 25
  c3: number; // Max 20
  c4: number; // Max 25
  c5: number; // Max 10
}

export interface StudentDRL {
  studentMssv: string;
  studentName: string;
  selfScores: DRLScores;
  monitorScores: DRLScores;
  isSigned: boolean;
  notes: string;
  lastUpdated?: string;
}

export interface MonitorCriterion {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  selfScore: number;
  category: 'A_NhaTruong' | 'B_DoanHoi';
}

export interface ConsensusVote {
  studentMssv: string;
  studentName: string;
  agree: boolean;
  comment: string;
}

export interface CongressMetadata {
  tenChiDoan: string;
  khoa: string;
  nhiemKy: string;
  thoiGian: string; // e.g. 08:30 ngày 25/10/2024
  diaDiem: string; // e.g. P.710 Nhà A2, Trường ĐH Ngoại ngữ - ĐHQGHN
  daiBieuKhachMoi: string;
  tongSoDoanVien: number;
  soDoanVienCoMat: number;
  doanChuTich: string[];
  thuKy: string[];
  banKiemPhieu: string[];
  danhSachUngVien: string[];
  soLuongBau: number;
  ketQuaKiemPhieu?: {
    phatRa: number;
    thuVao: number;
    hopLe: number;
    khongHopLe: number;
    votes: Record<string, number>;
  };
  phanCongNhiemVu?: {
    biThu: string;
    phoBiThu: string;
    uyVien: string[];
  };
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface SubjectGradeItem {
  stt: number;
  mssv: string;
  fullName: string;
  birthDate: string;
  className: string;
  subjectCode: string;
  tp1: number | string; // Điểm thành phần 1 (chuyên cần / bài tập - 10%)
  tp2: number | string; // Điểm thành phần 2 (giữa kỳ - 30%)
  finalScore: number | string; // Điểm môn học (bằng số - 60% hoặc tổng kết)
  note?: string;
}

export interface UlisSubjectResult {
  subjectName: string;
  subjectCode: string;
  semester: string;
  academicYear: string;
  department: string;
  className: string;
  grades: SubjectGradeItem[];
  graderName?: string; // Người vào điểm
  checkerName?: string; // Người kiểm tra
  headOfDepartment?: string; // Trưởng Bộ môn
  deanName?: string; // Trưởng Khoa
}
