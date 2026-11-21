import React from 'react';
import { UserProfile } from '../types';
import {
  GraduationCap,
  LogOut,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Menu,
  ShieldCheck,
  Building2,
  User,
  Printer
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  hasSignature: boolean;
  onLogout: () => void;
  onOpenSignatureStudio: () => void;
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasSignature,
  onLogout,
  onOpenSignatureStudio,
  onToggleSidebar,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#003B71] text-white shadow-md border-b border-blue-900/40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger + Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 focus:outline-none transition-colors"
              title="Mở / Đóng thanh điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {/* Custom ULIS Crest Icon */}
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-sky-300 font-bold shadow-inner">
                <GraduationCap className="w-6 h-6 text-sky-400" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wide text-base text-white">
                    ULIS MONITOR HUB
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-400/20 text-sky-300 border border-sky-400/30 rounded">
                    ĐHQGHN
                  </span>
                </div>
                <p className="text-xs text-blue-200 font-normal truncate max-w-xs">
                  Hệ thống Quản trị Dành Cho Lớp Trưởng ULIS
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick actions, Class Tag & User Info */}
          <div className="flex items-center gap-3">
            {/* Signature Status Pill */}
            <button
              onClick={onOpenSignatureStudio}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                hasSignature
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-400/40 hover:bg-sky-500/30'
              }`}
              title="Trạng thái chữ ký số của Lớp trưởng"
            >
              {hasSignature ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chữ ký số: Đã kích hoạt</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Chưa tạo chữ ký số</span>
                </>
              )}
            </button>

            {/* Quick Print Button */}
            <button
              onClick={() => window.print()}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-800/60 hover:bg-blue-700/80 text-blue-100 text-xs font-medium border border-blue-600/40 transition-colors"
              title="In trang hiện tại / Xuất PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In / PDF</span>
            </button>

            {/* Class Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/15 text-xs text-blue-100">
              <Building2 className="w-3.5 h-3.5 text-sky-300" />
              <span className="font-semibold text-white">{user.className}</span>
              <span className="text-blue-300">|</span>
              <span className="truncate max-w-[120px]">{user.department}</span>
            </div>

            {/* User Profile dropdown button */}
            <div className="flex items-center gap-2 pl-2 border-l border-blue-800">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors group text-left"
                title="Xem thông tin tài khoản Lớp trưởng"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-300 text-slate-900 font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-white/20">
                  {user.fullName.split(' ').pop()?.charAt(0) || 'LT'}
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1">
                    <span>{user.fullName}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-blue-200">
                    MSSV: {user.mssv}
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-blue-200 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
