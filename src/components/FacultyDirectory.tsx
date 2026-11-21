import React, { useState } from 'react';
import { Lecturer } from '../types';
import { copyToClipboard } from '../utils/helpers';
import {
  Users,
  Search,
  Copy,
  Check,
  Phone,
  Mail,
  Building,
  BookOpen,
  Plus,
  Share2,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface FacultyDirectoryProps {
  lecturers: Lecturer[];
  onAddLecturer: (lec: Lecturer) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FacultyDirectory: React.FC<FacultyDirectoryProps> = ({
  lecturers,
  onAddLecturer,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lecturer form
  const [newLecturer, setNewLecturer] = useState<Partial<Lecturer>>({
    title: 'ThS.',
    name: '',
    email: '',
    phone: '',
    zalo: '',
    department: 'Khoa Ngôn ngữ & Văn hóa Đức',
    subjects: [''],
    room: ''
  });

  const departments = ['All', ...Array.from(new Set(lecturers.map((l) => l.department)))];

  const filteredLecturers = lecturers.filter((lec) => {
    const matchesDept = selectedDept === 'All' || lec.department === selectedDept;
    const matchesSearch =
      lec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.phone.includes(searchTerm) ||
      lec.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const handleCopy = async (text: string, label: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      onShowToast('Đã copy vào bộ nhớ tạm!', `${label}: ${text}`, 'success');
      setTimeout(() => {
        setCopiedKey(null);
      }, 1800);
    } else {
      onShowToast('Lỗi khi sao chép', 'Vui lòng sao chép thủ công', 'error');
    }
  };

  const handleShareCard = async (lec: Lecturer) => {
    const text = `📌 THÔNG TIN LIÊN HỆ GIẢNG VIÊN ULIS:\n• Họ tên: ${lec.title} ${lec.name}\n• Đơn vị: ${lec.department}\n• Môn phụ trách: ${lec.subjects.join(', ')}\n• Email: ${lec.email}\n• Số điện thoại/Zalo: ${lec.phone}\n• Văn phòng: ${lec.room || 'Văn phòng Khoa'}`;
    await handleCopy(text, 'Danh thiếp Zalo', `share-${lec.id}`);
  };

  const handleCreateLecturer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLecturer.name || !newLecturer.email || !newLecturer.phone) {
      onShowToast('Thiếu thông tin', 'Vui lòng điền họ tên, email và số điện thoại', 'warning');
      return;
    }

    const created: Lecturer = {
      id: `lec-${Date.now()}`,
      name: newLecturer.name || '',
      title: newLecturer.title || 'ThS.',
      email: newLecturer.email || '',
      phone: newLecturer.phone || '',
      zalo: newLecturer.phone || '',
      department: newLecturer.department || 'Khoa Ngôn ngữ & Văn hóa Đức',
      subjects: typeof newLecturer.subjects === 'string'
        ? (newLecturer.subjects as string).split(',').map((s) => s.trim())
        : (newLecturer.subjects as string[]) || ['Môn học chung'],
      room: newLecturer.room || 'Văn phòng bộ môn'
    };

    onAddLecturer(created);
    setIsAddModalOpen(false);
    onShowToast('Thành công', `Đã thêm giảng viên ${created.name} vào danh bạ`, 'success');
    setNewLecturer({
      title: 'ThS.',
      name: '',
      email: '',
      phone: '',
      zalo: '',
      department: 'Khoa Ngôn ngữ & Văn hóa Đức',
      subjects: [''],
      room: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Action bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#003B71]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Danh Bạ & Liên Hệ Giảng Viên ULIS
              </h2>
              <p className="text-xs text-slate-500">
                Tra cứu nhanh email, số điện thoại, Zalo giảng viên phụ trách môn học và chia sẻ 1-click vào nhóm lớp
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Giảng Viên Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên giảng viên, email, số điện thoại, môn học..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'Tất cả Khoa / Bộ môn' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLecturers.map((lec) => {
          const emailKey = `email-${lec.id}`;
          const phoneKey = `phone-${lec.id}`;
          const shareKey = `share-${lec.id}`;

          return (
            <div
              key={lec.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-blue-300"
            >
              <div>
                {/* Title & Name */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {lec.department}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                      <span>{lec.name}</span>
                    </h3>
                  </div>

                  <button
                    onClick={() => handleShareCard(lec)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600 transition-colors"
                    title="Copy toàn bộ thông tin để dán vào Zalo nhóm lớp"
                  >
                    {copiedKey === shareKey ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Subjects tags */}
                <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-600">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {lec.subjects.map((sub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Office / Room */}
                {lec.room && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lec.room}</span>
                  </div>
                )}
              </div>

              {/* Contact Actions with 1-Click Copy */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                {/* Email row */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <a
                      href={`mailto:${lec.email}`}
                      className="truncate text-slate-700 hover:text-blue-600 font-medium"
                    >
                      {lec.email}
                    </a>
                  </div>
                  <button
                    onClick={() => handleCopy(lec.email, 'Email', emailKey)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                    title="1-Click Copy Email"
                  >
                    {copiedKey === emailKey ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <Check className="w-3 h-3" /> Đã copy
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Phone & Zalo row */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{lec.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://zalo.me/${lec.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 flex items-center gap-1"
                      title="Mở Zalo nhắn tin ngay"
                    >
                      <span>Zalo</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <button
                      onClick={() => handleCopy(lec.phone, 'Số điện thoại/Zalo', phoneKey)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                      title="1-Click Copy SĐT"
                    >
                      {copiedKey === phoneKey ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                          <Check className="w-3 h-3" /> Đã copy
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLecturers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Không tìm thấy giảng viên</h3>
          <p className="text-xs text-slate-400 mt-1">
            Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc bộ môn
          </p>
        </div>
      )}

      {/* Modal Add New Lecturer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Giảng Viên / Cố Vấn Mới</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLecturer} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên giảng viên <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={newLecturer.title}
                    onChange={(e) => setNewLecturer({ ...newLecturer, title: e.target.value })}
                    className="w-24 px-2 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="ThS.">ThS.</option>
                    <option value="TS.">TS.</option>
                    <option value="PGS.TS.">PGS.TS.</option>
                    <option value="GS.TS.">GS.TS.</option>
                    <option value="Thầy/Cô">Thầy/Cô</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={newLecturer.name}
                    onChange={(e) => setNewLecturer({ ...newLecturer, name: e.target.value })}
                    placeholder="VD: Lê Thị Ánh Nguyệt"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khoa / Tổ Bộ Môn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLecturer.department}
                  onChange={(e) => setNewLecturer({ ...newLecturer, department: e.target.value })}
                  placeholder="VD: Khoa Ngôn ngữ & Văn hóa Đức"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email VNU (@vnu.edu.vn) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newLecturer.email}
                  onChange={(e) => setNewLecturer({ ...newLecturer, email: e.target.value })}
                  placeholder="nguyetla_ulis@vnu.edu.vn"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại / Zalo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLecturer.phone}
                  onChange={(e) => setNewLecturer({ ...newLecturer, phone: e.target.value })}
                  placeholder="0912.345.678"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Môn học phụ trách (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={Array.isArray(newLecturer.subjects) ? newLecturer.subjects.join(', ') : ''}
                  onChange={(e) =>
                    setNewLecturer({
                      ...newLecturer,
                      subjects: e.target.value.split(',').map((s) => s.trim())
                    })
                  }
                  placeholder="VD: Tiếng Đức B2.1, Ngữ pháp tiếng Đức thực hành"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Văn phòng làm việc
                </label>
                <input
                  type="text"
                  value={newLecturer.room}
                  onChange={(e) => setNewLecturer({ ...newLecturer, room: e.target.value })}
                  placeholder="VD: Phòng 302, Nhà A4 - ULIS"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
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
                  Lưu Giảng Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
