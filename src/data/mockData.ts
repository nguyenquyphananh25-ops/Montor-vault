import {
  UserProfile,
  Lecturer,
  Student,
  SubjectAttendance,
  StudentDRL,
  MonitorCriterion,
  CongressMetadata
} from '../types';

export const INITIAL_USER: UserProfile = {
  fullName: 'Nguyễn Hoàng Anh',
  mssv: '23041088',
  password: 'ulis@monitor2024',
  phone: '0987.654.321',
  email: 'hoanganh_23041088@vnu.edu.vn',
  className: '23G3',
  department: 'Khoa Ngôn ngữ & Văn hóa Đức',
  birthDate: '2005-04-12',
  idCard: '001205012345',
  bankAccount: '102873648291',
  bankBranch: 'Vietcombank - Chi nhánh Thăng Long, Hà Nội'
};

export const INITIAL_LECTURERS: Lecturer[] = [
  {
    id: 'lec-1',
    name: 'TS. Lê Thị Ánh Nguyệt',
    title: 'TS.',
    email: 'nguyetla_ulis@vnu.edu.vn',
    phone: '0912.345.678',
    zalo: '0912345678',
    department: 'Khoa Ngôn ngữ & Văn hóa Đức',
    subjects: ['Tiếng Đức chuyên ngành B2.1', 'Ngữ pháp tiếng Đức thực hành'],
    room: 'Phòng 302, Nhà A4 - ULIS'
  },
  {
    id: 'lec-2',
    name: 'ThS. Trần Đức Minh',
    title: 'ThS.',
    email: 'minhtd_ulis@vnu.edu.vn',
    phone: '0983.112.233',
    zalo: '0983112233',
    department: 'Khoa Ngôn ngữ & Văn hóa Đức',
    subjects: ['Kỹ năng biên dịch tiếng Đức 1', 'Đất nước học Đức'],
    room: 'Phòng 305, Nhà A4 - ULIS'
  },
  {
    id: 'lec-3',
    name: 'PGS.TS. Hà Lê Kim Anh',
    title: 'PGS.TS.',
    email: 'anhhlk@vnu.edu.vn',
    phone: '0903.889.911',
    zalo: '0903889911',
    department: 'Phòng Đào tạo / Khoa SPTA',
    subjects: ['Phương pháp giảng dạy Ngoại ngữ', 'Đổi mới sáng tạo trong GD'],
    room: 'Phòng 106, Nhà A1 - Trụ sở chính ULIS'
  },
  {
    id: 'lec-4',
    name: 'ThS. Nguyễn Huyền Trang',
    title: 'ThS.',
    email: 'trangnh_ctcthssv@vnu.edu.vn',
    phone: '0977.556.688',
    zalo: '0977556688',
    department: 'Phòng Chính trị & CTHSSV',
    subjects: ['Công tác Cố vấn học tập', 'Kỹ năng mềm sinh viên'],
    room: 'Phòng 106, Nhà A2 - Phòng CT&CTHSSV'
  },
  {
    id: 'lec-5',
    name: 'TS. Phạm Minh Tuấn',
    title: 'TS.',
    email: 'tuanpm_triethoc@vnu.edu.vn',
    phone: '0915.678.901',
    zalo: '0915678901',
    department: 'Khoa Lý luận Chính trị (ĐHQGHN)',
    subjects: ['Triết học Mác - Lênin', 'Tư tưởng Hồ Chí Minh'],
    room: 'P.402, Nhà G3, ĐHQGHN'
  },
  {
    id: 'lec-6',
    name: 'ThS. Hoàng Thu Thủy',
    title: 'ThS.',
    email: 'thuyht_duc@vnu.edu.vn',
    phone: '0966.223.344',
    zalo: '0966223344',
    department: 'Khoa Ngôn ngữ & Văn hóa Đức',
    subjects: ['Kỹ năng Nói & Thuyết trình B2', 'Văn học Đức hiện đại'],
    room: 'Phòng 301, Nhà A4 - ULIS'
  },
  {
    id: 'lec-7',
    name: 'ThS. Đỗ Tuấn Long',
    title: 'ThS.',
    email: 'longdt_doanulis@vnu.edu.vn',
    phone: '0988.334.455',
    zalo: '0988334455',
    department: 'Đoàn Thanh niên - Hội Sinh viên ULIS',
    subjects: ['Công tác Đoàn - Hội sinh viên', 'Phong trào Sinh viên 5 Tốt'],
    room: 'Văn phòng Đoàn TN, Tầng 1 Nhà D3'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  { stt: 1, mssv: '23041088', fullName: 'Nguyễn Hoàng Anh', birthDate: '2005-04-12', gender: 'Nam', phone: '0987654321', email: 'hoanganh_23041088@vnu.edu.vn', role: 'Lớp trưởng', note: 'Phụ trách chung' },
  { stt: 2, mssv: '23041089', fullName: 'Trần Thị Mai Anh', birthDate: '2005-07-23', gender: 'Nữ', phone: '0978123456', email: 'maianh_23041089@vnu.edu.vn', role: 'Lớp phó học tập', note: 'Phụ trách bài giảng & tài liệu' },
  { stt: 3, mssv: '23041090', fullName: 'Lê Minh Tuấn', birthDate: '2005-01-15', gender: 'Nam', phone: '0912987654', email: 'minhtuan_23041090@vnu.edu.vn', role: 'Bí thư chi đoàn', note: 'Quản lý công tác Đoàn' },
  { stt: 4, mssv: '23041091', fullName: 'Phạm Thu Trang', birthDate: '2005-11-04', gender: 'Nữ', phone: '0963321456', email: 'thutrang_23041091@vnu.edu.vn', role: 'Phó Bí thư', note: 'Phụ trách sổ Đoàn viên' },
  { stt: 5, mssv: '23041092', fullName: 'Vũ Quốc Bảo', birthDate: '2005-09-18', gender: 'Nam', phone: '0984556677', email: 'quocbao_23041092@vnu.edu.vn', role: 'Lớp phó đời sống', note: 'Thủ quỹ lớp' },
  { stt: 6, mssv: '23041093', fullName: 'Bùi Phương Linh', birthDate: '2005-03-30', gender: 'Nữ', phone: '0904112233', email: 'phuonglinh_23041093@vnu.edu.vn', role: 'Ủy viên BCH', note: 'Phong trào văn nghệ' },
  { stt: 7, mssv: '23041094', fullName: 'Đặng Đình Huy', birthDate: '2005-06-11', gender: 'Nam', phone: '0971223344', email: 'dinhhuy_23041094@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 8, mssv: '23041095', fullName: 'Hoàng Thùy Dương', birthDate: '2005-08-05', gender: 'Nữ', phone: '0913445566', email: 'thuyduong_23041095@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 9, mssv: '23041096', fullName: 'Nguyễn Thành Đạt', birthDate: '2005-12-29', gender: 'Nam', phone: '0982334455', email: 'thanhdat_23041096@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 10, mssv: '23041097', fullName: 'Ngô Khánh Huyền', birthDate: '2005-02-14', gender: 'Nữ', phone: '0965778899', email: 'khanhhuyen_23041097@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 11, mssv: '23041098', fullName: 'Đỗ Đức Thắng', birthDate: '2005-10-02', gender: 'Nam', phone: '0902998877', email: 'ducthang_23041098@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 12, mssv: '23041099', fullName: 'Trịnh Hoài An', birthDate: '2005-05-19', gender: 'Nữ', phone: '0973665544', email: 'hoaian_23041099@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 13, mssv: '23041100', fullName: 'Vũ Đức Duy', birthDate: '2005-07-08', gender: 'Nam', phone: '0919112244', email: 'ducduy_23041100@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 14, mssv: '23041101', fullName: 'Phan Thị Yến Nhi', birthDate: '2005-09-25', gender: 'Nữ', phone: '0986554433', email: 'yennhi_23041101@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 15, mssv: '23041102', fullName: 'Lý Gia Hưng', birthDate: '2005-03-12', gender: 'Nam', phone: '0961223388', email: 'giahung_23041102@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 16, mssv: '23041103', fullName: 'Đinh Ngọc Ánh', birthDate: '2005-06-30', gender: 'Nữ', phone: '0906778811', email: 'ngocanh_23041103@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 17, mssv: '23041104', fullName: 'Cao Văn Nam', birthDate: '2005-12-03', gender: 'Nam', phone: '0974332211', email: 'vannam_23041104@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 18, mssv: '23041105', fullName: 'Dương Thảo Vy', birthDate: '2005-04-17', gender: 'Nữ', phone: '0918667755', email: 'thaovy_23041105@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 19, mssv: '23041106', fullName: 'Tạ Quang Hải', birthDate: '2005-08-22', gender: 'Nam', phone: '0985443322', email: 'quanghai_23041106@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 20, mssv: '23041107', fullName: 'Lê Diệu Linh', birthDate: '2005-01-09', gender: 'Nữ', phone: '0968990011', email: 'dieulinh_23041107@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 21, mssv: '23041108', fullName: 'Nguyễn Văn Kiên', birthDate: '2005-11-20', gender: 'Nam', phone: '0901234888', email: 'vankien_23041108@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 22, mssv: '23041109', fullName: 'Phạm Quỳnh Anh', birthDate: '2005-05-01', gender: 'Nữ', phone: '0979887766', email: 'quynhanh_23041109@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 23, mssv: '23041110', fullName: 'Trần Thế Vinh', birthDate: '2005-10-14', gender: 'Nam', phone: '0914556633', email: 'thevinh_23041110@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 24, mssv: '23041111', fullName: 'Võ Thị Kim Oanh', birthDate: '2005-07-16', gender: 'Nữ', phone: '0989332211', email: 'kimoanh_23041111@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 25, mssv: '23041112', fullName: 'Hà Xuân Bách', birthDate: '2005-02-28', gender: 'Nam', phone: '0962445588', email: 'xuanbach_23041112@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 26, mssv: '23041113', fullName: 'Nguyễn Thị Cẩm Ly', birthDate: '2005-09-07', gender: 'Nữ', phone: '0907119933', email: 'camly_23041113@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 27, mssv: '23041114', fullName: 'Lê Hoàng Long', birthDate: '2005-06-04', gender: 'Nam', phone: '0975664422', email: 'hoanglong_23041114@vnu.edu.vn', role: 'Sinh viên' },
  { stt: 28, mssv: '23041115', fullName: 'Đỗ Quỳnh Nga', birthDate: '2005-03-21', gender: 'Nữ', phone: '0916335577', email: 'quynhnga_23041115@vnu.edu.vn', role: 'Sinh viên' }
];

export const INITIAL_SUBJECTS: SubjectAttendance[] = [
  {
    id: 'sub-1',
    name: 'Tiếng Đức chuyên ngành B2.1',
    code: 'GER2041',
    lecturerName: 'TS. Lê Thị Ánh Nguyệt',
    totalWeeks: 15,
    records: {}
  },
  {
    id: 'sub-2',
    name: 'Ngữ pháp tiếng Đức thực hành',
    code: 'GER2015',
    lecturerName: 'ThS. Hoàng Thu Thủy',
    totalWeeks: 15,
    records: {}
  },
  {
    id: 'sub-3',
    name: 'Triết học Mác - Lênin',
    code: 'PHI1006',
    lecturerName: 'TS. Phạm Minh Tuấn',
    totalWeeks: 15,
    records: {}
  }
];

// Pre-fill realistic attendance data for subject 1
export const generateInitialAttendance = (): Record<string, Record<number, 'P' | 'A' | 'U' | 'L'>> => {
  const records: Record<string, Record<number, 'P' | 'A' | 'U' | 'L'>> = {};
  INITIAL_STUDENTS.forEach((student, idx) => {
    records[student.mssv] = {};
    for (let w = 1; w <= 10; w++) {
      // By default most present
      if (idx === 6 && (w === 2 || w === 4 || w === 7 || w === 9)) {
        // Dang Dinh Huy has frequent unexcused absences (4 absences out of 10 -> danger!)
        records[student.mssv][w] = 'U';
      } else if (idx === 14 && (w === 3 || w === 6 || w === 8 || w === 10)) {
        // Ly Gia Hung has 4 absences
        records[student.mssv][w] = w % 2 === 0 ? 'A' : 'U';
      } else if (idx === 20 && (w === 5 || w === 8)) {
        // Nguyen Van Kien has late
        records[student.mssv][w] = 'L';
      } else if (idx % 5 === 0 && w === 7) {
        records[student.mssv][w] = 'A';
      } else {
        records[student.mssv][w] = 'P';
      }
    }
  });
  return records;
};

// 5 Standard ULIS ĐRL Dimensions
export const DRL_RUBRIC_INFO = [
  {
    key: 'c1' as const,
    title: 'Tiêu chí 1: Ý thức & kết quả học tập, NCKH',
    max: 20,
    desc: 'Đi học chuyên cần, không vi phạm quy chế thi, tham gia NCKH sinh viên ULIS / VNU, CLB học thuật.'
  },
  {
    key: 'c2' as const,
    title: 'Tiêu chí 2: Ý thức chấp hành nội quy, quy chế ĐHQGHN & Nhà trường',
    max: 25,
    desc: 'Chấp hành nghiêm túc quy chế đào tạo, đóng học phí đúng hạn, khám sức khỏe, tham gia BHYT, không vi phạm pháp luật.'
  },
  {
    key: 'c3' as const,
    title: 'Tiêu chí 3: Hoạt động chính trị - xã hội, văn thể mỹ & tình nguyện',
    max: 20,
    desc: 'Tham gia các phong trào Đoàn - Hội, chiến dịch Mùa hè xanh, Ngày hội việc làm ULIS Job Fair, hiến máu nhân đạo.'
  },
  {
    key: 'c4' as const,
    title: 'Tiêu chí 4: Phẩm chất công dân & quan hệ cộng đồng',
    max: 25,
    desc: 'Lối sống văn minh, tương thân tương ái, tinh thần trách nhiệm với tập thể, giữ gìn hình ảnh sinh viên ULIS.'
  },
  {
    key: 'c5' as const,
    title: 'Tiêu chí 5: Ý thức & kết quả tham gia công tác tập thể lớp, Đoàn thể',
    max: 10,
    desc: 'Đóng góp tích cực cho ban cán sự lớp, BCH Chi đoàn, đạt danh hiệu Sinh viên 5 Tốt, khen thưởng các cấp.'
  }
];

export const INITIAL_DRL_DATA: StudentDRL[] = INITIAL_STUDENTS.map((st, i) => {
  const isLeader = st.role !== 'Sinh viên';
  const selfScores = {
    c1: isLeader ? 19 : Math.min(20, 16 + (i % 5)),
    c2: 25,
    c3: isLeader ? 20 : Math.min(20, 15 + (i % 6)),
    c4: 25,
    c5: isLeader ? 10 : Math.min(10, 6 + (i % 5))
  };
  return {
    studentMssv: st.mssv,
    studentName: st.fullName,
    selfScores,
    monitorScores: { ...selfScores }, // defaults to matching selfScores
    isSigned: false,
    notes: isLeader ? 'Cán sự lớp tích cực, gương mẫu' : 'Hoàn thành tốt nhiệm vụ học tập & phong trào',
    lastUpdated: '2024-10-15'
  };
});

export const INITIAL_MONITOR_CRITERIA: MonitorCriterion[] = [
  // Mục A: Nhà trường (80đ)
  {
    id: 'a1',
    category: 'A_NhaTruong',
    title: '1. Quản lý sĩ số và tình hình chấp hành nội quy học tập của lớp',
    description: 'Thường xuyên theo dõi chuyên cần, nhắc nhở sinh viên chấp hành kỷ luật giảng đường, nội quy Nhà trường.',
    maxScore: 20,
    selfScore: 20
  },
  {
    id: 'a2',
    category: 'A_NhaTruong',
    title: '2. Phổ biến kịp thời thông tin, quy chế đào tạo & thông báo từ P.CT&CTHSSV, P.ĐT',
    description: 'Truyền đạt chính xác, kịp thời văn bản chỉ đạo của Trường, Khoa, giải đáp thắc mắc cho SV.',
    maxScore: 20,
    selfScore: 19
  },
  {
    id: 'a3',
    category: 'A_NhaTruong',
    title: '3. Định kỳ báo cáo tình hình lớp và tham gia đầy đủ các cuộc họp giao ban Lớp trưởng',
    description: 'Tham gia họp giao ban cán sự với Ban Giám hiệu, Phòng CT&CTHSSV, Khoa đúng giờ, ghi chép đầy đủ.',
    maxScore: 15,
    selfScore: 15
  },
  {
    id: 'a4',
    category: 'A_NhaTruong',
    title: '4. Đôn đốc việc nộp học phí, bảo hiểm y tế và thực hiện khảo sát môn học đúng hạn',
    description: 'Tỷ lệ sinh viên hoàn thành khảo sát môn học đạt 100%, đôn đốc nghĩa vụ tài chính đúng thời hạn.',
    maxScore: 15,
    selfScore: 15
  },
  {
    id: 'a5',
    category: 'A_NhaTruong',
    title: '5. Tổ chức đánh giá Điểm Rèn Luyện (ĐRL) khách quan, trung thực và đúng tiến độ',
    description: 'Hoàn thành tổng hợp ĐRL học kỳ, tổ chức họp xét công khai, nộp bảng tổng hợp cho Khoa đúng lịch.',
    maxScore: 10,
    selfScore: 10
  },

  // Mục B: Đoàn - Hội (20đ)
  {
    id: 'b1',
    category: 'B_DoanHoi',
    title: '1. Phối hợp với BCH Chi đoàn tổ chức phong trào thanh niên & hoạt động ngoại khóa',
    description: 'Tích cực cùng Chi đoàn triển khai các chương trình tình nguyện, văn nghệ, thể thao do Đoàn TN - Hội SV ULIS phát động.',
    maxScore: 10,
    selfScore: 10
  },
  {
    id: 'b2',
    category: 'B_DoanHoi',
    title: '2. Động viên sinh viên tham gia phong trào "Sinh viên 5 Tốt" và NCKH sinh viên',
    description: 'Khuyến khích đoàn viên đăng ký tiêu chí Sinh viên 5 Tốt các cấp, tham gia hội nghị NCKH cấp Khoa và Trường.',
    maxScore: 10,
    selfScore: 9
  }
];

export const INITIAL_CONGRESS_DATA: CongressMetadata = {
  tenChiDoan: 'Chi đoàn 23G3',
  khoa: 'Khoa Ngôn ngữ & Văn hóa Đức',
  nhiemKy: '2024 - 2025',
  thoiGian: '08h30 ngày 26 tháng 10 năm 2024',
  diaDiem: 'Phòng 710, Tòa nhà A2, Trường Đại học Ngoại ngữ - ĐHQGHN',
  daiBieuKhachMoi: 'ThS. Nguyễn Huyền Trang (Cố vấn học tập); Đ/c Đỗ Tuấn Long (Đại diện LCĐ Khoa NN&VH Đức)',
  tongSoDoanVien: 28,
  soDoanVienCoMat: 27,
  doanChuTich: ['Đ/c Lê Minh Tuấn', 'Đ/c Nguyễn Hoàng Anh', 'Đ/c Phạm Thu Trang'],
  thuKy: ['Đ/c Trần Thị Mai Anh', 'Đ/c Bùi Phương Linh'],
  banKiemPhieu: ['Đ/c Vũ Quốc Bảo (Trưởng ban)', 'Đ/c Đặng Đình Huy (Ủy viên)', 'Đ/c Hoàng Thùy Dương (Ủy viên)'],
  danhSachUngVien: [
    'Đ/c Lê Minh Tuấn (Ứng cử Bí thư)',
    'Đ/c Phạm Thu Trang (Ứng cử Phó Bí thư)',
    'Đ/c Bùi Phương Linh (Ứng cử Ủy viên BCH)',
    'Đ/c Nguyễn Thành Đạt (Ứng cử Ủy viên BCH)',
    'Đ/c Ngô Khánh Huyền (Ứng cử Ủy viên BCH)'
  ],
  soLuongBau: 3,
  ketQuaKiemPhieu: {
    phatRa: 27,
    thuVao: 27,
    hopLe: 27,
    khongHopLe: 0,
    votes: {
      'Đ/c Lê Minh Tuấn': 27,
      'Đ/c Phạm Thu Trang': 26,
      'Đ/c Bùi Phương Linh': 25,
      'Đ/c Nguyễn Thành Đạt': 2,
      'Đ/c Ngô Khánh Huyền': 1
    }
  },
  phanCongNhiemVu: {
    biThu: 'Đ/c Lê Minh Tuấn',
    phoBiThu: 'Đ/c Phạm Thu Trang',
    uyVien: ['Đ/c Bùi Phương Linh', 'Đ/c Nguyễn Hoàng Anh (Lớp trưởng phụ trách phối hợp)']
  }
};
