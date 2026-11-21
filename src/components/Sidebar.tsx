import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  PenTool,
  FileText,
  CalendarCheck,
  Award,
  Sparkles,
  ExternalLink,
  HelpCircle,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

export type NavTab = 'dashboard' | 'lecturers' | 'roster' | 'signature' | 'documents' | 'attendance' | 'drl';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  hasSignature: boolean;
  studentsCount: number;
  unassignedDrlCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  hasSignature,
  studentsCount,
  unassignedDrlCount
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Tổng quan',
      sublabel: 'Bảng tin điều hành & chỉ số lớp',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'lecturers' as NavTab,
      label: '1. Contact Giảng viên',
      sublabel: 'Danh bạ khoa & liên hệ bộ môn',
      icon: Users,
      badge: null
    },
    {
      id: 'roster' as NavTab,
      label: '2. Quản lý Danh sách lớp',
      sublabel: 'Dữ liệu sinh viên & nhập xuất Excel',
      icon: UserCheck,
      badge: `${studentsCount} SV`
    },
    {
      id: 'signature' as NavTab,
      label: '3. Studio Chữ Ký Số',
      sublabel: 'Khởi tạo chữ ký & con dấu điện tử',
      icon: PenTool,
      badge: hasSignature ? 'Đã lưu' : 'Chưa có',
      badgeColor: hasSignature ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
    },
    {
      id: 'documents' as NavTab,
      label: '4. Biểu Mẫu Hành Chính',
      sublabel: 'Biên bản họp & hồ sơ Đại hội Chi đoàn',
      icon: FileText,
      badge: '6 Hồ sơ'
    },
    {
      id: 'attendance' as NavTab,
      label: '5. Điểm Danh Môn Học',
      sublabel: 'Sổ chuyên cần & cảnh báo cấm thi',
      icon: CalendarCheck,
      badge: '15 tuần'
    },
    {
      id: 'drl' as NavTab,
      label: '6. Chấm Điểm Rèn Luyện',
      sublabel: 'Duyệt điểm rèn luyện & ký số hàng loạt',
      icon: Award,
      badge: unassignedDrlCount > 0 ? `${unassignedDrlCount} chờ` : 'Đã duyệt'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-20 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          <div className="px-3 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hệ Thống Phân Hệ Quản Trị
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full group flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 relative ${
                  isActive
                    ? 'bg-[#003B71] text-white shadow-md shadow-blue-900/15 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-[#003B71] group-hover:bg-blue-50 group-hover:text-blue-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor
                            ? item.badgeColor
                            : isActive
                            ? 'bg-sky-400 text-slate-950 font-bold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.sublabel && (
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Footer Links & Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#003B71]">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Cổng Thông Tin ULIS</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Phòng CT&CTHSSV • Phòng Đào Tạo • Đoàn TN - Hội SV ULIS.
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <a
                href="https://ulis.vnu.edu.vn"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                Trang chủ ULIS <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-400">Ver 2.5 Pro</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
