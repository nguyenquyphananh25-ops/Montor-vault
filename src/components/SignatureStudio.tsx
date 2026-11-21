import React, { useRef, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateSampleSignatureDataUrl } from '../utils/helpers';
import {
  PenTool,
  RotateCcw,
  Save,
  Download,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Trash2,
  Palette
} from 'lucide-react';

interface SignatureStudioProps {
  user: UserProfile;
  savedSignature: string | null;
  onSaveSignature: (dataUrl: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SignatureStudio: React.FC<SignatureStudioProps> = ({
  user,
  savedSignature,
  onSaveSignature,
  onShowToast
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#003B71'); // ULIS Administrative Blue
  const [penWidth, setPenWidth] = useState(3.5);
  const [hasContent, setHasContent] = useState(false);
  const [signedDate, setSignedDate] = useState<string>(
    new Date().toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  );

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasContent(true);
      };
      img.src = savedSignature;
    }
  }, [savedSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasContent(true);

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasContent(false);
    onShowToast('Đã xóa bảng vẽ', 'Bạn có thể ký lại từ đầu', 'info');
  };

  const handleLoadSample = () => {
    const sample = generateSampleSignatureDataUrl();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      setHasContent(true);
      onShowToast('Đã nạp mẫu chữ ký', 'Chữ ký mềm mại mẫu cho Lớp trưởng', 'success');
    };
    img.src = sample;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) {
      onShowToast('Chưa có chữ ký', 'Vui lòng ký vào khung vẽ trước khi lưu', 'warning');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onShowToast(
      'Đã lưu chữ ký số!',
      'Chữ ký sẽ tự động được đóng dấu vào các biên bản, biểu mẫu và bảng ĐRL',
      'success'
    );
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) {
      onShowToast('Chưa có chữ ký', 'Vui lòng ký trước khi tải về', 'warning');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Chu_Ky_So_${user.mssv}_${user.fullName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Tải về thành công', 'File PNG trong suốt đã sẵn sàng sử dụng', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Studio Chữ Ký Số & Con Dấu Điện Tử Lớp Trưởng
            </h2>
            <p className="text-xs text-slate-500">
              Tạo chữ ký trực tiếp trên màn hình cảm ứng hoặc chuột, tự động đóng dấu lên các biên bản họp lớp và bảng điểm rèn luyện
            </p>
          </div>
        </div>

        {savedSignature ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã Lưu Chữ Ký Điện Tử Trong Hệ Thống</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Chưa Lưu Chữ Ký - Hãy Ký Ngay Dưới Đây</span>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Canvas Pad on Left, Stamp Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas Pad (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bảng Vẽ Chữ Ký
              </span>
              <span className="text-[11px] text-slate-400">
                (Hỗ trợ chuột & màn hình cảm ứng)
              </span>
            </div>

            {/* Quick pre-fill button */}
            <button
              onClick={handleLoadSample}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi ý mẫu ký đẹp</span>
            </button>
          </div>

          {/* Color & Pen Width Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            {/* Color buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> Màu mực:
              </span>
              <button
                type="button"
                onClick={() => setPenColor('#003B71')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  penColor === '#003B71'
                    ? 'bg-[#003B71] text-white shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#003B71]" />
                <span>Xanh ULIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPenColor('#1D4ED8')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  penColor === '#1D4ED8'
                    ? 'bg-[#1D4ED8] text-white shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                <span>Xanh mực tươi</span>
              </button>

              <button
                type="button"
                onClick={() => setPenColor('#111827')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  penColor === '#111827'
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <span>Đen</span>
              </button>
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Nét bút:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setPenWidth(2)}
                  className={`px-2 py-0.5 text-xs rounded font-medium ${
                    penWidth === 2 ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Mảnh
                </button>
                <button
                  type="button"
                  onClick={() => setPenWidth(3.5)}
                  className={`px-2 py-0.5 text-xs rounded font-medium ${
                    penWidth === 3.5 ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Vừa
                </button>
                <button
                  type="button"
                  onClick={() => setPenWidth(5)}
                  className={`px-2 py-0.5 text-xs rounded font-medium ${
                    penWidth === 5 ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Đậm
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-56 cursor-crosshair touch-none"
            />

            {!hasContent && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300">
                <PenTool className="w-8 h-8 mb-1 opacity-50" />
                <p className="text-xs font-medium">Ký tên của bạn vào đây bằng chuột hoặc màn hình cảm ứng</p>
                <p className="text-[10px] text-slate-400 mt-0.5">(Nền tự động trong suốt dạng PNG)</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleClear}
              className="px-3.5 py-2 border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Xóa làm lại</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPNG}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Tải PNG Trong Suốt</span>
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#003B71] hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/20 transition-all"
              >
                <Save className="w-4 h-4 text-sky-300" />
                <span>Lưu Chữ Ký Số Vào Hệ Thống</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Reusable Official Stamp & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Con Dấu Chứng Thực Điện Tử Ban Cán Sự Lớp
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Mẫu con dấu số chuẩn hóa của Ban cán sự lớp ULIS. Khi bạn lưu chữ ký, con dấu này sẽ tự động gắn vào các văn bản hành chính và bảng điểm rèn luyện:
            </p>

            {/* Official Seal / Stamp Card */}
            <div className="p-5 rounded-2xl border-2 border-blue-600/30 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden shadow-sm">
              {/* Corner Watermark */}
              <div className="absolute top-2 right-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>ĐÃ XÁC THỰC SỐ</span>
              </div>

              <div className="text-center space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  TRƯỜNG ĐẠI HỌC NGOẠI NGỮ - ĐHQGHN
                </p>
                <p className="text-xs font-extrabold uppercase text-[#003B71]">
                  BAN CÁN SỰ LỚP {user.className}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  (Ký và ghi rõ họ tên)
                </p>
              </div>

              {/* Signature Display Area */}
              <div className="my-3 py-2 flex items-center justify-center min-h-[90px]">
                {savedSignature ? (
                  <img
                    src={savedSignature}
                    alt="Chữ ký Lớp trưởng"
                    className="max-h-20 object-contain drop-shadow-sm"
                  />
                ) : (
                  <div className="text-slate-400 italic text-xs text-center border border-dashed border-slate-300 rounded-lg p-4 w-full">
                    Chưa có chữ ký điện tử. Hãy vẽ chữ ký ở khung bên cạnh và nhấn "Lưu Chữ Ký Số".
                  </div>
                )}
              </div>

              <div className="text-center border-t border-blue-100 pt-2">
                <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  MSSV: {user.mssv} • Lớp: {user.className}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mã băm xác thực: SHA256:8f4c...{user.mssv.slice(-4)} • {signedDate}
                </p>
              </div>
            </div>

            {/* Quick Benefits list */}
            <div className="space-y-2 pt-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Tự động đóng dấu vào <b>Biên bản họp lớp đánh giá Lớp trưởng</b></span>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Ký duyệt hàng loạt cho <b>28 phiếu ĐRL sinh viên</b> chỉ với 1 cú click</span>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Đính kèm hồ sơ nộp trực tiếp cho <b>Phòng CT&CTHSSV</b> qua Drive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
