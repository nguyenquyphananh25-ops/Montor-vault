import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, UserProfile, UlisSubjectResult } from '../types';
import { exportStudentsToExcel, exportSubjectGradesToExcel } from '../utils/helpers';
import {
  exportUlisOfficialRosterDocx,
  exportUlisOfficialRosterXlsx,
  exportSubjectGradesDocx,
  exportSubjectGradesXlsx,
  exportElementToPdf
} from '../utils/documentExportEngine';
import { ExportOptionsModal } from './ExportOptionsModal';
import {
  Users,
  Search,
  Download,
  Upload,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  X,
  Phone,
  Mail,
  Shield,
  Filter,
  GraduationCap,
  FileText,
  Printer
} from 'lucide-react';

interface ClassRosterProps {
  students: Student[];
  className: string;
  user?: UserProfile;
  savedSignature?: string | null;
  onUpdateStudents: (students: Student[]) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ClassRoster: React.FC<ClassRosterProps> = ({
  students,
  className,
  user,
  savedSignature,
  onUpdateStudents,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGradeReportModalOpen, setIsGradeReportModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{ name: string; code: string }>({
    name: 'Tiếng Anh Học Thuật 1',
    code: 'ENG1001'
  });

  const [exportModalConfig, setExportModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    elementId: string;
    onExportDocx: () => Promise<void>;
    onExportXlsx?: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Student state
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    mssv: '',
    fullName: '',
    birthDate: '2005-01-01',
    gender: 'Nữ',
    phone: '',
    email: '',
    role: 'Sinh viên',
    note: ''
  });

  const roles = [
    'All',
    'Lớp trưởng',
    'Lớp phó học tập',
    'Lớp phó đời sống',
    'Bí thư chi đoàn',
    'Phó Bí thư',
    'Ủy viên BCH',
    'Sinh viên'
  ];

  const filteredStudents = students.filter((s) => {
    const matchesRole = roleFilter === 'All' || s.role === roleFilter;
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mssv.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    return matchesRole && matchesSearch;
  });

  const handleExportExcel = () => {
    exportStudentsToExcel(students, className, user);
    onShowToast('Xuất Excel thành công', `Đã tải về danh sách ${students.length} sinh viên chuẩn thể thức ULIS`, 'success');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'STT': 1,
        'MSSV': '23041088',
        'Họ và Tên': 'Nguyễn Hoàng Anh',
        'Ngày Sinh': '2005-04-12',
        'Giới Tính': 'Nam',
        'Số Điện Thoại': '0987654321',
        'Email': 'hoanganh_23041088@vnu.edu.vn',
        'Chức Vụ': 'Lớp trưởng',
        'Ghi Chú': 'Mẫu danh sách sinh viên'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Danh_Sach');
    XLSX.writeFile(wb, `Mau_Nhap_Danh_Sach_Lop_ULIS.xlsx`);
    onShowToast('Tải mẫu thành công', 'File mẫu Excel đã được tải xuống', 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          onShowToast('File trống', 'Không tìm thấy dữ liệu trong file Excel', 'error');
          return;
        }

        const parsedStudents: Student[] = rawData.map((row, idx) => ({
          stt: idx + 1,
          mssv: String(row['Mã Sinh Viên (MSSV)'] || row['MSSV'] || row['Mã SV'] || `2304${1000 + idx}`).trim(),
          fullName: String(row['Họ và Tên'] || row['Họ tên'] || row['Họ và tên'] || `Sinh viên ${idx + 1}`).trim(),
          birthDate: String(row['Ngày Sinh'] || row['Ngày sinh'] || '2005-01-01').trim(),
          gender: (row['Giới Tính'] || row['Giới tính'] || 'Nữ') === 'Nam' ? 'Nam' : 'Nữ',
          phone: String(row['Số Điện Thoại'] || row['SĐT'] || row['Điện thoại'] || '0900000000').trim(),
          email: String(row['Email VNU'] || row['Email'] || `sv_${idx + 1}@vnu.edu.vn`).trim(),
          role: (row['Chức Vụ Lớp'] || row['Chức vụ'] || row['Chức Vụ'] || 'Sinh viên') as any,
          note: row['Ghi Chú'] || row['Ghi chú'] || ''
        }));

        onUpdateStudents(parsedStudents);
        onShowToast('Nhập Excel thành công!', `Đã nạp ${parsedStudents.length} sinh viên vào sổ lớp`, 'success');
      } catch (err) {
        console.error(err);
        onShowToast('Lỗi đọc file', 'File Excel không đúng định dạng chuẩn', 'error');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName || !newStudent.mssv) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập Họ tên và MSSV', 'warning');
      return;
    }

    const created: Student = {
      stt: students.length + 1,
      mssv: newStudent.mssv.trim(),
      fullName: newStudent.fullName.trim(),
      birthDate: newStudent.birthDate || '2005-01-01',
      gender: newStudent.gender as 'Nam' | 'Nữ',
      phone: newStudent.phone || '0900000000',
      email: newStudent.email || `${newStudent.mssv}@vnu.edu.vn`,
      role: (newStudent.role || 'Sinh viên') as any,
      note: newStudent.note || ''
    };

    const updated = [...students, created].map((s, idx) => ({ ...s, stt: idx + 1 }));
    onUpdateStudents(updated);
    setIsAddModalOpen(false);
    onShowToast('Thành công', `Đã thêm sinh viên ${created.fullName}`, 'success');
    setNewStudent({
      mssv: '',
      fullName: '',
      birthDate: '2005-01-01',
      gender: 'Nữ',
      phone: '',
      email: '',
      role: 'Sinh viên',
      note: ''
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const updated = students.map((s) => (s.mssv === editingStudent.mssv ? editingStudent : s));
    onUpdateStudents(updated);
    setEditingStudent(null);
    onShowToast('Cập nhật thành công', `Đã lưu thông tin ${editingStudent.fullName}`, 'success');
  };

  const handleDeleteStudent = (mssv: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sinh viên ${name} (${mssv}) khỏi danh sách lớp không?`)) {
      const updated = students
        .filter((s) => s.mssv !== mssv)
        .map((s, idx) => ({ ...s, stt: idx + 1 }));
      onUpdateStudents(updated);
      onShowToast('Đã xóa', `Đã xóa ${name} khỏi danh sách`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#003B71]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Quản Lý Danh Sách Lớp {className}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Sĩ số: {students.length} SV
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quản lý hồ sơ, phân quyền ban cán sự & đồng bộ trực tiếp với cơ sở dữ liệu điểm danh, ĐRL
            </p>
          </div>
        </div>

        {/* Buttons: Export Excel, Import Excel, Add Student */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            title="Tải mẫu Excel nhập danh sách sinh viên"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mẫu Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 border border-blue-300 hover:bg-blue-50 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhập Excel/CSV</span>
          </button>

          <button
            onClick={() => setIsGradeReportModalOpen(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bảng Điểm Kết Quả Môn Học Chuẩn ULIS"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bảng Điểm Chuẩn ULIS</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() =>
              setExportModalConfig({
                isOpen: true,
                title: `Danh Sách Lớp Sinh Viên: ${className}`,
                subtitle: `Khoa: ${user?.department || 'Khoa Ngôn ngữ & Văn hóa các nước nói Tiếng Anh'} - Sĩ số: ${students.length} sinh viên`,
                elementId: 'ulis-roster-export-container',
                onExportDocx: async () => {
                  if (user) await exportUlisOfficialRosterDocx(students, user, savedSignature || null);
                },
                onExportXlsx: () => {
                  if (user) exportUlisOfficialRosterXlsx(students, user, 'xlsx');
                  else exportStudentsToExcel(students, className, user);
                }
              })
            }
            className="px-3.5 py-2 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Mở tùy chọn xuất file PDF A4, Word .DOCX hoặc Excel .XLSX"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tùy Chọn Xuất File</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sinh Viên</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên, MSSV, Email, Số điện thoại..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'Tất cả chức vụ' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">MSSV</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-3">Giới tính</th>
                <th className="py-3 px-3">Ngày sinh</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Email VNU</th>
                <th className="py-3 px-4">Chức vụ lớp</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const isLeader = st.role !== 'Sinh viên';

                return (
                  <tr
                    key={st.mssv}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      isLeader ? 'bg-sky-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-medium text-slate-400">
                      {st.stt}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                      {st.mssv}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{st.fullName}</span>
                        {isLeader && (
                          <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{st.gender}</td>
                    <td className="py-3 px-3 text-slate-600">{st.birthDate}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <a href={`tel:${st.phone}`} className="hover:underline hover:text-blue-600">
                        {st.phone}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                      <a href={`mailto:${st.email}`} className="hover:underline hover:text-blue-600">
                        {st.email}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          st.role === 'Lớp trưởng'
                            ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                            : st.role.includes('Lớp phó')
                            ? 'bg-blue-100 text-blue-800'
                            : st.role.includes('Bí thư')
                            ? 'bg-indigo-100 text-indigo-800'
                            : st.role.includes('Ủy viên')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditingStudent(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.mssv, st.fullName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa sinh viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Không tìm thấy sinh viên phù hợp với từ khóa tìm kiếm.
          </div>
        )}
      </div>

      {/* Modal Add Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Sinh Viên Vào Lớp {className}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã Sinh Viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.mssv}
                  onChange={(e) => setNewStudent({ ...newStudent, mssv: e.target.value })}
                  placeholder="VD: 23041120"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên sinh viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={newStudent.birthDate}
                    onChange={(e) => setNewStudent({ ...newStudent, birthDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email VNU (@vnu.edu.vn)
                </label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="binhtv_23041120@vnu.edu.vn"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ trong lớp
                </label>
                <select
                  value={newStudent.role}
                  onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó đời sống">Lớp phó đời sống</option>
                  <option value="Bí thư chi đoàn">Bí thư chi đoàn</option>
                  <option value="Phó Bí thư">Phó Bí thư</option>
                  <option value="Ủy viên BCH">Ủy viên BCH</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#003B71] text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Thêm Vào Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Chỉnh Sửa Thông Tin Sinh Viên</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã Sinh Viên (MSSV)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingStudent.mssv}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-500 rounded-lg outline-none cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên sinh viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={editingStudent.gender}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, gender: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={editingStudent.birthDate}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, birthDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email VNU
                </label>
                <input
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ trong lớp
                </label>
                <select
                  value={editingStudent.role}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó đời sống">Lớp phó đời sống</option>
                  <option value="Bí thư chi đoàn">Bí thư chi đoàn</option>
                  <option value="Phó Bí thư">Phó Bí thư</option>
                  <option value="Ủy viên BCH">Ủy viên BCH</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#003B71] text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BẢNG ĐIỂM KẾT QUẢ MÔN HỌC CHUẨN ULIS                              */}
      {/* ========================================================================= */}
      {isGradeReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-sm">
                  Bảng Điểm Kết Quả Môn Học Chuẩn ULIS - Lớp {className}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSubject.code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const map: Record<string, string> = {
                      ENG1001: 'Tiếng Anh Học Thuật 1',
                      ENG2005: 'Ngữ Âm - Âm Vị Học Tiếng Anh',
                      LIN1001: 'Dẫn Luận Ngôn Ngữ Học',
                      ENG2012: 'Kỹ Năng Thuyết Trình Tiếng Anh',
                      ENG2015: 'Văn Hóa Các Nước Nói Tiếng Anh'
                    };
                    setSelectedSubject({ code, name: map[code] || 'Tiếng Anh Học Thuật 1' });
                  }}
                  className="px-2.5 py-1 text-xs bg-blue-800/80 text-white rounded-lg border border-blue-400 font-bold outline-none"
                >
                  <option value="ENG1001">Tiếng Anh Học Thuật 1 (ENG1001)</option>
                  <option value="ENG2005">Ngữ Âm - Âm Vị Học (ENG2005)</option>
                  <option value="LIN1001">Dẫn Luận Ngôn Ngữ (LIN1001)</option>
                  <option value="ENG2012">Kỹ Năng Thuyết Trình (ENG2012)</option>
                  <option value="ENG2015">Văn Hóa Các Nước (ENG2015)</option>
                </select>

                <button
                  onClick={() => {
                    const sampleGrades = students.map((s, idx) => {
                      const tp1 = Number((8.5 + ((idx * 3) % 20) * 0.1).toFixed(1));
                      const tp2 = Number((8.0 + ((idx * 7) % 25) * 0.1).toFixed(1));
                      const finalScore = Number((tp1 * 0.1 + tp2 * 0.3 + (8.5 + ((idx * 5) % 15) * 0.1) * 0.6).toFixed(1));
                      return {
                        stt: idx + 1,
                        mssv: s.mssv,
                        fullName: s.fullName,
                        birthDate: s.birthDate,
                        className,
                        subjectCode: selectedSubject.code,
                        tp1,
                        tp2,
                        finalScore,
                        note: finalScore >= 9.0 ? 'Xuất sắc' : finalScore >= 8.0 ? 'Giỏi' : 'Khá'
                      };
                    });

                    const subResult: UlisSubjectResult = {
                      subjectName: selectedSubject.name,
                      subjectCode: selectedSubject.code,
                      semester: 'I',
                      academicYear: '2024 - 2025',
                      department: user?.department || 'Khoa Ngôn ngữ & Văn hóa các nước nói Tiếng Anh',
                      className,
                      grades: sampleGrades,
                      graderName: user?.fullName || 'Nguyễn Hoàng Anh',
                      checkerName: 'ThS. Lê Thị Thu Hà',
                      headOfDepartment: 'TS. Vũ Đình Hải',
                      deanName: 'PGS.TS. Trần Thị Hạnh'
                    };

                    setExportModalConfig({
                      isOpen: true,
                      title: `Bảng Điểm Kết Quả Môn Học: ${selectedSubject.name}`,
                      subtitle: `Mã môn: ${selectedSubject.code} - Lớp: ${className}`,
                      elementId: 'ulis-grades-roster-modal-container',
                      onExportDocx: async () => {
                        await exportSubjectGradesDocx(subResult);
                      },
                      onExportXlsx: () => {
                        exportSubjectGradesXlsx(subResult, 'xlsx');
                      }
                    });
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File</span>
                </button>

                <button
                  onClick={() => setIsGradeReportModalOpen(false)}
                  className="text-blue-200 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
              <div
                id="ulis-grades-roster-modal-container"
                className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm vn-admin-document max-w-3xl mx-auto space-y-4"
              >
                {/* 2-Column National Header */}
                <div className="grid grid-cols-2 gap-4 text-center items-start border-b border-black/10 pb-4">
                  <div>
                    <p className="text-[13px] font-bold uppercase leading-tight">
                      TRƯỜNG ĐẠI HỌC NGOẠI NGỮ
                    </p>
                    <p className="text-[12px] font-bold uppercase leading-tight text-slate-800">
                      PHÒNG ĐÀO TẠO
                    </p>
                    <div className="w-24 border-b border-black mx-auto mt-1" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold uppercase leading-tight">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-[14px] font-bold leading-tight underline decoration-solid decoration-1 underline-offset-4">
                      Độc lập – Tự do – Hạnh phúc
                    </p>
                    <p className="text-[12px] italic mt-2 text-right pr-4">
                      Hà Nội, ngày 28 tháng 10 năm 2024
                    </p>
                  </div>
                </div>

                <div className="text-center pt-2 pb-1 space-y-1">
                  <h1 className="text-[17px] font-bold uppercase text-black tracking-wide">
                    DANH SÁCH KẾT QUẢ MÔN HỌC
                  </h1>
                  <p className="text-[13px] italic text-slate-700">
                    Học kỳ I – Năm học 2024 - 2025
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[12px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><b>Môn:</b> {selectedSubject.name}</div>
                  <div><b>Mã:</b> {selectedSubject.code}</div>
                  <div><b>Khoa:</b> {user?.department || 'Khoa Tiếng Anh'}</div>
                  <div><b>Lớp:</b> {className}</div>
                </div>

                <table className="w-full text-left text-[12px] border-collapse border border-black my-2">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-black text-center">
                      <th className="p-2 border-r border-black w-8">STT</th>
                      <th className="p-2 border-r border-black w-24">MÃ SỐ SV</th>
                      <th className="p-2 border-r border-black">HỌ VÀ TÊN</th>
                      <th className="p-2 border-r border-black w-20">NGÀY SINH</th>
                      <th className="p-2 border-r border-black w-14">LỚP</th>
                      <th className="p-2 border-r border-black w-16 text-center">TP1 (10%)</th>
                      <th className="p-2 border-r border-black w-16 text-center">TP2 (30%)</th>
                      <th className="p-2 border-r border-black w-20 text-center">ĐIỂM HP</th>
                      <th className="p-2 border-black w-20 text-center">GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => {
                      const tp1 = Number((8.5 + ((idx * 3) % 20) * 0.1).toFixed(1));
                      const tp2 = Number((8.0 + ((idx * 7) % 25) * 0.1).toFixed(1));
                      const finalScore = Number((tp1 * 0.1 + tp2 * 0.3 + (8.5 + ((idx * 5) % 15) * 0.1) * 0.6).toFixed(1));
                      const note = finalScore >= 9.0 ? 'Xuất sắc' : finalScore >= 8.0 ? 'Giỏi' : 'Khá';
                      return (
                        <tr key={s.mssv} className="border-b border-black/60">
                          <td className="p-1.5 border-r border-black text-center">{idx + 1}</td>
                          <td className="p-1.5 border-r border-black text-center font-mono">{s.mssv}</td>
                          <td className="p-1.5 border-r border-black font-semibold">{s.fullName}</td>
                          <td className="p-1.5 border-r border-black text-center font-mono">{s.birthDate}</td>
                          <td className="p-1.5 border-r border-black text-center">{className}</td>
                          <td className="p-1.5 border-r border-black text-center">{tp1}</td>
                          <td className="p-1.5 border-r border-black text-center">{tp2}</td>
                          <td className="p-1.5 border-r border-black text-center font-bold text-[#003B71]">{finalScore}</td>
                          <td className="p-1.5 border-black text-center italic text-slate-600">{note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <p className="text-[12px] font-bold italic pt-1">
                  * Danh sách kết quả này có: {students.length} sinh viên.
                </p>

                <div className="pt-6 grid grid-cols-4 text-center text-[11px] avoid-break">
                  <div>
                    <p className="font-bold">NGƯỜI VÀO ĐIỂM</p>
                    <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
                    <div className="h-14 flex items-center justify-center font-bold">{user?.fullName || 'Nguyễn Hoàng Anh'}</div>
                    <p className="font-bold">{user?.fullName || 'Nguyễn Hoàng Anh'}</p>
                  </div>
                  <div>
                    <p className="font-bold">NGƯỜI KIỂM TRA</p>
                    <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
                    <div className="h-14 flex items-center justify-center font-bold">ThS. Lê Thị Thu Hà</div>
                    <p className="font-bold">ThS. Lê Thị Thu Hà</p>
                  </div>
                  <div>
                    <p className="font-bold">TRƯỞNG BỘ MÔN</p>
                    <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
                    <div className="h-14 flex items-center justify-center font-bold">TS. Vũ Đình Hải</div>
                    <p className="font-bold">TS. Vũ Đình Hải</p>
                  </div>
                  <div>
                    <p className="font-bold">TRƯỞNG KHOA</p>
                    <p className="italic text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
                    <div className="h-14 flex items-center justify-center font-bold">PGS.TS. Trần Thị Hạnh</div>
                    <p className="font-bold">PGS.TS. Trần Thị Hạnh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for Roster PDF Export */}
      <div className="hidden">
        <div
          id="ulis-roster-export-container"
          className="bg-white p-10 vn-admin-document max-w-4xl mx-auto space-y-4"
        >
          <div className="grid grid-cols-2 gap-4 text-center items-start border-b border-black/10 pb-4">
            <div>
              <p className="text-[13px] font-bold uppercase leading-tight">TRƯỜNG ĐẠI HỌC NGOẠI NGỮ</p>
              <p className="text-[12px] font-bold uppercase leading-tight text-slate-800">PHÒNG CHÍNH TRỊ VÀ CÔNG TÁC HSSV</p>
              <div className="w-24 border-b border-black mx-auto mt-1" />
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase leading-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-[14px] font-bold leading-tight underline decoration-solid decoration-1 underline-offset-4">Độc lập – Tự do – Hạnh phúc</p>
              <p className="text-[12px] italic mt-2 text-right pr-4">Hà Nội, ngày 28 tháng 10 năm 2024</p>
            </div>
          </div>

          <div className="text-center pt-2 pb-1 space-y-1">
            <h1 className="text-[18px] font-bold uppercase text-black tracking-wide">DANH SÁCH LỚP SINH VIÊN</h1>
            <p className="text-[13px] italic text-slate-700">Học kỳ I – Năm học 2024 - 2025</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[13px] flex items-center justify-between">
            <div><span className="font-bold">Lớp: </span><span className="font-semibold">{className}</span></div>
            <div><span className="font-bold">Khoa: </span><span>{user?.department || 'Khoa Ngôn ngữ & VH các nước nói Tiếng Anh'}</span></div>
            <div><span className="font-bold">Sĩ số: </span><span className="font-bold text-[#003B71]">{students.length} sinh viên</span></div>
          </div>

          <table className="w-full text-left text-[12px] border-collapse border border-black my-2">
            <thead>
              <tr className="bg-slate-50 font-bold border-b border-black text-center">
                <th className="p-2 border-r border-black w-8">STT</th>
                <th className="p-2 border-r border-black w-24">MÃ SỐ SV</th>
                <th className="p-2 border-r border-black">HỌ VÀ TÊN</th>
                <th className="p-2 border-r border-black w-20">NGÀY SINH</th>
                <th className="p-2 border-r border-black w-14">GIỚI TÍNH</th>
                <th className="p-2 border-r border-black w-24">SỐ ĐIỆN THOẠI</th>
                <th className="p-2 border-black w-28 text-center">CHỨC VỤ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.mssv} className="border-b border-black/60">
                  <td className="p-1.5 border-r border-black text-center">{idx + 1}</td>
                  <td className="p-1.5 border-r border-black text-center font-mono">{s.mssv}</td>
                  <td className="p-1.5 border-r border-black font-semibold text-black">{s.fullName}</td>
                  <td className="p-1.5 border-r border-black text-center font-mono">{s.birthDate}</td>
                  <td className="p-1.5 border-r border-black text-center">{s.gender}</td>
                  <td className="p-1.5 border-r border-black text-center font-mono">{s.phone}</td>
                  <td className="p-1.5 border-black text-center font-medium">{s.role}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-[13px] font-bold italic pt-1">* Danh sách này có: {students.length} sinh viên.</p>

          <div className="pt-8 grid grid-cols-3 text-center text-[13px] avoid-break">
            <div>
              <p className="font-bold uppercase">NGƯỜI LẬP DANH SÁCH</p>
              <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-center justify-center font-bold">{user?.fullName || 'Nguyễn Hoàng Anh'}</div>
              <p className="font-bold">{user?.fullName || 'Nguyễn Hoàng Anh'}</p>
            </div>
            <div>
              <p className="font-bold uppercase">LỚP TRƯỞNG</p>
              <p className="italic text-[11px] text-slate-600">(Ký xác nhận)</p>
              <div className="h-16 flex items-center justify-center">
                {savedSignature ? (
                  <img src={savedSignature} alt="Chữ ký Lớp trưởng" className="max-h-14 max-w-[130px] object-contain drop-shadow-none" style={{ background: 'transparent' }} />
                ) : (
                  <span className="font-bold">{user?.fullName || 'Nguyễn Hoàng Anh'}</span>
                )}
              </div>
              <p className="font-bold">{user?.fullName || 'Nguyễn Hoàng Anh'}</p>
            </div>
            <div>
              <p className="font-bold uppercase">CỐ VẤN HỌC TẬP</p>
              <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-center justify-center font-bold">ThS. Nguyễn Huyền Trang</div>
              <p className="font-bold">ThS. Nguyễn Huyền Trang</p>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Export Options Modal */}
      {exportModalConfig && (
        <ExportOptionsModal
          isOpen={exportModalConfig.isOpen}
          onClose={() => setExportModalConfig(null)}
          documentTitle={exportModalConfig.title}
          documentSubtitle={exportModalConfig.subtitle}
          onExportPdf={async () => {
            const el = document.getElementById(exportModalConfig.elementId);
            if (el) {
              await exportElementToPdf(el, exportModalConfig.title.replace(/\s+/g, '_'));
            }
          }}
          onExportDocx={async () => {
            await exportModalConfig.onExportDocx();
          }}
          onExportXlsx={
            exportModalConfig.onExportXlsx
              ? async () => {
                  await exportModalConfig.onExportXlsx!();
                }
              : undefined
          }
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
};
