import React, { useState } from 'react';
import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/mockData';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register' | 'profile';
  currentUser?: UserProfile | null;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  onSaveProfile?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode: initialMode,
  currentUser,
  onClose,
  onLogin,
  onSaveProfile
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>(initialMode);

  // Login form state
  const [loginMssv, setLoginMssv] = useState('23041088');
  const [loginPassword, setLoginPassword] = useState('ulis@monitor2024');

  // Register / Profile state
  const [formData, setFormData] = useState<UserProfile>(
    currentUser || INITIAL_USER
  );

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickDemoLogin = () => {
    onLogin(INITIAL_USER);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginMssv.trim()) {
      setErrorMsg('Vui lòng nhập Mã Sinh Viên (MSSV).');
      return;
    }
    // Verify against saved or initial
    const userToLogin: UserProfile = {
      ...(currentUser || INITIAL_USER),
      mssv: loginMssv.trim(),
      fullName: currentUser?.mssv === loginMssv ? currentUser.fullName : 'Nguyễn Hoàng Anh'
    };
    onLogin(userToLogin);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mssv || !formData.className || !formData.department) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }
    if (mode === 'profile' && onSaveProfile) {
      onSaveProfile(formData);
    } else {
      onLogin(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#003B71] text-white p-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
              <GraduationCap className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {mode === 'login'
                  ? 'Đăng Nhập Cán Sự Lớp'
                  : mode === 'register'
                  ? 'Đăng Ký Tài Khoản Lớp Trưởng'
                  : 'Hồ Sơ Cán Sự Lớp'}
              </h3>
              <p className="text-xs text-blue-200">
                Trường Đại học Ngoại ngữ - ĐHQGHN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <div>
              {/* Quick Demo One-Click Login */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#003B71]">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>TRẢI NGHIỆM TỨC THÌ (DEMO)</span>
                  </div>
                  <span className="text-[10px] bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Đăng nhập nhanh với tư cách Lớp trưởng <b>Nguyễn Hoàng Anh (23G3 - Khoa NN&VH Đức)</b> để trải nghiệm đầy đủ các tính năng.
                </p>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2.5 px-4 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-300" />
                  <span>Đăng Nhập Nhanh Với Tư Cách Lớp Trưởng Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase font-medium">
                  Hoặc đăng nhập bằng tài khoản
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tài khoản / Mã Sinh Viên (MSSV) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginMssv}
                      onChange={(e) => setLoginMssv(e.target.value)}
                      placeholder="VD: 23041088"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Đăng Nhập Hệ Thống
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500">
                Chưa có tài khoản Lớp trưởng?{' '}
                <button
                  onClick={() => {
                    setErrorMsg('');
                    setMode('register');
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Đăng ký mới tại đây
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên Lớp trưởng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Hoàng Anh"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã Sinh Viên (MSSV) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mssv}
                    onChange={(e) => setFormData({ ...formData, mssv: e.target.value })}
                    placeholder="VD: 23041088"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số CCCD <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    placeholder="VD: 001205012345"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lớp Khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="VD: 23G3"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khoa / Bộ môn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="VD: Khoa NN&VH Đức"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại / Zalo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0987654321"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày tháng năm sinh
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (@vnu.edu.vn hoặc cá nhân) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="hoanganh_23041088@vnu.edu.vn"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {mode === 'profile' ? 'Cập Nhật Thông Tin Hồ Sơ' : 'Hoàn Tất Đăng Ký & Vào Hệ Thống'}
                </button>
              </div>

              {mode === 'register' && (
                <div className="text-center text-xs text-slate-500 pt-1">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('login');
                    }}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Đăng nhập tại đây
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
