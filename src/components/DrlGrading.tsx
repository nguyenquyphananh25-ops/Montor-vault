import React, { useState, useRef } from 'react';
import { StudentDRL, UserProfile } from '../types';
import { DRL_RUBRIC_INFO } from '../data/mockData';
import { exportDRLMasterToExcel } from '../utils/helpers';
import {
  exportElementToPdf,
  exportDrlStudentDocx,
  exportDrlStudentXlsx
} from '../utils/documentExportEngine';
import { ExportOptionsModal } from './ExportOptionsModal';
import {
  Award,
  Download,
  FolderOpen,
  Cloud,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PenTool,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCheck,
  AlertCircle,
  FileText
} from 'lucide-react';

interface DrlGradingProps {
  user: UserProfile;
  drlList: StudentDRL[];
  savedSignature: string | null;
  onUpdateDrlList: (list: StudentDRL[]) => void;
  onOpenSignatureStudio: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DrlGrading: React.FC<DrlGradingProps> = ({
  user,
  drlList,
  savedSignature,
  onUpdateDrlList,
  onOpenSignatureStudio,
  onShowToast
}) => {
  const [driveUrl, setDriveUrl] = useState(
    'https://drive.google.com/drive/folders/1ulis_23g3_drl_hocky1_2024'
  );
  const [isDriveScanning, setIsDriveScanning] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewModalStudent, setPreviewModalStudent] = useState<StudentDRL | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const printableDrlRef = useRef<HTMLDivElement>(null);

  const currentStudent = drlList[currentStudentIndex] || drlList[0];

  // Helper score calculator
  const calculateTotal = (scores: { c1: number; c2: number; c3: number; c4: number; c5: number }) => {
    return scores.c1 + scores.c2 + scores.c3 + scores.c4 + scores.c5;
  };

  const getRank = (total: number) => {
    if (total >= 90) return { label: 'Xuất sắc', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (total >= 80) return { label: 'Tốt', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (total >= 65) return { label: 'Khá', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' };
    if (total >= 50) return { label: 'Trung bình', color: 'text-slate-700 bg-slate-100 border-slate-300' };
    return { label: 'Yếu', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  };

  const selfTotal = calculateTotal(currentStudent.selfScores);
  const monitorTotal = calculateTotal(currentStudent.monitorScores);
  const monitorRank = getRank(monitorTotal);

  // Update current student score
  const handleScoreChange = (key: 'c1' | 'c2' | 'c3' | 'c4' | 'c5', value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    const updated = drlList.map((item, idx) => {
      if (idx === currentStudentIndex) {
        return {
          ...item,
          monitorScores: {
            ...item.monitorScores,
            [key]: clamped
          }
        };
      }
      return item;
    });
    onUpdateDrlList(updated);
  };

  // Quick match self scores for current student
  const handleMatchSelfScores = () => {
    const updated = drlList.map((item, idx) => {
      if (idx === currentStudentIndex) {
        return {
          ...item,
          monitorScores: { ...item.selfScores }
        };
      }
      return item;
    });
    onUpdateDrlList(updated);
    onShowToast('Đã đồng bộ', `Điểm đánh giá khớp 100% với điểm tự chấm của ${currentStudent.studentName}`, 'success');
  };

  // Apply match to all students
  const handleMatchAllStudents = () => {
    const updated = drlList.map((item) => ({
      ...item,
      monitorScores: { ...item.selfScores }
    }));
    onUpdateDrlList(updated);
    onShowToast('Đồng bộ cả lớp thành công', `Đã áp dụng mức điểm tự chấm cho toàn bộ ${drlList.length} sinh viên`, 'success');
  };

  // Batch Sign All Students with Monitor's saved digital signature
  const handleBatchSignAll = () => {
    if (!savedSignature) {
      onShowToast('Chưa có chữ ký', 'Vui lòng vào Studio Chữ Ký Số để tạo chữ ký trước', 'warning');
      onOpenSignatureStudio();
      return;
    }
    const updated = drlList.map((item) => ({
      ...item,
      isSigned: true
    }));
    onUpdateDrlList(updated);
    onShowToast(
      'Ký duyệt hàng loạt thành công!',
      `Đã đóng dấu chữ ký số điện tử của Lớp trưởng lên toàn bộ ${drlList.length} phiếu ĐRL`,
      'success'
    );
  };

  // Drive Simulator Scan
  const handleScanDriveFolder = () => {
    setIsDriveScanning(true);
    setTimeout(() => {
      setIsDriveScanning(false);
      onShowToast(
        'Quét Google Drive thành công!',
        `Đã đọc ${drlList.length} file docx/pdf tự chấm từ thư mục Google Drive của lớp ${user.className}`,
        'success'
      );
    }, 1200);
  };

  // Export Master Excel
  const handleExportMasterExcel = () => {
    exportDRLMasterToExcel(drlList, user.className);
    onShowToast('Xuất Excel thành công', `Đã xuất bảng tổng hợp ĐRL lớp ${user.className}`, 'success');
  };

  const filteredStudents = drlList.filter((d) =>
    d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.studentMssv.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#003B71]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Hệ Thống Chấm Điểm Rèn Luyện (ĐRL) Tự Động ULIS
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Khung chuẩn 100 điểm
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Đọc hàng loạt file tự chấm từ Google Drive, đối chiếu tiêu chí và ký duyệt số 1-click cho cả lớp
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Sign Button */}
          <button
            onClick={handleBatchSignAll}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all"
            title="Đóng dấu chữ ký số điện tử của Lớp trưởng lên tất cả các phiếu"
          >
            <CheckCheck className="w-4 h-4 text-emerald-200" />
            <span>Ký Duyệt Hàng Loạt ({drlList.filter((d) => d.isSigned).length}/{drlList.length})</span>
          </button>

          {/* Export Master Excel */}
          <button
            onClick={handleExportMasterExcel}
            className="px-3.5 py-2 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Bảng Tổng Hợp (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Google Drive Link Importer Simulator */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-4 rounded-2xl border border-blue-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Google Drive Reader Simulator:
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                Đọc thư mục chứa bài nộp ĐRL của sinh viên
              </span>
            </div>
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 text-xs font-mono bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-blue-900"
            />
          </div>
        </div>

        <button
          onClick={handleScanDriveFolder}
          disabled={isDriveScanning}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-colors"
        >
          {isDriveScanning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang đọc Drive...</span>
            </>
          ) : (
            <>
              <FolderOpen className="w-4 h-4" />
              <span>Quét Thư Mục Google Drive Của Lớp</span>
            </>
          )}
        </button>
      </div>

      {/* Main Batch Grading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Roster List with Quick Select (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 no-print">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Danh Sách Chấm Điểm ({drlList.length} SV)
            </span>
            <button
              onClick={handleMatchAllStudents}
              className="text-[11px] text-blue-600 hover:underline font-bold"
            >
              Đồng ý tất cả SV
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc MSSV..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredStudents.map((d, index) => {
              const realIndex = drlList.findIndex((item) => item.studentMssv === d.studentMssv);
              const isSelected = realIndex === currentStudentIndex;
              const total = calculateTotal(d.monitorScores);
              const rank = getRank(total);

              return (
                <div
                  key={d.studentMssv}
                  onClick={() => setCurrentStudentIndex(realIndex)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 truncate">
                        {d.studentName}
                      </span>
                      {d.isSigned && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      MSSV: {d.studentMssv}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900">{total}đ</span>
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${rank.color}`}>
                        {rank.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Rubric Review Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          {/* Student Profile & Navigation bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Sinh viên {currentStudentIndex + 1} / {drlList.length}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                <span>{currentStudent.studentName}</span>
                <span className="text-xs font-mono font-medium text-slate-400">
                  ({currentStudent.studentMssv})
                </span>
                {currentStudent.isSigned ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã ký số
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    Chờ ký duyệt
                  </span>
                )}
              </h3>
            </div>

            {/* Previous / Next buttons */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentStudentIndex === 0}
                onClick={() => setCurrentStudentIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Học sinh trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentStudentIndex === drlList.length - 1}
                onClick={() => setCurrentStudentIndex((prev) => Math.min(drlList.length - 1, prev + 1))}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Học sinh tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPreviewModalStudent(currentStudent)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xem Phiếu In</span>
              </button>
            </div>
          </div>

          {/* Quick Match Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400">SV Tự Chấm:</span>{' '}
                <b className="text-slate-700">{selfTotal}/100đ</b>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400">Lớp Trưởng Đánh Giá:</span>{' '}
                <b className="text-[#003B71] text-sm">{monitorTotal}/100đ</b>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <span className={`px-2 py-0.5 rounded font-bold border ${monitorRank.color}`}>
                Xếp loại: {monitorRank.label}
              </span>
            </div>

            <button
              onClick={handleMatchSelfScores}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
            >
              <Sparkles className="w-3 h-3 text-sky-600" />
              <span>Khớp với điểm SV tự chấm</span>
            </button>
          </div>

          {/* 5 Criteria Review List */}
          <div className="space-y-3">
            {DRL_RUBRIC_INFO.map((item) => {
              const selfScore = currentStudent.selfScores[item.key];
              const monitorScore = currentStudent.monitorScores[item.key];

              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Tối đa {item.max}đ)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">SV tự chấm</span>
                      <span className="text-xs font-bold text-slate-600">{selfScore}đ</span>
                    </div>

                    <div className="flex items-center gap-1 bg-blue-50/70 p-1.5 rounded-lg border border-blue-200">
                      <span className="text-xs font-semibold text-blue-900">LT:</span>
                      <input
                        type="number"
                        min={0}
                        max={item.max}
                        value={monitorScore}
                        onChange={(e) =>
                          handleScoreChange(item.key, Number(e.target.value), item.max)
                        }
                        className="w-14 py-1 text-center font-bold text-sm bg-white border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-500 text-[#003B71]"
                      />
                      <span className="text-xs text-blue-800">/{item.max}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Note & Digital Signature status */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Ghi chú: <span className="italic">{currentStudent.notes}</span>
            </div>

            <div className="flex items-center gap-3">
              {currentStudent.isSigned ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã Đóng Dấu Chữ Ký Số Của Lớp Trưởng</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewModalStudent(currentStudent)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#003B71] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-blue-200 transition-colors"
                    title="Xem trước định dạng A4 chuẩn in ấn và xuất file"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Xem & Xuất Phiếu In</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!savedSignature) {
                        onShowToast('Chưa có chữ ký', 'Vào Studio Chữ Ký Số để tạo chữ ký', 'warning');
                        onOpenSignatureStudio();
                        return;
                      }
                      const updated = drlList.map((item, idx) =>
                        idx === currentStudentIndex ? { ...item, isSigned: true } : item
                      );
                      onUpdateDrlList(updated);
                      onShowToast('Đã ký số', `Đã ký duyệt phiếu ĐRL của ${currentStudent.studentName}`, 'success');
                    }}
                    className="px-3.5 py-1.5 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <PenTool className="w-3.5 h-3.5 text-sky-300" />
                    <span>Ký Duyệt Phiếu Này</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Individual ĐRL Modal */}
      {previewModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-300" />
                <div>
                  <h3 className="font-bold text-sm">
                    Phiếu Đánh Giá Điểm Rèn Luyện Sinh Viên - ULIS
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Sinh viên: {previewModalStudent.studentName} ({previewModalStudent.studentMssv})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Mở tùy chọn xuất file PDF A4 hoặc Word DOCX"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tùy Chọn Xuất File</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu (Ctrl+P)</span>
                </button>
                <button
                  onClick={() => setPreviewModalStudent(null)}
                  className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body: Strict Vietnamese Administrative Formatting */}
            <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1 vn-admin-document bg-white print-page">
              <div ref={printableDrlRef} id="drl-printable-document" className="space-y-5 text-black">
                {/* 2-Column Administrative Header */}
                <div className="grid grid-cols-2 gap-4 text-center items-start">
                  <div>
                    <p className="text-[13px] font-normal uppercase leading-tight">
                      ĐẠI HỌC QUỐC GIA HÀ NỘI
                    </p>
                    <p className="text-[13px] font-bold uppercase leading-tight">
                      TRƯỜNG ĐẠI HỌC NGOẠI NGỮ
                    </p>
                    <p className="text-[12px] font-bold uppercase leading-tight text-slate-800">
                      {user.department.toUpperCase()}
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

                {/* Document Main Title */}
                <div className="text-center pt-2 pb-1 space-y-1">
                  <h1 className="text-[16px] sm:text-[18px] font-bold uppercase text-black tracking-wide">
                    PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN
                  </h1>
                  <p className="text-[13px] italic text-slate-800">
                    Học kỳ I – Năm học 2024 - 2025
                  </p>
                </div>

                {/* Personal Information */}
                <div className="text-[13px] leading-relaxed pt-1 space-y-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div>
                      <span>Họ và tên sinh viên: </span>
                      <b className="uppercase">{previewModalStudent.studentName}</b>
                    </div>
                    <div>
                      <span>Mã số sinh viên: </span>
                      <b>{previewModalStudent.studentMssv}</b>
                    </div>
                    <div>
                      <span>Lớp khóa học: </span>
                      <b>{user.className}</b>
                    </div>
                    <div>
                      <span>Khoa / Bộ môn: </span>
                      <b>{user.department}</b>
                    </div>
                  </div>
                </div>

                {/* Strict 4-column Rubric Table */}
                <div className="pt-2">
                  <table className="w-full text-left text-[13px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-black text-center">
                        <th className="p-2.5 border-r border-black w-auto">
                          Nội dung đánh giá 5 tiêu chí rèn luyện
                        </th>
                        <th className="p-2.5 border-r border-black w-24 text-center">
                          Điểm tối đa
                        </th>
                        <th className="p-2.5 border-r border-black w-24 text-center">
                          SV tự chấm
                        </th>
                        <th className="p-2.5 border-black w-28 text-center">
                          Lớp đánh giá
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {DRL_RUBRIC_INFO.map((item, idx) => (
                        <tr key={item.key} className="border-b border-black">
                          <td className="p-2.5 border-r border-black leading-snug">
                            <b>Tiêu chí {idx + 1}: </b>
                            <span>{item.title}</span>
                          </td>
                          <td className="p-2.5 border-r border-black text-center font-bold">
                            {item.max}
                          </td>
                          <td className="p-2.5 border-r border-black text-center font-semibold">
                            {previewModalStudent.selfScores[item.key]}
                          </td>
                          <td className="p-2.5 border-black text-center font-bold text-black">
                            {previewModalStudent.monitorScores[item.key]}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold border-b border-black bg-slate-50/80">
                        <td className="p-2.5 border-r border-black uppercase">
                          TỔNG CỘNG ĐIỂM RÈN LUYỆN (XẾP LOẠI)
                        </td>
                        <td className="p-2.5 border-r border-black text-center">
                          100
                        </td>
                        <td className="p-2.5 border-r border-black text-center">
                          {calculateTotal(previewModalStudent.selfScores)}
                        </td>
                        <td className="p-2.5 border-black text-center">
                          <span>{calculateTotal(previewModalStudent.monitorScores)} </span>
                          <span className="text-[12px] font-bold">
                            ({getRank(calculateTotal(previewModalStudent.monitorScores)).label})
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3-Column Signatures Block (Sinh viên - Lớp trưởng - Cán bộ chỉ đạo) */}
                <div className="pt-8 avoid-break">
                  <div className="grid grid-cols-3 text-center text-[13px] items-start">
                    {/* Column 1: Sinh viên */}
                    <div className="space-y-1">
                      <p className="font-bold uppercase">SINH VIÊN</p>
                      <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                      <div className="h-24 flex items-center justify-center font-bold">
                        {previewModalStudent.studentName}
                      </div>
                      <p className="font-bold">{previewModalStudent.studentName}</p>
                    </div>

                    {/* Column 2: Lớp trưởng */}
                    <div className="space-y-1">
                      <p className="font-bold uppercase">LỚP TRƯỞNG</p>
                      <p className="italic text-[12px] text-slate-600">(Ký xác nhận)</p>
                      <div className="h-24 flex items-center justify-center">
                        {previewModalStudent.isSigned && savedSignature ? (
                          <img
                            src={savedSignature}
                            alt="Chữ ký Lớp trưởng"
                            className="max-h-20 max-w-[150px] object-contain drop-shadow-none"
                            style={{ background: 'transparent' }}
                          />
                        ) : (
                          <span className="italic text-[12px] text-slate-400">
                            {previewModalStudent.isSigned ? '[Đã ký số]' : 'Chưa ký xác nhận'}
                          </span>
                        )}
                      </div>
                      <p className="font-bold">{user.fullName}</p>
                    </div>

                    {/* Column 3: Cán bộ chỉ đạo họp lớp */}
                    <div className="space-y-1">
                      <p className="font-bold uppercase">CÁN BỘ CHỈ ĐẠO HỌP LỚP</p>
                      <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                      <div className="h-24 flex items-center justify-center">
                        <span className="italic text-[12px] text-slate-400">
                          (Cố vấn ký xác nhận)
                        </span>
                      </div>
                      <p className="font-bold">ThS. Nguyễn Huyền Trang</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options Modal for Drl student */}
          <ExportOptionsModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            documentTitle={`Phiếu Đánh Giá KQRL - SV ${previewModalStudent.studentName}`}
            documentSubtitle={`Mã SV: ${previewModalStudent.studentMssv} - Lớp: ${user.className}`}
            onExportPdf={async () => {
              const el = document.getElementById('drl-printable-document');
              if (el) {
                await exportElementToPdf(
                  el,
                  `Phieu_DRL_${previewModalStudent.studentMssv}_${previewModalStudent.studentName.replace(/\s+/g, '_')}`
                );
              }
            }}
            onExportDocx={async () => {
              await exportDrlStudentDocx(previewModalStudent, user, savedSignature);
            }}
            onExportXlsx={() => {
              exportDrlStudentXlsx(previewModalStudent, user);
            }}
            onPrint={() => window.print()}
          />
        </div>
      )}
    </div>
  );
};
