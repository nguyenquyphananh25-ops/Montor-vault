import React, { useState, useRef } from 'react';
import {
  UserProfile,
  Student,
  MonitorCriterion,
  CongressMetadata,
  ConsensusVote
} from '../types';
import {
  FileText,
  CheckCircle2,
  Share2,
  Printer,
  Cloud,
  ExternalLink,
  Users,
  Award,
  Vote,
  Copy,
  FolderArchive,
  Download,
  Check,
  Building,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import {
  exportElementToPdf,
  exportMonitorEvaluationDocx,
  exportMonitorMeetingMinutesDocx,
  exportCongressDocx,
  exportMonitorEvaluationXlsx,
  exportMonitorMeetingMinutesXlsx,
  exportCongressDocXlsx,
  exportSubjectGradesXlsx,
  exportSubjectGradesDocx,
  exportUlisOfficialRosterXlsx,
  exportUlisOfficialRosterDocx
} from '../utils/documentExportEngine';
import { SubjectGradeItem, UlisSubjectResult } from '../types';
import { ExportOptionsModal } from './ExportOptionsModal';

interface AdministrativeDocsProps {
  user: UserProfile;
  students: Student[];
  criteria: MonitorCriterion[];
  congressData: CongressMetadata;
  savedSignature: string | null;
  onUpdateCriteria: (criteria: MonitorCriterion[]) => void;
  onUpdateCongress: (data: CongressMetadata) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdministrativeDocs: React.FC<AdministrativeDocsProps> = ({
  user,
  students,
  criteria,
  congressData,
  savedSignature,
  onUpdateCriteria,
  onUpdateCongress,
  onShowToast
}) => {
  // Document DOM Refs for high-fidelity PDF export
  const monitorEvalRef = useRef<HTMLDivElement>(null);
  const monitorMinutesRef = useRef<HTMLDivElement>(null);
  const congressDocRef = useRef<HTMLDivElement>(null);

  // Universal Export Options Modal state
  const [exportModalConfig, setExportModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    elementId: string;
    onExportDocx: () => Promise<void>;
    onExportXlsx?: () => Promise<void> | void;
  } | null>(null);

  // Main sub-tabs: 4.1, 4.2 or 4.3
  const [subSection, setSubSection] = useState<'monitor_eval' | 'congress' | 'grades_roster'>('monitor_eval');

  // Sub-section 4.3 state: Bảng điểm & Danh sách lớp chuẩn ULIS
  const [selectedGradeDoc, setSelectedGradeDoc] = useState<'subject_grades' | 'official_roster'>('subject_grades');
  const [currentSubject, setCurrentSubject] = useState<{ name: string; code: string }>({
    name: 'Tiếng Anh Học Thuật 1',
    code: 'ENG1001'
  });

  // Sub-section 4.1 state: voting modal / consensus
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isMeetingMinutesOpen, setIsMeetingMinutesOpen] = useState(false);
  const [votes, setVotes] = useState<ConsensusVote[]>(() =>
    students.map((st) => ({
      studentMssv: st.mssv,
      studentName: st.fullName,
      agree: true,
      comment: 'Hoàn toàn nhất trí với mức điểm tự chấm của Lớp trưởng'
    }))
  );

  // Sub-section 4.2 state: which of the 6 docs is selected
  const [selectedCongressDoc, setSelectedCongressDoc] = useState<number>(1);
  const [isDriveExportModalOpen, setIsDriveExportModalOpen] = useState(false);
  const [driveExportProgress, setDriveExportProgress] = useState(0);

  // Calculate monitor self scores
  const totalScore = criteria.reduce((sum, c) => sum + c.selfScore, 0);
  const schoolScore = criteria
    .filter((c) => c.category === 'A_NhaTruong')
    .reduce((sum, c) => sum + c.selfScore, 0);
  const unionScore = criteria
    .filter((c) => c.category === 'B_DoanHoi')
    .reduce((sum, c) => sum + c.selfScore, 0);

  const isPassed = totalScore >= 60;
  let ratingLabel = 'Chưa đạt';
  let ratingColor = 'text-rose-600 bg-rose-50 border-rose-200';
  if (totalScore >= 90) {
    ratingLabel = 'Xuất sắc';
    ratingColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  } else if (totalScore >= 80) {
    ratingLabel = 'Tốt';
    ratingColor = 'text-blue-700 bg-blue-50 border-blue-300';
  } else if (totalScore >= 60) {
    ratingLabel = 'Đạt yêu cầu';
    ratingColor = 'text-sky-700 bg-sky-50 border-sky-300';
  }

  // Voting tally
  const agreeCount = votes.filter((v) => v.agree).length;
  const agreePercentage = Math.round((agreeCount / (votes.length || 1)) * 100);

  const handleScoreChange = (id: string, newScore: number) => {
    const updated = criteria.map((c) => {
      if (c.id === id) {
        const clamped = Math.max(0, Math.min(c.maxScore, newScore));
        return { ...c, selfScore: clamped };
      }
      return c;
    });
    onUpdateCriteria(updated);
  };

  const handleCopyVotingLink = async () => {
    const link = `${window.location.origin}/?view=vote_consensus&class=${user.className}&token=ULIS-${Date.now().toString().slice(-6)}`;
    await copyToClipboard(link);
    onShowToast('Đã copy đường link bình xét lớp!', link, 'success');
  };

  const handleSimulateAllAgree = () => {
    setVotes(
      students.map((st) => ({
        studentMssv: st.mssv,
        studentName: st.fullName,
        agree: true,
        comment: 'Đồng ý tuyệt đối, Lớp trưởng rất nhiệt tình và chu đáo'
      }))
    );
    onShowToast('Đã ghi nhận ý kiến cả lớp', '100% sinh viên biểu quyết ĐỒNG Ý', 'success');
  };

  const handleToggleVote = (mssv: string) => {
    setVotes(
      votes.map((v) => (v.studentMssv === mssv ? { ...v, agree: !v.agree } : v))
    );
  };

  const handleSimulateDriveExport = () => {
    setIsDriveExportModalOpen(true);
    setDriveExportProgress(20);
    setTimeout(() => setDriveExportProgress(55), 600);
    setTimeout(() => setDriveExportProgress(85), 1100);
    setTimeout(() => {
      setDriveExportProgress(100);
      onShowToast(
        'Đã xuất hồ sơ lên Google Drive!',
        `Thư mục [ULIS_Dai_Hoi_${congressData.tenChiDoan}_${congressData.nhiemKy}] đã được tạo`,
        'success'
      );
    }, 1600);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#003B71]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh Mục Văn Bản & Biểu Mẫu Hành Chính ULIS
            </h2>
            <p className="text-xs text-slate-500">
              Biểu mẫu chuẩn hóa P.CT&CTHSSV & Bộ hồ sơ Đại hội Chi đoàn - Tự động đồng bộ và ký số
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubSection('monitor_eval')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subSection === 'monitor_eval'
                ? 'bg-[#003B71] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4.1. Đánh Giá Trách Nhiệm Lớp Trưởng
          </button>
          <button
            onClick={() => setSubSection('congress')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subSection === 'congress'
                ? 'bg-[#003B71] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4.2. Bộ Hồ Sơ Đại Hội Chi Đoàn (6 Văn Bản)
          </button>
          <button
            onClick={() => setSubSection('grades_roster')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subSection === 'grades_roster'
                ? 'bg-[#003B71] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4.3. Bảng Điểm & Danh Sách Lớp Chuẩn ULIS
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-SECTION 4.1: PHIẾU ĐÁNH GIÁ TRÁCH NHIỆM LỚP TRƯỞNG & BIÊN BẢN HỌP LỚP */}
      {/* ========================================================================= */}
      {subSection === 'monitor_eval' && (
        <div className="space-y-6">
          {/* Summary Score Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Tổng Điểm Tự Chấm
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#003B71]">
                    {totalScore}/100
                  </span>
                  <span className="text-xs text-slate-500 font-medium">điểm</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <div className="hidden sm:block text-xs text-slate-600 space-y-0.5">
                <div>
                  Mục A (Nhà trường): <b>{schoolScore}/80đ</b>
                </div>
                <div>
                  Mục B (Đoàn - Hội): <b>{unionScore}/20đ</b>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${ratingColor}`}
                >
                  Xếp loại: {ratingLabel}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {isPassed ? '✓ Đạt chuẩn (>=60đ)' : '✗ Chưa đạt'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyVotingLink}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#003B71] text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
                title="Tạo link gửi cho các bạn sinh viên trong lớp biểu quyết"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Tạo Link Bình Xét Lớp</span>
              </button>

              <button
                onClick={() => setIsVotingModalOpen(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>Lớp Biểu Quyết ({agreeCount}/{students.length})</span>
              </button>

              <button
                onClick={() =>
                  setExportModalConfig({
                    isOpen: true,
                    title: 'Phiếu Đánh Giá Trách Nhiệm Lớp Trưởng',
                    subtitle: `Lớp ${user.className} - Lớp trưởng: ${user.fullName} (${user.mssv})`,
                    elementId: 'monitor-evaluation-document',
                    onExportDocx: async () => {
                      await exportMonitorEvaluationDocx(criteria, user, savedSignature);
                    },
                    onExportXlsx: () => {
                      exportMonitorEvaluationXlsx(criteria, user);
                    }
                  })
                }
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Mở tùy chọn xuất file PDF A4, Word DOCX hoặc Excel XLSX"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tùy Chọn Xuất File</span>
              </button>

              <button
                onClick={() => setIsMeetingMinutesOpen(true)}
                className="px-4 py-2 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xem Biên Bản Họp Lớp & In</span>
              </button>
            </div>
          </div>

          {/* Official Evaluation Form Card: Strict Vietnamese Administrative Formatting */}
          <div
            ref={monitorEvalRef}
            id="monitor-evaluation-document"
            className="vn-admin-document bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-6 text-black print-page"
          >
            {/* 2-Column Administrative Header */}
            <div className="grid grid-cols-2 gap-4 text-center items-start border-b border-black/10 pb-4">
              <div>
                <p className="text-[13px] font-normal uppercase leading-tight">
                  ĐẠI HỌC QUỐC GIA HÀ NỘI
                </p>
                <p className="text-[13px] font-bold uppercase leading-tight">
                  TRƯỜNG ĐẠI HỌC NGOẠI NGỮ
                </p>
                <p className="text-[12px] font-bold uppercase leading-tight text-slate-800">
                  PHÒNG CHÍNH TRỊ & CÔNG TÁC HSSV
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
              <h1 className="text-[17px] sm:text-[19px] font-bold uppercase text-black tracking-wide">
                PHIẾU ĐÁNH GIÁ TRÁCH NHIỆM LỚP TRƯỞNG
              </h1>
              <p className="text-[12px] italic text-slate-700">
                (Kèm theo Quy định công tác Ban cán sự lớp - Trường ĐH Ngoại ngữ, ĐHQGHN)
              </p>
            </div>

            {/* Monitor Personal & Banking Info (In đậm nhãn chuẩn thể thức) */}
            <div className="p-4 rounded-xl border border-black/80 bg-slate-50/50 text-[13px] leading-relaxed space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div>
                  <span className="font-bold">1. Họ và tên Lớp trưởng: </span>
                  <span className="uppercase font-semibold">{user.fullName}</span>
                </div>
                <div>
                  <span className="font-bold">2. Mã sinh viên (MSSV): </span>
                  <span className="font-mono font-semibold">{user.mssv}</span>
                </div>
                <div>
                  <span className="font-bold">3. Lớp khóa học: </span>
                  <span className="font-semibold">{user.className}</span>
                </div>
                <div>
                  <span className="font-bold">4. Khoa / Bộ môn: </span>
                  <span className="font-semibold">{user.department}</span>
                </div>
                <div>
                  <span className="font-bold">5. Tài khoản ngân hàng: </span>
                  <span className="font-mono font-semibold">{user.bankAccount || '102873648291'}</span>
                </div>
                <div>
                  <span className="font-bold">6. Chi nhánh ngân hàng: </span>
                  <span className="font-semibold">{user.bankBranch || 'Vietcombank - Chi nhánh Thăng Long, Hà Nội'}</span>
                </div>
              </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-6 pt-2">
              {/* Category A: Nhà Trường */}
              <div>
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-300 mb-3">
                  <h3 className="text-[13px] font-bold text-black uppercase">
                    MỤC A: NHIỆM VỤ NHÀ TRƯỜNG GIAO (TỐI ĐA 80 ĐIỂM)
                  </h3>
                  <span className="text-[13px] font-bold text-blue-900">
                    Điểm tự chấm: {schoolScore}/80đ
                  </span>
                </div>

                <div className="space-y-2.5">
                  {criteria
                    .filter((c) => c.category === 'A_NhaTruong')
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-lg border border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                      >
                        <div className="flex-1 leading-snug">
                          <h4 className="font-bold text-black">
                            {idx + 1}. {item.title.replace(/^\d+\.\s*/, '')}
                          </h4>
                          <p className="text-[12px] italic text-slate-600 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[12px] text-slate-500">
                            Tối đa: <b>{item.maxScore}đ</b>
                          </span>
                          <div className="flex items-center gap-1.5 no-print">
                            <label className="text-[12px] font-semibold text-slate-600">
                              Tự chấm:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={item.maxScore}
                              value={item.selfScore}
                              onChange={(e) =>
                                handleScoreChange(item.id, Number(e.target.value))
                              }
                              className="w-16 px-2 py-1 text-center font-bold text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[#003B71]"
                            />
                            <span className="text-xs text-slate-500">đ</span>
                          </div>
                          <span className="hidden print-only font-bold text-black">
                            {item.selfScore}đ
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Category B: Đoàn - Hội */}
              <div>
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-300 mb-3">
                  <h3 className="text-[13px] font-bold text-black uppercase">
                    MỤC B: NHIỆM VỤ ĐOÀN - HỘI GIAO (TỐI ĐA 20 ĐIỂM)
                  </h3>
                  <span className="text-[13px] font-bold text-blue-900">
                    Điểm tự chấm: {unionScore}/20đ
                  </span>
                </div>

                <div className="space-y-2.5">
                  {criteria
                    .filter((c) => c.category === 'B_DoanHoi')
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-lg border border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                      >
                        <div className="flex-1 leading-snug">
                          <h4 className="font-bold text-black">
                            {idx + 1}. {item.title.replace(/^\d+\.\s*/, '')}
                          </h4>
                          <p className="text-[12px] italic text-slate-600 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[12px] text-slate-500">
                            Tối đa: <b>{item.maxScore}đ</b>
                          </span>
                          <div className="flex items-center gap-1.5 no-print">
                            <label className="text-[12px] font-semibold text-slate-600">
                              Tự chấm:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={item.maxScore}
                              value={item.selfScore}
                              onChange={(e) =>
                                handleScoreChange(item.id, Number(e.target.value))
                              }
                              className="w-16 px-2 py-1 text-center font-bold text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[#003B71]"
                            />
                            <span className="text-xs text-slate-500">đ</span>
                          </div>
                          <span className="hidden print-only font-bold text-black">
                            {item.selfScore}đ
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Total Summary Row */}
            <div className="p-3.5 bg-slate-100 rounded-xl border border-black/20 flex items-center justify-between font-bold text-[13px]">
              <span className="uppercase">TỔNG ĐIỂM TỰ ĐÁNH GIÁ (XẾP LOẠI):</span>
              <span className="text-sm text-blue-900">
                {totalScore}/100 điểm ({ratingLabel})
              </span>
            </div>

            {/* Bottom Signatures Block */}
            <div className="pt-8 border-t border-black/20 grid grid-cols-2 text-center text-[13px] avoid-break">
              <div className="space-y-1">
                <p className="font-bold uppercase">Ý KIẾN CỐ VẤN HỌC TẬP</p>
                <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-24 flex items-center justify-center text-slate-400 italic text-[12px]">
                  (Cố vấn xác nhận sau khi họp lớp)
                </div>
                <p className="font-bold text-black">ThS. Nguyễn Huyền Trang</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold uppercase">LỚP TRƯỞNG TỰ ĐÁNH GIÁ</p>
                <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-24 flex items-center justify-center">
                  {savedSignature ? (
                    <img
                      src={savedSignature}
                      alt="Chữ ký Lớp trưởng"
                      className="max-h-20 max-w-[160px] object-contain drop-shadow-none"
                      style={{ background: 'transparent' }}
                    />
                  ) : (
                    <span className="text-slate-400 italic text-[12px]">
                      Chưa gắn chữ ký số
                    </span>
                  )}
                </div>
                <p className="font-bold text-black">{user.fullName}</p>
                <p className="text-[12px] text-slate-600">MSSV: {user.mssv}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 4.2: BỘ HỒ SƠ ĐẠI HỘI CHI ĐOÀN (6 VĂN BẢN ĐỒNG BỘ AUTOFILL)  */}
      {/* ========================================================================= */}
      {subSection === 'congress' && (
        <div className="space-y-6">
          {/* Unified Metadata Hub Form (Single-Source Autofill) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-[#003B71]">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Trung Tâm Dữ Liệu Đại Hội Chi Đoàn (Single-Source Autofill)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Điền thông tin tại đây 1 lần duy nhất để tự động điền vào trọn bộ 6 văn bản bên dưới
                  </p>
                </div>
              </div>

              <button
                onClick={handleSimulateDriveExport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Cloud className="w-4 h-4" />
                <span>Xuất Toàn Bộ Hồ Sơ Ra Google Drive</span>
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Chi đoàn
                </label>
                <input
                  type="text"
                  value={congressData.tenChiDoan}
                  onChange={(e) =>
                    onUpdateCongress({ ...congressData, tenChiDoan: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khoa / Bộ môn
                </label>
                <input
                  type="text"
                  value={congressData.khoa}
                  onChange={(e) =>
                    onUpdateCongress({ ...congressData, khoa: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhiệm kỳ Đại hội
                </label>
                <input
                  type="text"
                  value={congressData.nhiemKy}
                  onChange={(e) =>
                    onUpdateCongress({ ...congressData, nhiemKy: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thời gian tổ chức
                </label>
                <input
                  type="text"
                  value={congressData.thoiGian}
                  onChange={(e) =>
                    onUpdateCongress({ ...congressData, thoiGian: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa điểm tổ chức
                </label>
                <input
                  type="text"
                  value={congressData.diaDiem}
                  onChange={(e) =>
                    onUpdateCongress({ ...congressData, diaDiem: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Đại biểu khách mời
                </label>
                <input
                  type="text"
                  value={congressData.daiBieuKhachMoi}
                  onChange={(e) =>
                    onUpdateCongress({
                      ...congressData,
                      daiBieuKhachMoi: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tổng số đoàn viên triệu tập
                </label>
                <input
                  type="number"
                  value={congressData.tongSoDoanVien}
                  onChange={(e) =>
                    onUpdateCongress({
                      ...congressData,
                      tongSoDoanVien: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số đoàn viên có mặt
                </label>
                <input
                  type="number"
                  value={congressData.soDoanVienCoMat}
                  onChange={(e) =>
                    onUpdateCongress({
                      ...congressData,
                      soDoanVienCoMat: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số lượng bầu BCH mới
                </label>
                <input
                  type="number"
                  value={congressData.soLuongBau}
                  onChange={(e) =>
                    onUpdateCongress({
                      ...congressData,
                      soLuongBau: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bí thư dự kiến
                </label>
                <input
                  type="text"
                  value={congressData.phanCongNhiemVu?.biThu || ''}
                  onChange={(e) =>
                    onUpdateCongress({
                      ...congressData,
                      phanCongNhiemVu: {
                        ...congressData.phanCongNhiemVu!,
                        biThu: e.target.value
                      }
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold text-blue-900"
                />
              </div>
            </div>
          </div>

          {/* 6 Documents Tab Selector */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5 no-print">
            {[
              { id: 1, name: '1. Báo Cáo Công Tác' },
              { id: 2, name: '2. Biên Bản Đại Hội' },
              { id: 3, name: '3. Biên Bản Kiểm Phiếu' },
              { id: 4, name: '4. Phân Công Nhiệm Vụ' },
              { id: 5, name: '5. Mẫu Phiếu Bầu BCH' },
              { id: 6, name: '6. Mẫu Phiếu Bí Thư' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCongressDoc(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedCongressDoc === tab.id
                    ? 'bg-[#003B71] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.name}</span>
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 pr-2">
              <button
                onClick={() => {
                  const docNames: Record<number, string> = {
                    1: 'Báo Cáo Tổng Kết Công Tác Đoàn & Phương Hướng',
                    2: 'Biên Bản Đại Hội Chi Đoàn',
                    3: 'Biên Bản Kiểm Phiếu Bầu Ban Chấp Hành',
                    4: 'Biên Bản Họp Phân Công Nhiệm Vụ BCH',
                    5: 'Mẫu Phiếu Bầu Ban Chấp Hành Chi Đoàn',
                    6: 'Mẫu Phiếu Bầu Bí Thư & Phó Bí Thư Chi Đoàn'
                  };
                  setExportModalConfig({
                    isOpen: true,
                    title: docNames[selectedCongressDoc] || 'Hồ Sơ Đại Hội Chi Đoàn',
                    subtitle: `Chi đoàn: ${congressData.tenChiDoan} - Nhiệm kỳ: ${congressData.nhiemKy}`,
                    elementId: 'congress-document-container',
                    onExportDocx: async () => {
                      await exportCongressDocx(selectedCongressDoc, congressData, user, savedSignature);
                    },
                    onExportXlsx: () => {
                      exportCongressDocXlsx(selectedCongressDoc, congressData, user);
                    }
                  });
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Mở tùy chọn xuất file PDF A4, Word DOCX hoặc Excel XLSX"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tùy Chọn Xuất File</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                title="In văn bản đang hiển thị"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Văn Bản (Ctrl+P)</span>
              </button>
            </div>
          </div>

          {/* Document Viewer Frame: Strict Vietnamese Administrative Formatting */}
          <div
            ref={congressDocRef}
            id="congress-document-container"
            className="vn-admin-document bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-black text-[13px] leading-relaxed space-y-6 print-page"
          >
            {/* Common 2-Column Youth Union Header */}
            <div className="grid grid-cols-2 gap-4 text-center items-start border-b border-black/10 pb-4">
              <div>
                <p className="text-[12px] font-normal uppercase leading-tight">
                  ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ
                </p>
                <p className="text-[13px] font-bold uppercase leading-tight text-blue-950">
                  CHI ĐOÀN {congressData.tenChiDoan.toUpperCase()}
                </p>
                <div className="w-20 border-b border-black mx-auto mt-1" />
              </div>

              <div>
                <p className="text-[13px] font-bold uppercase leading-tight">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-[14px] font-bold leading-tight underline decoration-solid decoration-1 underline-offset-4">
                  Độc lập – Tự do – Hạnh phúc
                </p>
                <p className="text-[12px] italic mt-2 text-right pr-4">
                  Hà Nội, ngày 26 tháng 10 năm 2024
                </p>
              </div>
            </div>

            {/* Document 1: Báo cáo công tác */}
            {selectedCongressDoc === 1 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="text-[16px] sm:text-[18px] font-bold uppercase text-black pt-1">
                    BÁO CÁO TỔNG KẾT CÔNG TÁC ĐOÀN VÀ PHONG TRÀO THANH NIÊN
                  </h1>
                  <h2 className="text-[14px] font-bold text-slate-800 uppercase">
                    NHIỆM KỲ VỪA QUA VÀ PHƯƠNG HƯỚNG NHIỆM KỲ {congressData.nhiemKy}
                  </h2>
                </div>

                <div className="space-y-3 pt-3">
                  <h3 className="font-bold text-[13px] uppercase text-black">
                    PHẦN THỨ NHẤT: BÁO CÁO TỔNG KẾT NHIỆM KỲ VỪA QUA
                  </h3>
                  <p>
                    Được sự chỉ đạo trực tiếp của BCH Liên chi đoàn {congressData.khoa} và Ban cố vấn học tập, Chi đoàn {congressData.tenChiDoan} với tổng số {congressData.tongSoDoanVien} đoàn viên đã nỗ lực hoàn thành xuất sắc các mặt công tác:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <b>Công tác giáo dục chính trị, tư tưởng:</b> 100% đoàn viên tham gia đầy đủ các đợt học tập Nghị quyết của Đảng, Đoàn; tham gia tuần sinh hoạt công dân sinh viên đầu khóa và chấp hành nghiêm kỷ cương giảng đường.
                    </li>
                    <li>
                      <b>Phong trào học tập và Nghiên cứu khoa học:</b> Đạt tỷ lệ chuyên cần trên 95%, không có trường hợp bị cảnh báo học vụ. Hơn 3 nhóm sinh viên tham gia báo cáo công trình NCKH cấp Khoa.
                    </li>
                    <li>
                      <b>Phong trào Thanh niên tình nguyện & Văn thể mỹ:</b> Tham gia tích cực Ngày hội việc làm ULIS Job Fair, Ngày hội Chào tân sinh viên, các câu lạc bộ ngoại ngữ và phong trào hiến máu nhân đạo.
                    </li>
                  </ul>

                  <h3 className="font-bold text-[13px] uppercase text-black pt-2">
                    PHẦN THỨ HAI: PHƯƠNG HƯỚNG NHIỆM KỲ {congressData.nhiemKy}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>100% đoàn viên đạt kết quả rèn luyện từ loại Khá trở lên (trong đó trên 75% đạt Tốt và Xuất sắc).</li>
                    <li>Tối thiểu 05 đoàn viên đăng ký và đạt danh hiệu "Sinh viên 5 Tốt" cấp Trường.</li>
                    <li>Phối hợp cùng Ban cán sự lớp duy trì sĩ số và đảm bảo 100% sinh viên đủ điều kiện dự thi các môn học phần.</li>
                  </ul>
                </div>

                <div className="pt-6 text-right pr-6 avoid-break">
                  <p className="font-bold uppercase">TM. BAN CHẤP HÀNH CHI ĐOÀN</p>
                  <p className="italic text-[12px] text-slate-600">Bí thư Chi đoàn</p>
                  <div className="h-20 flex items-center justify-end font-bold text-black">
                    {congressData.phanCongNhiemVu?.biThu || 'Lê Minh Tuấn'}
                  </div>
                </div>
              </div>
            )}

            {/* Document 2: Biên bản Đại hội */}
            {selectedCongressDoc === 2 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="text-[16px] sm:text-[18px] font-bold uppercase text-black pt-1">
                    BIÊN BẢN ĐẠI HỘI CHI ĐOÀN
                  </h1>
                  <p className="text-[13px] italic text-slate-700">
                    Nhiệm kỳ {congressData.nhiemKy}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <p>
                    Vào hồi <b>{congressData.thoiGian}</b>, tại <b>{congressData.diaDiem}</b>, Chi đoàn {congressData.tenChiDoan} thuộc Đoàn TNCS Hồ Chí Minh Trường ĐH Ngoại ngữ - ĐHQGHN đã tiến hành tổ chức Đại hội Chi đoàn nhiệm kỳ {congressData.nhiemKy}.
                  </p>
                  <p>
                    <b>1. Thành phần tham dự:</b>
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>Tổng số đoàn viên triệu tập: {congressData.tongSoDoanVien} đ/c.</li>
                    <li>Có mặt: {congressData.soDoanVienCoMat} đ/c. Vắng mặt: {congressData.tongSoDoanVien - congressData.soDoanVienCoMat} đ/c (có phép).</li>
                    <li>Đại biểu khách mời: {congressData.daiBieuKhachMoi}.</li>
                  </ul>

                  <p>
                    <b>2. Đoàn Chủ tịch Đại hội:</b> {congressData.doanChuTich.join('; ')}.
                  </p>
                  <p>
                    <b>3. Thư ký Đại hội:</b> {congressData.thuKy.join('; ')}.
                  </p>
                  <p>
                    <b>4. Tiến trình làm việc:</b>
                  </p>
                  <p className="pl-4">
                    Đại hội đã lắng nghe báo cáo tổng kết, biểu quyết thông qua phương hướng nhiệm kỳ mới với tỷ lệ nhất trí 100%. Sau đó, Đại hội tiến hành bầu Ban Chấp hành Chi đoàn nhiệm kỳ {congressData.nhiemKy} bằng hình thức bỏ phiếu kín theo đúng điều lệ Đoàn.
                  </p>
                </div>

                <div className="pt-8 grid grid-cols-2 text-center text-[13px] avoid-break">
                  <div className="space-y-1">
                    <p className="font-bold uppercase">THƯ KÝ ĐẠI HỘI</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-center justify-center font-bold">
                      {congressData.thuKy[0]}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase">THAY MẶT ĐOÀN CHỦ TỊCH</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-center justify-center">
                      {savedSignature ? (
                        <img
                          src={savedSignature}
                          alt="Chữ ký"
                          className="max-h-16 max-w-[140px] object-contain drop-shadow-none"
                          style={{ background: 'transparent' }}
                        />
                      ) : (
                        <span className="font-bold">{congressData.doanChuTich[0]}</span>
                      )}
                    </div>
                    <p className="font-bold">{congressData.doanChuTich[0]}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Document 3: Biên bản kiểm phiếu */}
            {selectedCongressDoc === 3 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="text-[16px] sm:text-[18px] font-bold uppercase text-black pt-1">
                    BIÊN BẢN KIỂM PHIẾU BẦU BAN CHẤP HÀNH CHI ĐOÀN
                  </h1>
                  <p className="text-[13px] italic text-slate-700">
                    Nhiệm kỳ {congressData.nhiemKy}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <p>
                    Ban kiểm phiếu do Đại hội bầu gồm các đồng chí:
                  </p>
                  <ul className="list-disc pl-5">
                    {congressData.banKiemPhieu.map((bkp, i) => (
                      <li key={i}>{bkp}</li>
                    ))}
                  </ul>

                  <p>
                    <b>Số liệu kiểm phiếu:</b>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] bg-slate-50 p-3 rounded-lg border border-black/30">
                    <div>Phiếu phát ra: <b>{congressData.ketQuaKiemPhieu?.phatRa}</b></div>
                    <div>Phiếu thu vào: <b>{congressData.ketQuaKiemPhieu?.thuVao}</b></div>
                    <div>Phiếu hợp lệ: <b>{congressData.ketQuaKiemPhieu?.hopLe}</b></div>
                    <div>Phiếu không hợp lệ: <b>{congressData.ketQuaKiemPhieu?.khongHopLe}</b></div>
                  </div>

                  <p className="pt-2">
                    <b>Kết quả bầu cử danh sách ứng viên (bảng viền đen mảnh chuẩn quy cách):</b>
                  </p>
                  <table className="w-full text-left text-[13px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-black text-center">
                        <th className="p-2 border-r border-black w-12">STT</th>
                        <th className="p-2 border-r border-black">Họ và tên ứng cử viên</th>
                        <th className="p-2 border-r border-black text-center w-36">Số phiếu đồng ý</th>
                        <th className="p-2 border-black text-center w-28">Tỷ lệ (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {congressData.danhSachUngVien.map((uv, idx) => {
                        const nameOnly = uv.split('(')[0].trim();
                        const votesCount = congressData.ketQuaKiemPhieu?.votes[nameOnly] || 25;
                        const pct = Math.round((votesCount / (congressData.ketQuaKiemPhieu?.hopLe || 27)) * 100);
                        const isElected = idx < congressData.soLuongBau;

                        return (
                          <tr key={idx} className="border-b border-black">
                            <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-black font-medium">
                              {uv} {isElected && <span className="font-bold text-black">(Trúng cử)</span>}
                            </td>
                            <td className="p-2 border-r border-black text-center font-bold">
                              {votesCount}/{congressData.ketQuaKiemPhieu?.hopLe}
                            </td>
                            <td className="p-2 border-black text-center font-semibold">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-8 grid grid-cols-2 text-center text-[13px] avoid-break">
                  <div className="space-y-1 text-left pl-4">
                    <p className="font-bold uppercase">THAY MẶT ĐOÀN CHỦ TỊCH</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-center">
                      {savedSignature ? (
                        <img
                          src={savedSignature}
                          alt="Chữ ký Chủ tịch"
                          className="max-h-16 max-w-[140px] object-contain drop-shadow-none"
                          style={{ background: 'transparent' }}
                        />
                      ) : (
                        <span className="font-bold">{congressData.doanChuTich[0]}</span>
                      )}
                    </div>
                    <p className="font-bold">{congressData.doanChuTich[0]}</p>
                  </div>

                  <div className="space-y-1 text-right pr-4">
                    <p className="font-bold uppercase">TM. BAN KIỂM PHIẾU</p>
                    <p className="italic text-[12px] text-slate-600">Trưởng ban (Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-center justify-end font-bold text-black">
                      {congressData.banKiemPhieu[0]}
                    </div>
                    <p className="font-bold">{congressData.banKiemPhieu[0]}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Document 4: Phân công nhiệm vụ */}
            {selectedCongressDoc === 4 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="text-[16px] sm:text-[18px] font-bold uppercase text-black pt-1">
                    BIÊN BẢN HỌP PHÂN CÔNG NHIỆM VỤ BCH CHI ĐOÀN
                  </h1>
                  <p className="text-[13px] italic text-slate-700">
                    Nhiệm kỳ {congressData.nhiemKy}
                  </p>
                </div>

                <p className="pt-2">
                  Ngay sau khi Đại hội bế mạc, Ban Chấp hành Chi đoàn nhiệm kỳ mới đã tiến hành phiên họp thứ nhất để bầu Bí thư, Phó Bí thư và phân công nhiệm vụ cụ thể:
                </p>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-black/30">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-black w-40">1. Bí thư Chi đoàn:</span>
                    <span className="font-bold">{congressData.phanCongNhiemVu?.biThu}</span>
                    <span className="text-slate-600">(Phụ trách chung công tác Chi đoàn)</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="font-bold text-black w-40">2. Phó Bí thư Chi đoàn:</span>
                    <span className="font-bold">{congressData.phanCongNhiemVu?.phoBiThu}</span>
                    <span className="text-slate-600">(Phụ trách công tác Đoàn viên & Sổ sách)</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="font-bold text-black w-40">3. Các Ủy viên BCH:</span>
                    <div>
                      {congressData.phanCongNhiemVu?.uyVien.map((uv, i) => (
                        <p key={i} className="font-medium">• {uv}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 grid grid-cols-2 text-center text-[13px] avoid-break">
                  <div className="space-y-1">
                    <p className="font-bold uppercase">PHÓ BÍ THƯ</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16 flex items-center justify-center font-bold text-black">
                      {congressData.phanCongNhiemVu?.phoBiThu}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase">BÍ THƯ CHI ĐOÀN</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16 flex items-center justify-center font-bold text-black">
                      {congressData.phanCongNhiemVu?.biThu}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document 5: Mẫu phiếu bầu BCH (Trang trọng, đóng khung) */}
            {selectedCongressDoc === 5 && (
              <div className="max-w-xl mx-auto border-4 border-double border-black p-6 sm:p-8 rounded-lg space-y-4">
                <div className="text-center space-y-1 border-b border-black pb-3">
                  <p className="text-[12px] font-normal uppercase">
                    ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ
                  </p>
                  <p className="text-[13px] font-bold uppercase text-black">
                    CHI ĐOÀN {congressData.tenChiDoan.toUpperCase()}
                  </p>
                  <h1 className="text-[16px] font-bold uppercase text-black pt-1">
                    PHIẾU BẦU BAN CHẤP HÀNH CHI ĐOÀN
                  </h1>
                  <p className="text-[12px] italic text-slate-700">
                    (Nhiệm kỳ {congressData.nhiemKy} - Bầu {congressData.soLuongBau} đồng chí)
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-black/40 text-[12px] leading-relaxed">
                  <b>* Hướng dẫn gạch phiếu:</b> Đại biểu tín nhiệm đồng chí nào thì đánh dấu (X) vào ô "Đồng ý", không tín nhiệm thì đánh dấu (X) vào ô "Không đồng ý". Phiếu bầu quá {congressData.soLuongBau} đồng chí là phiếu không hợp lệ.
                </div>

                <table className="w-full text-left text-[13px] border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-black text-center">
                      <th className="p-2.5 border-r border-black w-12">STT</th>
                      <th className="p-2.5 border-r border-black">Họ và tên ứng cử viên</th>
                      <th className="p-2.5 border-r border-black text-center w-28">Đồng ý (1)</th>
                      <th className="p-2.5 border-black text-center w-28">Không đồng ý (2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {congressData.danhSachUngVien.map((uv, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="p-2.5 border-r border-black text-center font-bold">{idx + 1}</td>
                        <td className="p-2.5 border-r border-black font-semibold text-black">{uv}</td>
                        <td className="p-2.5 border-r border-black text-center">
                          <div className="w-5 h-5 border border-black rounded mx-auto" />
                        </td>
                        <td className="p-2.5 border-black text-center">
                          <div className="w-5 h-5 border border-black rounded mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document 6: Mẫu phiếu Bí thư / Phó Bí thư (Trang trọng, đóng khung) */}
            {selectedCongressDoc === 6 && (
              <div className="max-w-xl mx-auto border-4 border-double border-black p-6 sm:p-8 rounded-lg space-y-4">
                <div className="text-center space-y-1 border-b border-black pb-3">
                  <p className="text-[12px] font-normal uppercase">
                    ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ
                  </p>
                  <p className="text-[13px] font-bold uppercase text-black">
                    CHI ĐOÀN {congressData.tenChiDoan.toUpperCase()}
                  </p>
                  <h1 className="text-[16px] font-bold uppercase text-black pt-1">
                    PHIẾU BẦU BÍ THƯ & PHÓ BÍ THƯ CHI ĐOÀN
                  </h1>
                  <p className="text-[12px] italic text-slate-700">
                    (Phiên họp thứ nhất BCH Chi đoàn nhiệm kỳ {congressData.nhiemKy})
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-[13px] uppercase text-black">
                    I. BẦU CHỨC DANH BÍ THƯ CHI ĐOÀN (Bầu 01 đ/c):
                  </h3>
                  <table className="w-full text-left text-[13px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-black text-center">
                        <th className="p-2 border-r border-black w-12">STT</th>
                        <th className="p-2 border-r border-black">Ứng cử viên Bí thư</th>
                        <th className="p-2 border-r border-black text-center w-28">Đồng ý (1)</th>
                        <th className="p-2 border-black text-center w-28">Không đồng ý (2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black text-center">1</td>
                        <td className="p-2 border-r border-black font-bold text-black">{congressData.phanCongNhiemVu?.biThu}</td>
                        <td className="p-2 border-r border-black text-center"><div className="w-5 h-5 border border-black rounded mx-auto" /></td>
                        <td className="p-2 border-black text-center"><div className="w-5 h-5 border border-black rounded mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 className="font-bold text-[13px] uppercase text-black mt-4">
                    II. BẦU CHỨC DANH PHÓ BÍ THƯ CHI ĐOÀN (Bầu 01 đ/c):
                  </h3>
                  <table className="w-full text-left text-[13px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-black text-center">
                        <th className="p-2 border-r border-black w-12">STT</th>
                        <th className="p-2 border-r border-black">Ứng cử viên Phó Bí thư</th>
                        <th className="p-2 border-r border-black text-center w-28">Đồng ý (1)</th>
                        <th className="p-2 border-black text-center w-28">Không đồng ý (2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black text-center">1</td>
                        <td className="p-2 border-r border-black font-bold text-black">{congressData.phanCongNhiemVu?.phoBiThu}</td>
                        <td className="p-2 border-r border-black text-center"><div className="w-5 h-5 border border-black rounded mx-auto" /></td>
                        <td className="p-2 border-black text-center"><div className="w-5 h-5 border border-black rounded mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 4.3: BẢNG ĐIỂM & DANH SÁCH LỚP CHUẨN ULIS                    */}
      {/* ========================================================================= */}
      {subSection === 'grades_roster' && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedGradeDoc('subject_grades')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedGradeDoc === 'subject_grades'
                    ? 'bg-[#003B71] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. Bảng Điểm Kết Quả Môn Học
              </button>
              <button
                onClick={() => setSelectedGradeDoc('official_roster')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedGradeDoc === 'official_roster'
                    ? 'bg-[#003B71] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. Danh Sách Lớp Sinh Viên
              </button>

              {selectedGradeDoc === 'subject_grades' && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-slate-500 font-semibold">Môn học:</span>
                  <select
                    value={currentSubject.code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const subjects: Record<string, string> = {
                        ENG1001: 'Tiếng Anh Học Thuật 1',
                        ENG2005: 'Ngữ Âm - Âm Vị Học Tiếng Anh',
                        LIN1001: 'Dẫn Luận Ngôn Ngữ Học',
                        ENG2012: 'Kỹ Năng Thuyết Trình Tiếng Anh',
                        ENG2015: 'Văn Hóa Các Nước Nói Tiếng Anh'
                      };
                      setCurrentSubject({
                        code,
                        name: subjects[code] || 'Tiếng Anh Học Thuật 1'
                      });
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 outline-none"
                  >
                    <option value="ENG1001">Tiếng Anh Học Thuật 1 (ENG1001)</option>
                    <option value="ENG2005">Ngữ Âm - Âm Vị Học (ENG2005)</option>
                    <option value="LIN1001">Dẫn Luận Ngôn Ngữ (LIN1001)</option>
                    <option value="ENG2012">Kỹ Năng Thuyết Trình (ENG2012)</option>
                    <option value="ENG2015">Văn Hóa Các Nước (ENG2015)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedGradeDoc === 'subject_grades') {
                    const sampleGrades = students.map((s, idx) => {
                      const tp1 = Number((8.5 + ((idx * 3) % 20) * 0.1).toFixed(1));
                      const tp2 = Number((8.0 + ((idx * 7) % 25) * 0.1).toFixed(1));
                      const finalScore = Number((tp1 * 0.1 + tp2 * 0.3 + (8.5 + ((idx * 5) % 15) * 0.1) * 0.6).toFixed(1));
                      return {
                        stt: idx + 1,
                        mssv: s.mssv,
                        fullName: s.fullName,
                        birthDate: s.birthDate,
                        className: user.className,
                        subjectCode: currentSubject.code,
                        tp1,
                        tp2,
                        finalScore,
                        note: finalScore >= 9.0 ? 'Xuất sắc' : finalScore >= 8.0 ? 'Giỏi' : 'Khá'
                      };
                    });

                    const subResult: UlisSubjectResult = {
                      subjectName: currentSubject.name,
                      subjectCode: currentSubject.code,
                      semester: 'I',
                      academicYear: '2024 - 2025',
                      department: user.department,
                      className: user.className,
                      grades: sampleGrades,
                      graderName: user.fullName,
                      checkerName: 'ThS. Lê Thị Thu Hà',
                      headOfDepartment: 'TS. Vũ Đình Hải',
                      deanName: 'PGS.TS. Trần Thị Hạnh'
                    };

                    setExportModalConfig({
                      isOpen: true,
                      title: `Bảng Điểm Kết Quả Môn Học: ${currentSubject.name}`,
                      subtitle: `Mã môn: ${currentSubject.code} - Lớp: ${user.className} - Khoa: ${user.department}`,
                      elementId: 'ulis-grade-report-document',
                      onExportDocx: async () => {
                        await exportSubjectGradesDocx(subResult);
                      },
                      onExportXlsx: () => {
                        exportSubjectGradesXlsx(subResult, 'xlsx');
                      }
                    });
                  } else {
                    setExportModalConfig({
                      isOpen: true,
                      title: `Danh Sách Lớp Sinh Viên: ${user.className}`,
                      subtitle: `Khoa: ${user.department} - Sĩ số: ${students.length} sinh viên`,
                      elementId: 'ulis-official-roster-document',
                      onExportDocx: async () => {
                        await exportUlisOfficialRosterDocx(students, user, savedSignature);
                      },
                      onExportXlsx: () => {
                        exportUlisOfficialRosterXlsx(students, user, 'xlsx');
                      }
                    });
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tùy Chọn Xuất File</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>In Ngay</span>
              </button>
            </div>
          </div>

          {/* Document 1: Bảng Điểm Kết Quả Môn Học */}
          {selectedGradeDoc === 'subject_grades' && (
            <div
              id="ulis-grade-report-document"
              className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm vn-admin-document max-w-4xl mx-auto space-y-4"
            >
              {/* Header Table */}
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

              {/* Title */}
              <div className="text-center pt-2 pb-1 space-y-1">
                <h1 className="text-[17px] sm:text-[19px] font-bold uppercase text-black tracking-wide">
                  DANH SÁCH KẾT QUẢ MÔN HỌC
                </h1>
                <p className="text-[13px] italic text-slate-700">
                  Học kỳ I – Năm học 2024 - 2025
                </p>
              </div>

              {/* Metadata */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[12px] sm:text-[13px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="font-bold">Môn học: </span>
                  <span>{currentSubject.name}</span>
                </div>
                <div>
                  <span className="font-bold">Mã môn: </span>
                  <span className="font-mono">{currentSubject.code}</span>
                </div>
                <div>
                  <span className="font-bold">Khoa: </span>
                  <span>{user.department}</span>
                </div>
                <div>
                  <span className="font-bold">Lớp: </span>
                  <span className="font-semibold">{user.className}</span>
                </div>
              </div>

              {/* Table of Grades */}
              <table className="w-full text-left text-[12px] border-collapse border border-black my-2">
                <thead>
                  <tr className="bg-slate-50 font-bold border-b border-black text-center">
                    <th className="p-2 border-r border-black w-8">STT</th>
                    <th className="p-2 border-r border-black w-24">MÃ SỐ SV</th>
                    <th className="p-2 border-r border-black">HỌ VÀ TÊN</th>
                    <th className="p-2 border-r border-black w-20">NGÀY SINH</th>
                    <th className="p-2 border-r border-black w-14">LỚP</th>
                    <th className="p-2 border-r border-black w-20">MÃ MÔN</th>
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
                        <td className="p-1.5 border-r border-black font-semibold text-black">{s.fullName}</td>
                        <td className="p-1.5 border-r border-black text-center font-mono">{s.birthDate}</td>
                        <td className="p-1.5 border-r border-black text-center">{user.className}</td>
                        <td className="p-1.5 border-r border-black text-center font-mono">{currentSubject.code}</td>
                        <td className="p-1.5 border-r border-black text-center">{tp1}</td>
                        <td className="p-1.5 border-r border-black text-center">{tp2}</td>
                        <td className="p-1.5 border-r border-black text-center font-bold text-[#003B71]">{finalScore}</td>
                        <td className="p-1.5 border-black text-center italic text-slate-600">{note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary line */}
              <p className="text-[13px] font-bold italic pt-1">
                * Danh sách kết quả này có: {students.length} sinh viên.
              </p>

              {/* 4-Column Signature area */}
              <div className="pt-8 grid grid-cols-4 text-center text-[12px] sm:text-[13px] avoid-break">
                <div className="space-y-1">
                  <p className="font-bold uppercase">NGƯỜI VÀO ĐIỂM</p>
                  <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold">{user.fullName}</div>
                  <p className="font-bold">{user.fullName}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase">NGƯỜI KIỂM TRA</p>
                  <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold">ThS. Lê Thị Thu Hà</div>
                  <p className="font-bold">ThS. Lê Thị Thu Hà</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase">TRƯỞNG BỘ MÔN</p>
                  <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold">TS. Vũ Đình Hải</div>
                  <p className="font-bold">TS. Vũ Đình Hải</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase">TRƯỞNG KHOA</p>
                  <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold">PGS.TS. Trần Thị Hạnh</div>
                  <p className="font-bold">PGS.TS. Trần Thị Hạnh</p>
                </div>
              </div>
            </div>
          )}

          {/* Document 2: Danh Sách Lớp Sinh Viên */}
          {selectedGradeDoc === 'official_roster' && (
            <div
              id="ulis-official-roster-document"
              className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm vn-admin-document max-w-4xl mx-auto space-y-4"
            >
              {/* Header Table */}
              <div className="grid grid-cols-2 gap-4 text-center items-start border-b border-black/10 pb-4">
                <div>
                  <p className="text-[13px] font-bold uppercase leading-tight">
                    TRƯỜNG ĐẠI HỌC NGOẠI NGỮ
                  </p>
                  <p className="text-[12px] font-bold uppercase leading-tight text-slate-800">
                    PHÒNG CHÍNH TRỊ VÀ CÔNG TÁC HSSV
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

              {/* Title */}
              <div className="text-center pt-2 pb-1 space-y-1">
                <h1 className="text-[17px] sm:text-[19px] font-bold uppercase text-black tracking-wide">
                  DANH SÁCH LỚP SINH VIÊN
                </h1>
                <p className="text-[13px] italic text-slate-700">
                  Học kỳ I – Năm học 2024 - 2025
                </p>
              </div>

              {/* Metadata */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[12px] sm:text-[13px] flex items-center justify-between">
                <div>
                  <span className="font-bold">Lớp: </span>
                  <span className="font-semibold">{user.className}</span>
                </div>
                <div>
                  <span className="font-bold">Khoa: </span>
                  <span>{user.department}</span>
                </div>
                <div>
                  <span className="font-bold">Sĩ số: </span>
                  <span className="font-bold text-[#003B71]">{students.length} sinh viên</span>
                </div>
              </div>

              {/* Table of Students */}
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

              {/* Summary line */}
              <p className="text-[13px] font-bold italic pt-1">
                * Danh sách này có: {students.length} sinh viên.
              </p>

              {/* 3-Column Signature area */}
              <div className="pt-8 grid grid-cols-3 text-center text-[12px] sm:text-[13px] avoid-break">
                <div className="space-y-1">
                  <p className="font-bold uppercase">NGƯỜI LẬP DANH SÁCH</p>
                  <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold">{user.fullName}</div>
                  <p className="font-bold">{user.fullName}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase">LỚP TRƯỞNG</p>
                  <p className="italic text-[11px] text-slate-600">(Ký xác nhận)</p>
                  <div className="h-16 flex items-center justify-center">
                    {savedSignature ? (
                      <img
                        src={savedSignature}
                        alt="Chữ ký Lớp trưởng"
                        className="max-h-14 max-w-[130px] object-contain drop-shadow-none"
                        style={{ background: 'transparent' }}
                      />
                    ) : (
                      <span className="font-bold">{user.fullName}</span>
                    )}
                  </div>
                  <p className="font-bold">{user.fullName}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase">CỐ VẤN HỌC TẬP</p>
                  <p className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold">ThS. Nguyễn Huyền Trang</div>
                  <p className="font-bold">ThS. Nguyễn Huyền Trang</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BÌNH XÉT LỚP (VOTING POPUP) */}
      {/* ========================================================================= */}
      {isVotingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-sm">
                  Phiên Họp Lớp Bình Xét Trách Nhiệm Lớp Trưởng
                </h3>
              </div>
              <button
                onClick={() => setIsVotingModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Tỷ lệ đồng ý hiện tại: <b className="text-blue-700">{agreeCount}/{votes.length} ({agreePercentage}%)</b>
                </p>
                <p className="text-[11px] text-slate-500">
                  Điểm Lớp trưởng tự chấm: <b>{totalScore}/100</b> ({ratingLabel})
                </p>
              </div>

              <button
                onClick={handleSimulateAllAgree}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mô phỏng cả lớp Đồng ý (100%)</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              {votes.map((v) => (
                <div
                  key={v.studentMssv}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{v.studentName}</span>
                    <span className="text-slate-400 font-mono ml-2">({v.studentMssv})</span>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">{v.comment}</p>
                  </div>

                  <button
                    onClick={() => handleToggleVote(v.studentMssv)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                      v.agree
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {v.agree ? '✓ Đồng ý' : '✗ Không đồng ý'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Ý kiến biểu quyết sẽ tự động cập nhật vào Biên bản họp lớp
              </span>
              <button
                onClick={() => {
                  setIsVotingModalOpen(false);
                  setIsMeetingMinutesOpen(true);
                }}
                className="px-4 py-2 bg-[#003B71] text-white text-xs font-bold rounded-lg hover:bg-blue-800"
              >
                Xem Biên Bản Hoàn Chỉnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BIÊN BẢN HỌP LỚP (PRINTABLE DOCUMENT WITH SIGNATURE) */}
      {/* ========================================================================= */}
      {isMeetingMinutesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-sm">
                  Biên Bản Họp Lớp Đánh Giá Trách Nhiệm Lớp Trưởng - Lớp {user.className}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setExportModalConfig({
                      isOpen: true,
                      title: `Biên Bản Họp Lớp Đánh Giá Trách Nhiệm Lớp Trưởng - Lớp ${user.className}`,
                      subtitle: `Sĩ số có mặt: ${votes.length} sinh viên - Nhất trí: ${agreePercentage}%`,
                      elementId: 'monitor-minutes-document',
                      onExportDocx: async () => {
                        await exportMonitorMeetingMinutesDocx(criteria, user, votes, students, savedSignature);
                      },
                      onExportXlsx: () => {
                        exportMonitorMeetingMinutesXlsx(criteria, user, votes, students);
                      }
                    })
                  }
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Mở tùy chọn xuất file PDF A4, Word DOCX hoặc Excel XLSX"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tùy Chọn Xuất File</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Biên Bản (Ctrl+P)</span>
                </button>
                <button
                  onClick={() => setIsMeetingMinutesOpen(false)}
                  className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Content: Strict Vietnamese Administrative Formatting */}
            <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1 vn-admin-document bg-white print-page">
              <div ref={monitorMinutesRef} id="monitor-minutes-document" className="space-y-5 text-black text-[13px] leading-relaxed">
                {/* 2-Column Administrative Header */}
                <div className="grid grid-cols-2 gap-4 text-center items-start border-b border-black/10 pb-4">
                  <div>
                    <p className="text-[13px] font-normal uppercase leading-tight">
                      ĐẠI HỌC QUỐC GIA HÀ NỘI
                    </p>
                    <p className="text-[13px] font-bold uppercase leading-tight">
                      TRƯỜNG ĐẠI HỌC NGOẠI NGỮ
                    </p>
                    <p className="text-[12px] font-bold uppercase leading-tight text-blue-950">
                      LỚP {user.className} - {user.department.toUpperCase()}
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

                {/* Main Title */}
                <div className="text-center pt-1 pb-1 space-y-1">
                  <h1 className="text-[17px] sm:text-[19px] font-bold uppercase text-black tracking-wide">
                    BIÊN BẢN HỌP LỚP
                  </h1>
                  <h2 className="text-[13px] font-bold text-black uppercase">
                    VỀ VIỆC ĐÁNH GIÁ TRÁCH NHIỆM BAN CÁN SỰ LỚP THEO QUY ĐỊNH P.CT&CTHSSV
                  </h2>
                </div>

                <div className="space-y-2 pt-1">
                  <p>
                    Hôm nay, vào hồi 14h00, ngày 28 tháng 10 năm 2024, tại Giảng đường Tòa nhà A2, Trường Đại học Ngoại ngữ - ĐHQGHN, tập thể lớp {user.className} đã tiến hành cuộc họp bình xét trách nhiệm Lớp trưởng.
                  </p>
                  <p>
                    <b>1. Thành phần tham dự:</b>
                  </p>
                  <ul className="list-disc pl-6 space-y-0.5">
                    <li>Chủ trì cuộc họp: Đ/c Lê Minh Tuấn (Bí thư Chi đoàn).</li>
                    <li>Thư ký cuộc họp: Đ/c Trần Thị Mai Anh (Lớp phó học tập).</li>
                    <li>Đại diện Cố vấn học tập: ThS. Nguyễn Huyền Trang.</li>
                    <li>Sĩ số lớp có mặt: {votes.length}/{students.length} sinh viên (đạt tỷ lệ 100%).</li>
                  </ul>

                  <p className="pt-1">
                    <b>2. Nội dung tự đánh giá của Lớp trưởng:</b>
                  </p>
                  <p className="pl-3">
                    Đồng chí <b>{user.fullName}</b> (MSSV: {user.mssv}) - Lớp trưởng lớp {user.className} đã trình bày bản tự kiểm điểm và kết quả tự đánh giá:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-black/30 my-1 space-y-1 text-[13px]">
                    <div className="flex justify-between">
                      <span>• Điểm tự chấm Mục A (Nhiệm vụ Nhà trường):</span>
                      <b>{schoolScore}/80 điểm</b>
                    </div>
                    <div className="flex justify-between">
                      <span>• Điểm tự chấm Mục B (Nhiệm vụ Đoàn - Hội):</span>
                      <b>{unionScore}/20 điểm</b>
                    </div>
                    <div className="flex justify-between border-t border-black/20 pt-1 font-bold text-black">
                      <span>• TỔNG ĐIỂM TỰ ĐÁNH GIÁ:</span>
                      <span>{totalScore}/100 điểm ({ratingLabel})</span>
                    </div>
                  </div>

                  <p className="pt-1">
                    <b>3. Kết quả biểu quyết của tập thể lớp:</b>
                  </p>
                  <ul className="list-disc pl-6 space-y-0.5">
                    <li>Số sinh viên biểu quyết Đồng ý: <b>{agreeCount}/{votes.length}</b> (đạt tỷ lệ <b>{agreePercentage}%</b>).</li>
                    <li>Số sinh viên biểu quyết Không đồng ý: <b>{votes.length - agreeCount}</b>.</li>
                    <li>
                      Kết luận của cuộc họp: Tập thể lớp nhất trí 100% đề nghị Nhà trường, Phòng CT&CTHSSV và Khoa công nhận kết quả đánh giá trách nhiệm của Lớp trưởng {user.fullName}.
                    </li>
                  </ul>

                  <p className="pt-2 font-bold">
                    4. Bảng danh sách sinh viên lớp tham gia biểu quyết (Biểu quyết công khai):
                  </p>
                  {/* Class Voting Table: [STT | Mã SV | Họ và tên | Đồng ý (X) | Không đồng ý (X) | Chữ ký] */}
                  <table className="w-full text-left text-[12px] border-collapse border border-black my-2">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-black text-center">
                        <th className="p-2 border-r border-black w-10">STT</th>
                        <th className="p-2 border-r border-black w-24">Mã SV</th>
                        <th className="p-2 border-r border-black">Họ và tên sinh viên</th>
                        <th className="p-2 border-r border-black w-24 text-center">Đồng ý (X)</th>
                        <th className="p-2 border-r border-black w-28 text-center">Không Đ/Ý (X)</th>
                        <th className="p-2 border-black w-24 text-center">Chữ ký</th>
                      </tr>
                    </thead>
                    <tbody>
                      {votes.map((v, idx) => (
                        <tr key={v.studentMssv} className="border-b border-black/60">
                          <td className="p-1.5 border-r border-black text-center">{idx + 1}</td>
                          <td className="p-1.5 border-r border-black text-center font-mono">{v.studentMssv}</td>
                          <td className="p-1.5 border-r border-black font-semibold">{v.studentName}</td>
                          <td className="p-1.5 border-r border-black text-center font-bold">
                            {v.agree ? 'X' : ''}
                          </td>
                          <td className="p-1.5 border-r border-black text-center font-bold">
                            {!v.agree ? 'X' : ''}
                          </td>
                          <td className="p-1.5 border-black text-center italic text-slate-400">
                            
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3-Column Signatures Block (Thư ký - Chủ trì - Lớp trưởng) */}
                <div className="pt-8 grid grid-cols-3 text-center text-[13px] avoid-break">
                  <div className="space-y-1">
                    <p className="font-bold uppercase">THƯ KÝ CUỘC HỌP</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-center justify-center font-bold">
                      Trần Thị Mai Anh
                    </div>
                    <p className="font-bold">Trần Thị Mai Anh</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold uppercase">CHỦ TRÌ CUỘC HỌP (BÍ THƯ)</p>
                    <p className="italic text-[12px] text-slate-600">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-center justify-center font-bold">
                      Lê Minh Tuấn
                    </div>
                    <p className="font-bold">Lê Minh Tuấn</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold uppercase">LỚP TRƯỞNG</p>
                    <p className="italic text-[12px] text-slate-600">(Ký xác nhận)</p>
                    <div className="h-20 flex items-center justify-center">
                      {savedSignature ? (
                        <img
                          src={savedSignature}
                          alt="Chữ ký Lớp trưởng"
                          className="max-h-16 max-w-[140px] object-contain drop-shadow-none"
                          style={{ background: 'transparent' }}
                        />
                      ) : (
                        <span className="font-bold">{user.fullName}</span>
                      )}
                    </div>
                    <p className="font-bold">{user.fullName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GOOGLE DRIVE SIMULATOR BUNDLE EXPORT */}
      {/* ========================================================================= */}
      {isDriveExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#003B71] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-sm">
                  Đồng Bộ Google Drive - Hồ Sơ Đại Hội Chi Đoàn
                </h3>
              </div>
              <button
                onClick={() => setIsDriveExportModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    {driveExportProgress < 100
                      ? 'Đang đóng gói và mã hóa 6 văn bản đại hội...'
                      : 'Đã hoàn tất xuất trọn bộ hồ sơ lên Google Drive!'}
                  </span>
                  <span className="text-[#003B71] font-bold">{driveExportProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${driveExportProgress}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Bao_Cao_Tong_Ket_Cong_Tac_Chi_Doan.docx</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2. Bien_Ban_Dai_Hoi_Chi_Doan.docx</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3. Bien_Ban_Kiem_Phieu_Bau_BCH.docx</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>4. Bien_Ban_Phan_Cong_Nhiem_Vu_BCH_Moi.docx</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5. Mau_Phieu_Bau_BCH_Khoa_Moi.pdf</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>6. Mau_Phieu_Bau_Bi_Thu_Pho_Bi_Thu.pdf</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsDriveExportModalOpen(false)}
                  className="px-4 py-2 bg-[#003B71] text-white text-xs font-bold rounded-lg hover:bg-blue-800"
                >
                  Đóng Hộp Thoại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Export Options Modal for Administrative Documents */}
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
