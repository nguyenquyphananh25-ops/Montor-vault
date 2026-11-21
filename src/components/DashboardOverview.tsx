import React from 'react';
import { UserProfile, Student, StudentDRL } from '../types';
import { NavTab } from './Sidebar';
import {
  Users,
  AlertTriangle,
  Award,
  FileText,
  PenTool,
  CalendarCheck,
  CheckCircle2,
  Bell,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  GraduationCap,
  Download,
  Share2,
  Clock
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  students: Student[];
  drlList: StudentDRL[];
  hasSignature: boolean;
  onNavigate: (tab: NavTab) => void;
  bannedStudentsCount: number;
}

export const DashboardOverview: React.FC<DashboardProps> = ({
  user,
  students,
  drlList,
  hasSignature,
  onNavigate,
  bannedStudentsCount
}) => {
  const signedDrlCount = drlList.filter((d) => d.isSigned).length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003B71] via-[#004d94] to-[#1D4ED8] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-sky-300 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Thống Quản Trị Lớp Trưởng Chuyên Nghiệp ULIS - ĐHQGHN</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Xin chào, Lớp trưởng {user.fullName}! 👋
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Chào mừng bạn đến với trung tâm điều hành lớp <b className="text-white font-semibold">{user.className}</b> ({user.department}). Mọi công tác điểm danh, biểu mẫu hành chính, hồ sơ Đại hội và chấm ĐRL đã sẵn sàng.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-sky-500/20"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Vào Điểm Danh Tuần Này</span>
            </button>
            <button
              onClick={() => onNavigate('drl')}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/25 backdrop-blur-sm flex items-center gap-2 transition-all"
            >
              <Award className="w-4 h-4 text-sky-300" />
              <span>Chấm ĐRL Cả Lớp ({drlList.length} SV)</span>
            </button>
            <button
              onClick={() => onNavigate('documents')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 backdrop-blur-sm flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>Hồ Sơ Đại Hội & Đánh Giá LT</span>
            </button>
          </div>
        </div>

        {/* Decorative background badges */}
        <div className="absolute right-4 bottom-[-20px] opacity-10 pointer-events-none hidden md:block">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sĩ số lớp */}
        <div
          onClick={() => onNavigate('roster')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sĩ Số Lớp
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#003B71] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{students.length}</span>
            <span className="text-xs text-slate-500 font-medium">sinh viên</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Lớp: {user.className}</span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
              Xem sổ lớp <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Chuyên cần & Cảnh báo vắng >20% */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-rose-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cảnh Báo Chuyên Cần
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">
              {bannedStudentsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">SV vắng &gt;20%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="text-rose-600 font-medium">Quy chế ĐHQGHN</span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
              Kiểm tra ngay <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Tiến độ chấm ĐRL */}
        <div
          onClick={() => onNavigate('drl')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tiến Độ Chấm ĐRL
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {signedDrlCount}/{drlList.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">đã ký số</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Thang 100 điểm ULIS</span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
              Batch Ký <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Chữ ký số */}
        <div
          onClick={() => onNavigate('signature')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-purple-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Studio Chữ Ký Số
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {hasSignature ? (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Đã Kích Hoạt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                <AlertTriangle className="w-4 h-4 text-slate-500" /> Chưa Tạo Chữ Ký
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Con dấu điện tử</span>
            <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
              Vào Studio <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: ULIS Notice Board & Monitor Quick Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Thông báo P.CT&CTHSSV & ĐHQGHN */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-[#003B71]">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-slate-800">
                Thông Báo & Chỉ Đạo Từ Nhà Trường & Đoàn - Hội ULIS
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Học kỳ 1 • 2024-2025</span>
          </div>

          <div className="space-y-3">
            {/* Notice 1 */}
            <div className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  Phòng CT&CTHSSV
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 2 ngày trước
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                Hướng dẫn đánh giá Điểm Rèn Luyện (ĐRL) và hoàn thiện hồ sơ khen thưởng sinh viên
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Lớp trưởng tổ chức họp lớp rà soát minh chứng 5 tiêu chí. Các trường hợp sinh viên vi phạm quy chế hoặc nợ học phí không được xếp loại Xuất sắc/Tốt. Hạn nộp bản tổng hợp về Khoa trước 30/11.
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('drl')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Mở công cụ chấm ĐRL tự động <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Notice 2 */}
            <div className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                  Đoàn Thanh Niên ULIS
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 5 ngày trước
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                Triển khai tổ chức Đại hội Chi đoàn nhiệm kỳ mới 2024 - 2025
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Ban Chấp hành Chi đoàn phối hợp cùng Lớp trưởng chuẩn bị đầy đủ bộ 6 văn bản đại hội: Báo cáo công tác, Biên bản đại hội, Biên bản kiểm phiếu, Phân công nhiệm vụ và Phiếu bầu theo mẫu chuẩn của Đoàn Trường ĐHNN.
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('documents')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Xem bộ 6 hồ sơ Đại hội Chi đoàn <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Notice 3 */}
            <div className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Phòng Đào Tạo
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 1 tuần trước
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                Nhắc nhở kiểm tra điều kiện dự thi kết thúc học phần (Chuyên cần &gt; 80%)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Theo Quy chế đào tạo ĐHQGHN, sinh viên nghỉ học quá 20% số giờ quy định của học phần sẽ bị cấm thi. Ban cán sự lớp có trách nhiệm thông báo cảnh báo sớm cho sinh viên.
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('attendance')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Kiểm tra danh sách sinh viên vắng <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Ban Cán Sự Checklist & Quick Links */}
        <div className="space-y-6">
          {/* Checklist Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  Nhiệm Vụ Cán Sự Tuần Này
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                4/5 Đã xong
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-slate-700 leading-snug line-through text-slate-400">
                  Điểm danh môn Tiếng Đức chuyên ngành B2.1
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-slate-700 leading-snug line-through text-slate-400">
                  Thông báo hạn nộp học phí qua nhóm Zalo lớp
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-slate-700 leading-snug line-through text-slate-400">
                  Tạo chữ ký số điện tử Lớp trưởng trên hệ thống
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-slate-700 leading-snug line-through text-slate-400">
                  Tổ chức bình xét trách nhiệm Lớp trưởng (P.CT&CTHSSV)
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-slate-800 font-semibold leading-snug">
                  Ký duyệt hàng loạt bảng ĐRL 28 sinh viên & xuất Excel
                </span>
              </label>
            </div>
          </div>

          {/* Quick Contact & Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#003B71] text-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-sky-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Ban Cố Vấn Học Tập Lớp {user.className}
            </h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              Cố vấn: <b>ThS. Nguyễn Huyền Trang</b> (P.CT&CTHSSV)
              <br />
              Văn phòng: Phòng 106, Nhà A2 - ULIS
              <br />
              Email: <span className="underline">trangnh_ctcthssv@vnu.edu.vn</span>
            </p>
            <button
              onClick={() => onNavigate('lecturers')}
              className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Xem danh bạ Giảng viên bộ môn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
