import React, { useState } from 'react';
import { Student, SubjectAttendance, AttendanceStatus } from '../types';
import { exportAttendanceToExcel } from '../utils/helpers';
import {
  CalendarCheck,
  Download,
  AlertTriangle,
  CheckCircle,
  Plus,
  BookOpen,
  Filter,
  Printer,
  Sparkles,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';

interface AttendanceTrackerProps {
  students: Student[];
  subjects: SubjectAttendance[];
  onUpdateSubject: (subject: SubjectAttendance) => void;
  onAddSubject: (subject: SubjectAttendance) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  students,
  subjects,
  onUpdateSubject,
  onAddSubject,
  onShowToast
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || 'sub-1'
  );
  const [currentWeek, setCurrentWeek] = useState<number>(7);
  const [weeksCount, setWeeksCount] = useState<number>(15); // 15, 12, 10
  const [filterBannedOnly, setFilterBannedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // New Subject form
  const [newSub, setNewSub] = useState({
    name: '',
    code: '',
    lecturerName: '',
    totalWeeks: 15
  });

  const currentSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Helper to toggle status
  const handleToggleStatus = (studentMssv: string, week: number) => {
    const records = { ...(currentSubject.records || {}) };
    const studentRecords = { ...(records[studentMssv] || {}) };
    const current = studentRecords[week] || 'P';

    const nextStatus: Record<AttendanceStatus, AttendanceStatus> = {
      P: 'A', // Có mặt -> Vắng có phép
      A: 'U', // Vắng có phép -> Vắng không phép
      U: 'L', // Vắng không phép -> Đi muộn
      L: 'P'  // Đi muộn -> Có mặt
    };

    studentRecords[week] = nextStatus[current];
    records[studentMssv] = studentRecords;

    onUpdateSubject({
      ...currentSubject,
      records
    });
  };

  // Quick action: mark all present for current week
  const handleMarkAllPresentForWeek = (week: number) => {
    const records = { ...(currentSubject.records || {}) };
    students.forEach((st) => {
      if (!records[st.mssv]) records[st.mssv] = {};
      records[st.mssv][week] = 'P';
    });

    onUpdateSubject({
      ...currentSubject,
      records
    });
    onShowToast(
      'Điểm danh thành công',
      `Đã đánh dấu tất cả ${students.length} sinh viên Có mặt (P) ở Tuần ${week}`,
      'success'
    );
  };

  // Metrics calculation per student
  const calculateStudentMetrics = (mssv: string) => {
    const studentRecords = currentSubject.records?.[mssv] || {};
    let present = 0;
    let absentExcused = 0; // A
    let absentUnexcused = 0; // U
    let late = 0; // L

    for (let w = 1; w <= weeksCount; w++) {
      const status = studentRecords[w];
      if (status === 'P') present++;
      else if (status === 'A') absentExcused++;
      else if (status === 'U') absentUnexcused++;
      else if (status === 'L') late++;
    }

    // Absence formula: U = 1, A = 0.5, L = 0.33
    const totalAbsentEquivalent = absentUnexcused + absentExcused * 0.5 + late * 0.33;
    const absencePercentage = Math.round((totalAbsentEquivalent / weeksCount) * 100);
    const isBanned = absencePercentage > 20;

    return {
      present,
      absentExcused,
      absentUnexcused,
      late,
      totalAbsentEquivalent: Number(totalAbsentEquivalent.toFixed(1)),
      absencePercentage,
      isBanned
    };
  };

  const studentsWithMetrics = students.map((s) => ({
    student: s,
    metrics: calculateStudentMetrics(s.mssv)
  }));

  const bannedCount = studentsWithMetrics.filter((item) => item.metrics.isBanned).length;

  const filteredStudents = studentsWithMetrics.filter((item) => {
    if (filterBannedOnly && !item.metrics.isBanned) return false;
    const s = item.student;
    return (
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mssv.includes(searchTerm)
    );
  });

  const handleExportExcel = () => {
    exportAttendanceToExcel(currentSubject, students, weeksCount);
    onShowToast('Xuất Excel thành công', 'File điểm danh đầy đủ đã được tải xuống', 'success');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.name || !newSub.code) {
      onShowToast('Thiếu thông tin', 'Vui lòng nhập tên học phần và mã học phần', 'warning');
      return;
    }
    const created: SubjectAttendance = {
      id: `sub-${Date.now()}`,
      name: newSub.name,
      code: newSub.code,
      lecturerName: newSub.lecturerName || 'Giảng viên bộ môn',
      totalWeeks: Number(newSub.totalWeeks) || 15,
      records: {}
    };
    onAddSubject(created);
    setSelectedSubjectId(created.id);
    setIsAddSubjectModalOpen(false);
    onShowToast('Thành công', `Đã thêm học phần ${created.name}`, 'success');
    setNewSub({ name: '', code: '', lecturerName: '', totalWeeks: 15 });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Subject Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#003B71]">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Sổ Điểm Danh Học Phần (Quy Chế ĐHQGHN)
              </h2>
              {bannedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {bannedCount} SV vắng &gt;20%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Tự động tính tỷ lệ chuyên cần & phát cảnh báo cấm thi theo Quy chế đào tạo Đại học của ĐHQGHN
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Selector */}
          <div className="relative">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-blue-300 bg-blue-50/50 text-[#003B71] rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="p-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
            title="Thêm học phần mới"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Export & Print */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Bảng Điểm Danh</span>
          </button>
        </div>
      </div>

      {/* Week Selector & Quick Fill Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Semester Weeks Configuration */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Tổng số tuần:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {[10, 12, 15].map((w) => (
              <button
                key={w}
                onClick={() => setWeeksCount(w)}
                className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all ${
                  weeksCount === w
                    ? 'bg-[#003B71] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {w} tuần
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Quick filter banned */}
          <button
            onClick={() => setFilterBannedOnly(!filterBannedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              filterBannedOnly
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Chỉ xem SV bị cảnh báo cấm thi ({bannedCount})</span>
          </button>
        </div>

        {/* Quick fill for current week */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Thao tác tuần:</span>
          <select
            value={currentWeek}
            onChange={(e) => setCurrentWeek(Number(e.target.value))}
            className="px-2 py-1 text-xs font-bold border border-slate-300 rounded-lg outline-none"
          >
            {Array.from({ length: weeksCount }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Tuần {w}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleMarkAllPresentForWeek(currentWeek)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#003B71] text-xs font-bold rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Tất cả có mặt (Tuần {currentWeek})</span>
          </button>
        </div>
      </div>

      {/* Legend Guide */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 no-print">
        <span className="font-bold text-slate-700">Ký hiệu (Click vào ô để đổi):</span>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded font-bold text-xs bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
            P
          </span>
          <span>Có mặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded font-bold text-xs bg-sky-100 text-sky-800 flex items-center justify-center border border-sky-300">
            A
          </span>
          <span>Vắng có phép (0.5 buổi)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded font-bold text-xs bg-rose-100 text-rose-800 flex items-center justify-center border border-rose-300">
            U
          </span>
          <span>Vắng không phép (1.0 buổi)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded font-bold text-xs bg-purple-100 text-purple-800 flex items-center justify-center border border-purple-300">
            L
          </span>
          <span>Đi muộn (0.33 buổi)</span>
        </div>
        <div className="ml-auto text-slate-500 italic text-[11px]">
          * Tỷ lệ vắng quy đổi &gt; 20% tổng số giờ sẽ không đủ điều kiện dự thi
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#003B71] text-white font-bold text-center">
              <tr>
                <th className="py-3 px-2 w-10 border-r border-blue-800">STT</th>
                <th className="py-3 px-3 text-left w-24 border-r border-blue-800">MSSV</th>
                <th className="py-3 px-4 text-left w-44 border-r border-blue-800">Họ và Tên</th>

                {/* Weeks headers */}
                {Array.from({ length: weeksCount }, (_, i) => i + 1).map((w) => (
                  <th
                    key={w}
                    className={`py-2 px-1 w-10 border-r border-blue-800 cursor-pointer ${
                      w === currentWeek ? 'bg-sky-500 text-white font-black' : ''
                    }`}
                    title={`Tuần ${w} - Click để chọn tuần thao tác`}
                    onClick={() => setCurrentWeek(w)}
                  >
                    T{w}
                  </th>
                ))}

                <th className="py-3 px-2 w-16 border-r border-blue-800 bg-blue-900">Vắng QĐ</th>
                <th className="py-3 px-2 w-16 border-r border-blue-800 bg-blue-900">Tỷ Lệ</th>
                <th className="py-3 px-3 w-32 bg-blue-950">Điều Kiện Thi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(({ student: st, metrics }) => {
                const records = currentSubject.records?.[st.mssv] || {};

                return (
                  <tr
                    key={st.mssv}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      metrics.isBanned ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-2 text-center font-medium text-slate-400 border-r border-slate-100">
                      {st.stt}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-900 border-r border-slate-100">
                      {st.mssv}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-100 truncate">
                      {st.fullName}
                    </td>

                    {/* Week status cells */}
                    {Array.from({ length: weeksCount }, (_, i) => i + 1).map((w) => {
                      const status = (records[w] as AttendanceStatus) || 'P';
                      const styles: Record<AttendanceStatus, string> = {
                        P: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200',
                        A: 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300 font-bold',
                        U: 'bg-rose-100 text-rose-900 hover:bg-rose-200 border-rose-300 font-bold ring-1 ring-rose-400',
                        L: 'bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-300 font-bold'
                      };

                      return (
                        <td
                          key={w}
                          className={`p-1 text-center border-r border-slate-100 ${
                            w === currentWeek ? 'bg-blue-50/60 font-semibold' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(st.mssv, w)}
                            className={`w-7 h-7 rounded text-[11px] font-bold border transition-transform active:scale-95 flex items-center justify-center mx-auto ${styles[status]}`}
                            title={`Tuần ${w}: ${
                              status === 'P'
                                ? 'Có mặt'
                                : status === 'A'
                                ? 'Vắng có phép'
                                : status === 'U'
                                ? 'Vắng không phép'
                                : 'Đi muộn'
                            }. Click để đổi.`}
                          >
                            {status}
                          </button>
                        </td>
                      );
                    })}

                    {/* Total Absent Equivalent */}
                    <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-100 bg-slate-50/60">
                      {metrics.totalAbsentEquivalent}
                    </td>

                    {/* Absence Rate % */}
                    <td
                      className={`py-2 px-2 text-center font-bold border-r border-slate-100 ${
                        metrics.isBanned
                          ? 'text-rose-700 bg-rose-50 font-black'
                          : 'text-slate-700 bg-slate-50/60'
                      }`}
                    >
                      {metrics.absencePercentage}%
                    </td>

                    {/* Final Status Badge */}
                    <td className="py-2 px-3 text-center">
                      {metrics.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          CẤM THI (&gt;20%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Đủ điều kiện
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Subject */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Môn Học / Học Phần Mới</h3>
              <button
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã học phần <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSub.code}
                  onChange={(e) => setNewSub({ ...newSub, code: e.target.value.toUpperCase() })}
                  placeholder="VD: GER2050"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên học phần <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                  placeholder="VD: Kỹ năng Viết tiếng Đức B2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giảng viên phụ trách
                </label>
                <input
                  type="text"
                  value={newSub.lecturerName}
                  onChange={(e) => setNewSub({ ...newSub, lecturerName: e.target.value })}
                  placeholder="VD: ThS. Trần Đức Minh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tuần học
                </label>
                <select
                  value={newSub.totalWeeks}
                  onChange={(e) => setNewSub({ ...newSub, totalWeeks: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                >
                  <option value={15}>15 tuần (Học kỳ chính)</option>
                  <option value={12}>12 tuần</option>
                  <option value={10}>10 tuần (Học phần rút gọn)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003B71] text-white rounded-lg font-bold hover:bg-blue-800"
                >
                  Lưu Học Phần
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
