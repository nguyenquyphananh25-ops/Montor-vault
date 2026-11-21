import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentSubtitle?: string;
  onExportPdf: () => Promise<void> | void;
  onExportDocx: () => Promise<void> | void;
  onExportXlsx?: (format?: 'xlsx' | 'csv') => Promise<void> | void;
  onPrint?: () => void;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentSubtitle,
  onExportPdf,
  onExportDocx,
  onExportXlsx,
  onPrint
}) => {
  const [loadingType, setLoadingType] = useState<'pdf' | 'docx' | 'xlsx' | 'csv' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    try {
      setLoadingType('pdf');
      setSuccessMessage(null);
      await onExportPdf();
      setSuccessMessage('Đã khởi tạo và tải file PDF A4 chuẩn in ấn thành công!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportDocx = async () => {
    try {
      setLoadingType('docx');
      setSuccessMessage(null);
      await onExportDocx();
      setSuccessMessage('Đã tạo và tải file Word (.docx) chuẩn thể thức văn bản hành chính!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportSheet = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (!onExportXlsx) return;
    try {
      setLoadingType(format);
      setSuccessMessage(null);
      await onExportXlsx(format);
      setSuccessMessage(`Đã xuất và tải về tệp Sheet (.${format}) thành công!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingType(null);
    }
  };

  const handlePrint = () => {
    onClose();
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm modal-backdrop-print-hide">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#003B71] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/50 rounded-xl">
              <Download className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tùy Chọn Xuất File & In Ấn</h3>
              <p className="text-xs text-blue-200">
                Chuẩn thể thức hành chính ULIS & Thang lề Quốc gia A4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Document Info */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Văn bản đang chọn:
              </p>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {documentTitle}
              </h4>
              {documentSubtitle && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {documentSubtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Options Selection */}
        <div className="p-5 space-y-3">
          {/* Option 1: PDF Standard A4 */}
          <button
            onClick={handleExportPdf}
            disabled={loadingType !== null}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/30 transition-all group flex items-start gap-3.5 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors shrink-0 mt-0.5">
              {loadingType === 'pdf' ? (
                <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
              ) : (
                <FileText className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900 group-hover:text-rose-950">
                  Xuất PDF A4 chuẩn in ấn
                </span>
                <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full shrink-0">
                  .PDF (300 DPI)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Định dạng A4 (Lề: Trái 30mm, Phải 15mm, Trên/Dưới 20mm), ngắt trang thông minh, phông chữ Times New Roman sắc nét không nhòe.
              </p>
            </div>
          </button>

          {/* Option 2: DOCX Standard Administrative Format */}
          <button
            onClick={handleExportDocx}
            disabled={loadingType !== null}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all group flex items-start gap-3.5 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#003B71] group-hover:bg-blue-100 transition-colors shrink-0 mt-0.5">
              {loadingType === 'docx' ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#003B71]" />
              ) : (
                <Download className="w-5 h-5 text-[#003B71]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900">
                  Xuất file Word .DOCX chuẩn thể thức
                </span>
                <span className="text-[10px] uppercase font-bold bg-blue-100 text-[#003B71] px-2 py-0.5 rounded-full shrink-0">
                  .DOCX BẢN GỐC
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tạo tệp Word nguyên bản từ engine docx.js: Giữ nguyên bảng biểu, định dạng 2 cột Quốc hiệu, tự chèn ảnh chữ ký số trong suốt giữ nguyên tỷ lệ.
              </p>
            </div>
          </button>

          {/* Option 3: Spreadsheet / SheetJS (.XLSX / .CSV) */}
          <div
            className={`w-full p-3.5 sm:p-4 rounded-xl border border-slate-200 transition-all bg-white shadow-sm ${
              onExportXlsx ? 'hover:border-emerald-400 bg-white' : 'opacity-50 bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                {loadingType === 'xlsx' || loadingType === 'csv' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    Xuất và tải về tệp Sheet (.xlsx) đúng chuẩn bố cục mẫu ULIS, Times New Roman 13pt, căn lề ô và in đậm tiêu đề
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                    .XLSX CHUẨN HÀNH CHÍNH
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Xuất bảng số liệu chuẩn hóa qua SheetJS, tự động căn lề cột, phân loại điểm số và danh sách ứng cử / biểu quyết tải về máy tức thì.
                </p>

                {/* Direct Client-Side Download Buttons for XLSX and CSV */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleExportSheet('xlsx')}
                    disabled={loadingType !== null || !onExportXlsx}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về .XLSX (Excel)</span>
                  </button>
                  <button
                    onClick={() => handleExportSheet('csv')}
                    disabled={loadingType !== null || !onExportXlsx}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span>Tải về .CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Option 4: Direct Print preview */}
          <button
            onClick={handlePrint}
            disabled={loadingType !== null}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all group flex items-start gap-3.5 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors shrink-0 mt-0.5">
              <Printer className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900">
                  In Ngay Hoặc Xem Trước (Ctrl + P)
                </span>
                <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                  MÁY IN / PRINT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mở hộp thoại in của trình duyệt, tự động lọc sạch toàn bộ thanh điều hướng, chỉ in đúng bản A4 với lề chuẩn và phông Times New Roman.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Tự động đính kèm chữ ký số điện tử không vỡ nét</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
