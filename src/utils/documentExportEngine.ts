/**
 * Administrative Document Export Engine for ULIS Class Monitor Hub
 * Supports:
 * 1. High-fidelity PDF export via html2pdf with strict 300 DPI, margins (Top:20mm, Right:15mm, Bottom:20mm, Left:30mm).
 * 2. Authentic .docx document generation directly in-browser using docx.js and FileSaver.js.
 * 3. Structured .xlsx spreadsheet generation using xlsx.
 * 4. Strict Vietnamese Administrative Formatting Rules (Times New Roman, standard font sizes, 2-column header, exact borders).
 */

import * as XLSX from 'xlsx';
// @ts-ignore
import * as XLSXStyle from 'xlsx-js-style';
import * as docxModule from 'docx';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import {
  UserProfile,
  StudentDRL,
  MonitorCriterion,
  CongressMetadata,
  ConsensusVote,
  Student,
  SubjectGradeItem,
  UlisSubjectResult
} from '../types';

export function getXlsxEngine() {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  return win.XLSX || XLSXStyle || XLSX;
}

export function getDocxLib() {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  return win.docx || docxModule;
}

// Convert base64 data url to Uint8Array for docx ImageRun
export function base64ToUint8Array(base64: string): Uint8Array {
  const commaIndex = base64.indexOf(',');
  const raw = commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64;
  const binaryString = window.atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Calculate signature transformation to prevent distortion and preserve aspect ratio
export async function getSignatureTransformation(
  dataUrl: string,
  maxWidth = 140,
  maxHeight = 60
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 400;
      const h = img.naturalHeight || img.height || 180;
      if (w > 0 && h > 0) {
        const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
        resolve({
          width: Math.round(w * ratio),
          height: Math.round(h * ratio)
        });
      } else {
        resolve({ width: maxWidth, height: maxHeight });
      }
    };
    img.onerror = () => {
      resolve({ width: 140, height: 55 });
    };
    img.src = dataUrl;
  });
}

// Convert modern color formats (oklch, color, lab) to standard rgb/rgba using an offscreen canvas
function convertColorToRgb(colorStr: string): string {
  if (
    !colorStr ||
    (!colorStr.includes('oklch') &&
      !colorStr.includes('color(') &&
      !colorStr.includes('lab(') &&
      !colorStr.includes('lch('))
  ) {
    return colorStr;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#000000';
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    if (data[3] === 255) {
      return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
    }
    return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(2)})`;
  } catch {
    return '#000000';
  }
}

// Deep sanitize all elements in the tree to strip oklch and replace with valid RGB
function sanitizeOklchInTree(root: HTMLElement) {
  const allElements = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
  const colorProps = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor'
  ] as const;

  for (const el of allElements) {
    const computed = window.getComputedStyle(el);
    for (const prop of colorProps) {
      const val = computed[prop];
      if (
        val &&
        (val.includes('oklch') ||
          val.includes('color(') ||
          val.includes('lab(') ||
          val.includes('lch('))
      ) {
        el.style[prop] = convertColorToRgb(val);
      }
    }
  }
}

// Crisp HTML to PDF export using html2canvas-pro + jsPDF with strict A4 settings
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (onProgress) onProgress(15);

  // Clone element to sanitize styles (strip card padding, shadows, outer borders so PDF margins are exact A4)
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.width = '165mm'; // Exact printable width (210mm - 30mm left - 15mm right)
  clone.style.maxWidth = '165mm';
  clone.style.boxSizing = 'border-box';
  clone.style.fontFamily = '"Times New Roman", Times, Georgia, serif';

  // Ensure all images are loaded
  const images = clone.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });
    })
  );

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '0';
  container.style.width = '165mm';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '-9999';
  container.appendChild(clone);
  document.body.appendChild(container);

  // Sanitize oklch colors in the attached clone
  sanitizeOklchInTree(clone);

  if (onProgress) onProgress(35);

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // First priority: html2pdf.js CDN integration with strict Pagebreak, Margin, and Canvas DPI settings
  const html2pdfLib = typeof window !== 'undefined' ? (window as any).html2pdf : null;
  if (typeof html2pdfLib === 'function') {
    try {
      const opt = {
        margin: [20, 15, 20, 30], // Top: 20mm, Right: 15mm, Bottom: 20mm, Left: 30mm (standard Vietnamese administrative margins)
        filename: cleanFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.5, // Crisp 250-300 DPI typography without blur
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          avoid: ['tr', 'p', 'h1', 'h2', 'h3', 'h4', '.avoid-break']
        }
      };

      if (onProgress) onProgress(60);
      await html2pdfLib().set(opt).from(clone).save();
      if (onProgress) onProgress(100);
      return;
    } catch (html2pdfErr) {
      console.warn('html2pdf execution fallback to jsPDF/html2canvas:', html2pdfErr);
    }
  }

  try {
    // Render using html2canvas-pro (native oklch, lab, color() support)
    const canvas = await html2canvas(clone, {
      scale: 2.5, // Crisp 250-300 DPI typography without memory bloat
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: clone.scrollWidth || 794
    });

    if (onProgress) onProgress(70);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // A4 dimensions: 210mm x 297mm
    // Margins: Top: 20mm, Left: 30mm (binding margin), Bottom: 20mm, Right: 15mm
    const marginLeft = 30;
    const marginTop = 20;
    const contentWidthMm = 165;
    const maxContentHeightMm = 257; // 297 - 20 - 20

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const mmPerPx = contentWidthMm / canvasWidth;
    const totalHeightMm = canvasHeight * mmPerPx;
    const maxPageHeightPx = Math.floor(maxContentHeightMm / mmPerPx);

    if (totalHeightMm <= maxContentHeightMm + 2) {
      // Single page document
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, contentWidthMm, totalHeightMm);
    } else {
      // Multi-page document with intelligent break detection
      const childElements = Array.from(
        clone.querySelectorAll('tr, p, h1, h2, h3, h4, .avoid-break, .page-break-before')
      );
      const cloneRect = clone.getBoundingClientRect();
      const elementBreaks: { topPx: number; forceBreak: boolean }[] = [];

      for (const el of childElements) {
        const r = el.getBoundingClientRect();
        const topPx = (r.top - cloneRect.top) * (canvasHeight / (clone.offsetHeight || 1));
        const forceBreak = el.classList.contains('page-break-before');
        if (topPx > 10 && topPx < canvasHeight - 10) {
          elementBreaks.push({ topPx, forceBreak });
        }
      }

      let currentYPx = 0;
      let pageIndex = 0;

      while (currentYPx < canvasHeight) {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const remainingPx = canvasHeight - currentYPx;
        let sliceHeightPx = Math.min(maxPageHeightPx, remainingPx);

        if (remainingPx > maxPageHeightPx) {
          const windowStartPx = currentYPx + maxPageHeightPx * 0.75;
          const windowEndPx = currentYPx + maxPageHeightPx;

          const forced = elementBreaks.find(
            (b) => b.forceBreak && b.topPx > currentYPx + 50 && b.topPx <= windowEndPx
          );

          if (forced) {
            sliceHeightPx = Math.floor(forced.topPx - currentYPx);
          } else {
            const candidates = elementBreaks.filter(
              (b) => b.topPx >= windowStartPx && b.topPx <= windowEndPx
            );
            if (candidates.length > 0) {
              const bestBreak = candidates[candidates.length - 1];
              sliceHeightPx = Math.floor(bestBreak.topPx - currentYPx);
            }
          }
        }

        if (sliceHeightPx < 50 && remainingPx > 50) {
          sliceHeightPx = Math.min(maxPageHeightPx, remainingPx);
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = sliceHeightPx;
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            currentYPx,
            canvasWidth,
            sliceHeightPx,
            0,
            0,
            canvasWidth,
            sliceHeightPx
          );

          const sliceHeightMm = sliceHeightPx * mmPerPx;
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(pageImgData, 'JPEG', marginLeft, marginTop, contentWidthMm, sliceHeightMm);
        }

        currentYPx += sliceHeightPx;
        pageIndex++;
      }
    }

    if (onProgress) onProgress(90);

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onProgress) onProgress(100);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

// Generic file-saver helper
export function triggerFileSave(blob: Blob, filename: string) {
  const saveAs = (window as any).saveAs;
  if (typeof saveAs === 'function') {
    saveAs(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Default standard A4 page margin in dxa (1 mm = 56.6929 dxa)
// Top: 20mm = 1134 dxa
// Bottom: 20mm = 1134 dxa
// Left: 30mm = 1701 dxa (chừa lề đóng gáy)
// Right: 15mm = 850 dxa
export const STANDARD_A4_PAGE_PROPERTIES = {
  page: {
    size: {
      width: 11906, // A4 width in dxa (210mm)
      height: 16838 // A4 height in dxa (297mm)
    },
    margin: {
      top: 1134,
      bottom: 1134,
      left: 1701,
      right: 850
    }
  }
};

export const TNR_FONT = 'Times New Roman';

/* ========================================================================= */
/* 1. MẪU 1: PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN SINH VIÊN                      */
/* ========================================================================= */

// DOCX Generation for Mẫu 1
export async function exportDrlStudentDocx(
  student: StudentDRL,
  user: UserProfile,
  savedSignature: string | null
): Promise<void> {
  const docx = getDocxLib();

  const {
    Document,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    Packer,
    ImageRun,
    UnderlineType
  } = docx;

  const totalSelf =
    student.selfScores.c1 +
    student.selfScores.c2 +
    student.selfScores.c3 +
    student.selfScores.c4 +
    student.selfScores.c5;
  const totalMonitor =
    student.monitorScores.c1 +
    student.monitorScores.c2 +
    student.monitorScores.c3 +
    student.monitorScores.c4 +
    student.monitorScores.c5;

  let rankLabel = 'Yếu';
  if (totalMonitor >= 90) rankLabel = 'Xuất sắc';
  else if (totalMonitor >= 80) rankLabel = 'Tốt';
  else if (totalMonitor >= 65) rankLabel = 'Khá';
  else if (totalMonitor >= 50) rankLabel = 'Trung bình';

  const criteriaList = [
    {
      num: '1',
      title: 'Đánh giá về ý thức tham gia học tập',
      max: 20,
      self: student.selfScores.c1,
      monitor: student.monitorScores.c1
    },
    {
      num: '2',
      title: 'Đánh giá về ý thức chấp hành pháp luật và các quy chế, nội quy của Nhà trường',
      max: 25,
      self: student.selfScores.c2,
      monitor: student.monitorScores.c2
    },
    {
      num: '3',
      title: 'Đánh giá về ý thức tham gia các hoạt động rèn luyện chính trị - xã hội, văn hóa, thể thao, phòng chống tệ nạn xã hội',
      max: 20,
      self: student.selfScores.c3,
      monitor: student.monitorScores.c3
    },
    {
      num: '4',
      title: 'Đánh giá về phẩm chất công dân và quan hệ với cộng đồng',
      max: 25,
      self: student.selfScores.c4,
      monitor: student.monitorScores.c4
    },
    {
      num: '5',
      title: 'Đánh giá về ý thức và kết quả tham gia công tác phụ trách lớp, các đoàn thể, tổ chức trong Nhà trường',
      max: 10,
      self: student.selfScores.c5,
      monitor: student.monitorScores.c5
    }
  ];

  // 2-column national header
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'ĐẠI HỌC QUỐC GIA HÀ NỘI', font: TNR_FONT, size: 24 })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', font: TNR_FONT, bold: true, size: 24 })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '————————————', font: TNR_FONT, size: 20 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: TNR_FONT, bold: true, size: 24 })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Độc lập – Tự do – Hạnh phúc',
                    font: TNR_FONT,
                    bold: true,
                    size: 26,
                    underline: { type: UnderlineType.SINGLE }
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({ text: 'Hà Nội, ngày 28 tháng 10 năm 2024', font: TNR_FONT, italics: true, size: 22 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // Table rows for 5 criteria
  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin
  };

  const drlTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Nội dung đánh giá', font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Điểm tối đa', font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'SV tự đánh giá', font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Lớp đánh giá', font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        })
      ]
    })
  ];

  criteriaList.forEach((c) => {
    drlTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({ text: `Tiêu chí ${c.num}: `, font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: c.title, font: TNR_FONT, size: 24 })
                ]
              })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [new TextRun({ text: `${c.max}`, font: TNR_FONT, bold: true, size: 24 })]
              })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [new TextRun({ text: `${c.self}`, font: TNR_FONT, size: 24 })]
              })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [new TextRun({ text: `${c.monitor}`, font: TNR_FONT, bold: true, size: 24 })]
              })
            ]
          })
        ]
      })
    );
  });

  // Total summary row
  drlTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({ text: 'TỔNG CỘNG ĐIỂM RÈN LUYỆN (XẾP LOẠI):', font: TNR_FONT, bold: true, size: 24 })
              ]
            })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 },
              children: [new TextRun({ text: '100', font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 },
              children: [new TextRun({ text: `${totalSelf}`, font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 },
              children: [
                new TextRun({ text: `${totalMonitor} `, font: TNR_FONT, bold: true, size: 24 }),
                new TextRun({ text: `(${rankLabel})`, font: TNR_FONT, bold: true, size: 22 })
              ]
            })
          ]
        })
      ]
    })
  );

  const drlTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: drlTableRows
  });

  // Prepare Monitor signature image or text
  const monitorSignatureParagraphs = [];
  monitorSignatureParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'LỚP TRƯỞNG', font: TNR_FONT, bold: true, size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '(Ký xác nhận)', font: TNR_FONT, italics: true, size: 20 })]
    })
  );

  if (student.isSigned && savedSignature) {
    try {
      const sigBytes = base64ToUint8Array(savedSignature);
      const trans = await getSignatureTransformation(savedSignature, 140, 55);
      monitorSignatureParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new ImageRun({
              data: sigBytes,
              transformation: trans
            })
          ]
        })
      );
    } catch {
      monitorSignatureParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 300 },
          children: [new TextRun({ text: '[Đã ký số điện tử]', font: TNR_FONT, italics: true, size: 20 })]
        })
      );
    }
  } else {
    monitorSignatureParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
        children: [new TextRun({ text: '', font: TNR_FONT })]
      })
    );
  }

  monitorSignatureParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: user.fullName, font: TNR_FONT, bold: true, size: 24 })]
    })
  );

  // 3-column signature block: Sinh viên - Lớp trưởng - Cán bộ chỉ đạo họp lớp
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'SINH VIÊN', font: TNR_FONT, bold: true, size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 },
                children: [new TextRun({ text: '', font: TNR_FONT })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: student.studentName, font: TNR_FONT, bold: true, size: 24 })]
              })
            ]
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: monitorSignatureParagraphs
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'CÁN BỘ CHỈ ĐẠO HỌP LỚP', font: TNR_FONT, bold: true, size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 },
                children: [new TextRun({ text: '', font: TNR_FONT })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'ThS. Nguyễn Huyền Trang', font: TNR_FONT, bold: true, size: 24 })]
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: STANDARD_A4_PAGE_PROPERTIES,
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: 'PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN',
                font: TNR_FONT,
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Học kỳ I – Năm học 2024 - 2025',
                font: TNR_FONT,
                italics: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: 'Họ và tên sinh viên: ', font: TNR_FONT, size: 24 }),
              new TextRun({ text: student.studentName, font: TNR_FONT, bold: true, size: 24 }),
              new TextRun({ text: '                     Mã số SV: ', font: TNR_FONT, size: 24 }),
              new TextRun({ text: student.studentMssv, font: TNR_FONT, bold: true, size: 24 })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 160 },
            children: [
              new TextRun({ text: 'Lớp: ', font: TNR_FONT, size: 24 }),
              new TextRun({ text: user.className, font: TNR_FONT, bold: true, size: 24 }),
              new TextRun({ text: '                     Khoa: ', font: TNR_FONT, size: 24 }),
              new TextRun({ text: user.department, font: TNR_FONT, bold: true, size: 24 })
            ]
          }),
          drlTable,
          new Paragraph({ spacing: { before: 240 } }),
          signaturesTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerFileSave(blob, `Phieu_DRL_${student.studentMssv}_${student.studentName.replace(/\s+/g, '_')}.docx`);
}

/**
 * Standard Vietnamese Administrative Spreadsheet Styling (Times New Roman, 13pt, exact padding & cell formatting)
 */
export function applyAdministrativeExcelStyles(ws: any, xlsxLib: any) {
  if (!ws || !ws['!ref']) return;
  const range = xlsxLib.utils.decode_range(ws['!ref']);

  const colWidths: { [col: number]: number } = {};
  for (let C = range.s.c; C <= range.e.c; ++C) {
    colWidths[C] = 10;
  }

  // Pass 1: Detect Table Header Rows and Column Specific Alignments
  const tableHeaderRows = new Set<number>();
  const colAlignments: { [col: number]: 'center' | 'left' } = {};

  for (let R = range.s.r; R <= range.e.r; ++R) {
    let rowHasStt = false;
    let rowHasTableHeaders = false;

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[xlsxLib.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v !== undefined && cell.v !== null) {
        const str = String(cell.v).trim().toUpperCase();
        if (str === 'STT') rowHasStt = true;
        if (
          str.includes('MÃ SỐ SV') ||
          str.includes('MÃ SV') ||
          str.includes('MSSV') ||
          str.includes('HỌ VÀ TÊN') ||
          str.includes('HỌ TÊN') ||
          str.includes('NGÀY SINH') ||
          str.includes('NỘI DUNG')
        ) {
          rowHasTableHeaders = true;
        }
      }
    }

    if (rowHasStt && rowHasTableHeaders) {
      tableHeaderRows.add(R);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[xlsxLib.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v !== undefined && cell.v !== null) {
          const str = String(cell.v).trim().toUpperCase();
          if (
            str === 'STT' ||
            str.includes('MÃ SỐ SV') ||
            str.includes('MÃ SV') ||
            str.includes('MSSV') ||
            str.includes('MÃ MÔN') ||
            str.includes('NGÀY SINH') ||
            str.includes('GIỚI TÍNH') ||
            str.includes('LỚP') ||
            str.includes('ĐIỂM') ||
            str.includes('TP1') ||
            str.includes('TP2') ||
            str.includes('TUẦN') ||
            str.includes('SỐ PHIẾU') ||
            str.includes('TỶ LỆ') ||
            str.includes('KẾT QUẢ') ||
            str.includes('ĐIỀU KIỆN') ||
            str.includes('CÓ MẶT') ||
            str.includes('VẮNG') ||
            str.includes('ĐI MUỘN')
          ) {
            colAlignments[C] = 'center';
          } else if (
            str.includes('HỌ VÀ TÊN') ||
            str.includes('HỌ TÊN') ||
            str.includes('GHI CHÚ') ||
            str.includes('NỘI DUNG') ||
            str.includes('EMAIL') ||
            str.includes('CHỨC VỤ') ||
            str.includes('TIÊU CHÍ')
          ) {
            colAlignments[C] = 'left';
          }
        }
      }
    }
  }

  // Pass 2: Apply Styles to all cells
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = xlsxLib.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell) {
        const valStr = cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : '';

        // Auto calculate optimal column width (excluding title rows that span across columns)
        const isSpanningDocTitle =
          valStr.startsWith('ĐẠI HỌC QUỐC GIA') ||
          valStr.startsWith('TRƯỜNG ĐẠI HỌC') ||
          valStr.startsWith('CỘNG HÒA XÃ HỘI') ||
          valStr.startsWith('Độc lập') ||
          valStr.startsWith('PHIẾU ĐÁNH GIÁ') ||
          valStr.startsWith('BIÊN BẢN HỌP LỚP') ||
          valStr.startsWith('BIÊN BẢN KIỂM PHIẾU') ||
          valStr.startsWith('HỒ SƠ ĐẠI HỘI') ||
          valStr.startsWith('BẢNG TỔNG HỢP') ||
          valStr.startsWith('DANH SÁCH KẾT QUẢ MÔN HỌC') ||
          valStr.startsWith('DANH SÁCH LỚP') ||
          valStr.startsWith('DANH SÁCH SINH VIÊN') ||
          valStr.startsWith('Danh sách kết quả này có:') ||
          valStr.startsWith('Danh sách này có:');

        if (!isSpanningDocTitle && valStr.length > 0) {
          let estimatedWidth = 0;
          for (let i = 0; i < valStr.length; i++) {
            const code = valStr.charCodeAt(i);
            if (code >= 65 && code <= 90) {
              estimatedWidth += 1.25;
            } else if (code > 255) {
              estimatedWidth += 1.2;
            } else {
              estimatedWidth += 1.0;
            }
          }
          const paddedWidth = Math.ceil(estimatedWidth) + 3;
          if (paddedWidth > colWidths[C]) {
            colWidths[C] = Math.min(paddedWidth, 65);
          }
        }

        // Determine major header / title
        const isMajorHeader =
          valStr.startsWith('ĐẠI HỌC') ||
          valStr.startsWith('TRƯỜNG') ||
          valStr.startsWith('CỘNG HÒA') ||
          valStr.startsWith('Độc lập') ||
          valStr.startsWith('PHIẾU') ||
          valStr.startsWith('BIÊN BẢN') ||
          valStr.startsWith('HỒ SƠ') ||
          valStr.startsWith('DANH SÁCH') ||
          valStr.startsWith('MỤC A') ||
          valStr.startsWith('MỤC B') ||
          valStr.startsWith('TỔNG') ||
          valStr.startsWith('SINH VIÊN') ||
          valStr.startsWith('LỚP TRƯỞNG') ||
          valStr.startsWith('CÁN BỘ') ||
          valStr.startsWith('THAY MẶT') ||
          valStr.startsWith('TM.') ||
          valStr.startsWith('CHỦ TRÌ') ||
          valStr.startsWith('THƯ KÝ') ||
          valStr.startsWith('NGƯỜI VÀO ĐIỂM') ||
          valStr.startsWith('NGƯỜI KIỂM TRA') ||
          valStr.startsWith('TRƯỞNG BỘ MÔN') ||
          valStr.startsWith('TRƯỜNG BỘ MÔN') ||
          valStr.startsWith('TRƯỞNG KHOA') ||
          valStr.startsWith('TRƯỜNG KHOA') ||
          valStr.startsWith('NGƯỜI LẬP') ||
          valStr.startsWith('CỐ VẤN HỌC TẬP') ||
          valStr.startsWith('PHÒNG ĐÀO TẠO') ||
          valStr.startsWith('PHÒNG CHÍNH TRỊ') ||
          valStr.startsWith('I. ') ||
          valStr.startsWith('II. ') ||
          valStr.startsWith('1. ') ||
          valStr.startsWith('2. ') ||
          valStr.startsWith('3. ') ||
          valStr.startsWith('4. ') ||
          valStr.startsWith('5. ') ||
          valStr.startsWith('6. ');

        const isTableHead =
          tableHeaderRows.has(R) ||
          valStr === 'STT' ||
          valStr.includes('Mã SV') ||
          valStr.includes('MÃ SỐ SV') ||
          valStr.includes('Mã sinh viên') ||
          valStr.includes('Mã số') ||
          valStr.includes('Họ và tên') ||
          valStr.includes('HỌ VÀ TÊN') ||
          valStr.includes('NGÀY SINH') ||
          valStr.includes('MÃ MÔN HỌC') ||
          valStr.includes('ĐIỂM THÀNH PHẦN') ||
          valStr.includes('ĐIỂM TP') ||
          valStr.includes('ĐIỂM MÔN HỌC') ||
          valStr.includes('GHI CHÚ') ||
          valStr.includes('SỐ ĐIỆN THOẠI') ||
          valStr.includes('EMAIL VNU') ||
          valStr.includes('CHỨC VỤ') ||
          valStr.includes('GIỚI TÍNH') ||
          valStr.includes('Nội dung') ||
          valStr.includes('Điểm tối đa') ||
          valStr.includes('SV tự') ||
          valStr.includes('LT tự') ||
          valStr.includes('Lớp đánh giá') ||
          valStr.includes('Đồng ý') ||
          valStr.includes('Không đồng ý') ||
          valStr.includes('Không Đ/Ý') ||
          valStr.includes('Chữ ký') ||
          valStr.includes('Số phiếu') ||
          valStr.includes('Tỷ lệ') ||
          valStr.includes('Kết quả') ||
          valStr.includes('TC1') ||
          valStr.includes('TC2') ||
          valStr.includes('TC3') ||
          valStr.includes('TC4') ||
          valStr.includes('TC5') ||
          valStr.includes('Tuần ') ||
          valStr.includes('Có mặt') ||
          valStr.includes('Vắng') ||
          valStr.includes('Đi muộn') ||
          valStr.includes('Điều kiện');

        // BẮT BUỘC IN ĐẬM (BOLD) toàn bộ dòng tiêu đề cột và các tiêu đề chính
        const isFirstRow = (R === range.s.r);
        const isBold = isFirstRow || isMajorHeader || isTableHead;

        const isItalic =
          !isFirstRow && (
            valStr.startsWith('(') ||
            valStr.includes('ngày') ||
            valStr.includes('tháng') ||
            valStr.includes('năm') ||
            valStr.includes('Quy định') ||
            valStr.includes('Kèm theo') ||
            valStr.includes('Nhiệm kỳ') ||
            valStr.includes('Học kỳ') ||
            valStr.includes('Ký và ghi rõ') ||
            valStr.includes('Ký xác nhận')
          );

        // Strict Vietnamese Administrative Alignment Rules:
        // Cột STT, Ngày sinh, Mã số SV, Điểm, Giới tính: Căn giữa (center)
        // Cột Họ và tên, Ghi chú, Nội dung: Căn trái (left)
        let isCenter = false;

        if (tableHeaderRows.has(R) || isFirstRow) {
          isCenter = true;
        } else if (
          valStr.startsWith('NGƯỜI VÀO ĐIỂM') ||
          valStr.startsWith('NGƯỜI KIỂM TRA') ||
          valStr.startsWith('TRƯỞNG BỘ MÔN') ||
          valStr.startsWith('TRƯỜNG BỘ MÔN') ||
          valStr.startsWith('TRƯỞNG KHOA') ||
          valStr.startsWith('TRƯỜNG KHOA') ||
          valStr.startsWith('NGƯỜI LẬP') ||
          valStr.startsWith('LỚP TRƯỞNG') ||
          valStr.startsWith('CỐ VẤN HỌC TẬP') ||
          valStr.startsWith('CÁN BỘ') ||
          valStr.startsWith('THAY MẶT') ||
          valStr.startsWith('TM.') ||
          valStr.startsWith('CHỦ TRÌ') ||
          valStr.startsWith('THƯ KÝ') ||
          valStr.includes('(Ký và ghi rõ') ||
          valStr.includes('(Ký xác nhận)')
        ) {
          isCenter = true;
        } else if (colAlignments[C] === 'center') {
          isCenter = true;
        } else if (colAlignments[C] === 'left') {
          isCenter = false;
        } else {
          // Dynamic data cell alignment heuristics
          const isDatePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(valStr) || /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(valStr);
          const isMssvPattern = /^\d{7,10}$/.test(valStr);
          const isNumeric = typeof cell.v === 'number' || (!isNaN(Number(valStr)) && valStr !== '');

          if (
            isNumeric ||
            isDatePattern ||
            isMssvPattern ||
            valStr === 'X' ||
            valStr === '[   ]' ||
            valStr === 'Nam' ||
            valStr === 'Nữ' ||
            valStr.includes('Độc lập') ||
            valStr.startsWith('ĐẠI HỌC') ||
            valStr.startsWith('TRƯỜNG') ||
            valStr.startsWith('CỘNG HÒA') ||
            valStr.startsWith('PHIẾU') ||
            valStr.startsWith('BIÊN BẢN') ||
            valStr.startsWith('HỒ SƠ') ||
            valStr.startsWith('DANH SÁCH')
          ) {
            isCenter = true;
          } else {
            isCenter = false;
          }
        }

        const borderDark = { style: 'thin', color: { rgb: '555555' } };

        cell.s = {
          font: {
            name: 'Times New Roman',
            sz: 13,
            bold: isBold,
            italic: isItalic,
            color: { rgb: '000000' }
          },
          alignment: {
            vertical: 'center',
            horizontal: isCenter ? 'center' : 'left',
            wrapText: true
          },
          border: {
            top: borderDark,
            bottom: borderDark,
            left: borderDark,
            right: borderDark
          }
        };

        if (isFirstRow || isTableHead) {
          cell.s.fill = { fgColor: { rgb: 'F1F5F9' } };
        } else if (valStr.startsWith('MỤC A') || valStr.startsWith('MỤC B') || valStr.startsWith('TỔNG CỘNG')) {
          cell.s.fill = { fgColor: { rgb: 'E2E8F0' } };
        }
      }
    }
  }

  // Set auto-adjusted column widths (never smaller than calculated or manually provided)
  if (!ws['!cols']) ws['!cols'] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const existing = ws['!cols'][C]?.wch || 0;
    const finalW = Math.max(existing, colWidths[C] || 12);
    ws['!cols'][C] = { wch: finalW };
  }

  // Row heights for administrative comfort (28pt for header row, 24pt for data)
  if (!ws['!rows']) ws['!rows'] = [];
  for (let R = range.s.r; R <= range.e.r; ++R) {
    if (!ws['!rows'][R]) {
      ws['!rows'][R] = { hpt: R === range.s.r ? 28 : 24 };
    }
  }
}

// XLSX / CSV Generation for Mẫu 1
export function exportDrlStudentXlsx(
  student: StudentDRL,
  user: UserProfile,
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const xlsxLib = getXlsxEngine();
  const totalSelf =
    student.selfScores.c1 +
    student.selfScores.c2 +
    student.selfScores.c3 +
    student.selfScores.c4 +
    student.selfScores.c5;
  const totalMonitor =
    student.monitorScores.c1 +
    student.monitorScores.c2 +
    student.monitorScores.c3 +
    student.monitorScores.c4 +
    student.monitorScores.c5;

  let rankLabel = 'Yếu';
  if (totalMonitor >= 90) rankLabel = 'Xuất sắc';
  else if (totalMonitor >= 80) rankLabel = 'Tốt';
  else if (totalMonitor >= 65) rankLabel = 'Khá';
  else if (totalMonitor >= 50) rankLabel = 'Trung bình';

  const rows = [
    ['ĐẠI HỌC QUỐC GIA HÀ NỘI', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', '', '', 'Độc lập – Tự do – Hạnh phúc'],
    ['', '', '', 'Hà Nội, ngày 28 tháng 10 năm 2024'],
    [],
    ['PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN'],
    ['Học kỳ I – Năm học 2024 - 2025'],
    [],
    [`Họ và tên: ${student.studentName}`, `Mã sinh viên: ${student.studentMssv}`, `Lớp: ${user.className}`, `Khoa: ${user.department}`],
    [],
    ['STT', 'Nội dung tiêu chí rèn luyện', 'Điểm tối đa', 'SV tự chấm', 'Lớp đánh giá'],
    ['1', 'Tiêu chí 1: Đánh giá về ý thức tham gia học tập, NCKH', 20, student.selfScores.c1, student.monitorScores.c1],
    ['2', 'Tiêu chí 2: Đánh giá về ý thức chấp hành pháp luật và các quy chế, nội quy của Nhà trường', 25, student.selfScores.c2, student.monitorScores.c2],
    ['3', 'Tiêu chí 3: Đánh giá về ý thức tham gia các hoạt động chính trị - xã hội, văn thể mỹ & tình nguyện', 20, student.selfScores.c3, student.monitorScores.c3],
    ['4', 'Tiêu chí 4: Đánh giá về phẩm chất công dân và quan hệ với cộng đồng', 25, student.selfScores.c4, student.monitorScores.c4],
    ['5', 'Tiêu chí 5: Đánh giá về ý thức và kết quả tham gia công tác phụ trách lớp, Đoàn thể', 10, student.selfScores.c5, student.monitorScores.c5],
    ['TỔNG CỘNG', 'TỔNG CỘNG ĐIỂM RÈN LUYỆN (XẾP LOẠI)', 100, totalSelf, `${totalMonitor} (${rankLabel})`],
    [],
    ['SINH VIÊN', '', 'LỚP TRƯỞNG', '', 'CÁN BỘ CHỈ ĐẠO HỌP LỚP'],
    ['(Ký và ghi rõ họ tên)', '', student.isSigned ? '(Đã ký xác nhận điện tử)' : '(Ký xác nhận)', '', '(Ký và ghi rõ họ tên)'],
    [student.studentName, '', user.fullName, '', 'ThS. Nguyễn Huyền Trang']
  ];

  const ws = xlsxLib.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 65 },
    { wch: 15 },
    { wch: 15 },
    { wch: 22 }
  ];

  // Apply Times New Roman 13pt and administrative styles
  applyAdministrativeExcelStyles(ws, xlsxLib);

  const wb = xlsxLib.utils.book_new();
  xlsxLib.utils.book_append_sheet(wb, ws, 'Phieu_DRL');
  const baseName = `Phieu_DRL_${student.studentMssv}_${student.studentName.replace(/\s+/g, '_')}`;
  xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
}

/* ========================================================================= */
/* 2. MẪU 3: PHIẾU ĐÁNH GIÁ TRÁCH NHIỆM LỚP TRƯỞNG                          */
/* ========================================================================= */

// DOCX Generation for Mẫu 3
export async function exportMonitorEvaluationDocx(
  criteria: MonitorCriterion[],
  user: UserProfile,
  savedSignature: string | null
): Promise<void> {
  const docx = getDocxLib();

  const {
    Document,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    Packer,
    ImageRun,
    UnderlineType
  } = docx;

  const totalScore = criteria.reduce((sum, c) => sum + c.selfScore, 0);
  const schoolScore = criteria
    .filter((c) => c.category === 'A_NhaTruong')
    .reduce((sum, c) => sum + c.selfScore, 0);
  const unionScore = criteria
    .filter((c) => c.category === 'B_DoanHoi')
    .reduce((sum, c) => sum + c.selfScore, 0);

  let rankStr = 'Chưa đạt';
  if (totalScore >= 90) rankStr = 'Xuất sắc';
  else if (totalScore >= 80) rankStr = 'Tốt';
  else if (totalScore >= 60) rankStr = 'Đạt yêu cầu';

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'ĐẠI HỌC QUỐC GIA HÀ NỘI', font: TNR_FONT, size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', font: TNR_FONT, bold: true, size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'PHÒNG CHÍNH TRỊ & CTHSSV', font: TNR_FONT, bold: true, size: 22 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '————————————', font: TNR_FONT, size: 20 })]
              })
            ]
          }),
          new TableCell({
            width: { size: 52, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: TNR_FONT, bold: true, size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Độc lập – Tự do – Hạnh phúc',
                    font: TNR_FONT,
                    bold: true,
                    size: 26,
                    underline: { type: UnderlineType.SINGLE }
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [new TextRun({ text: 'Hà Nội, ngày 28 tháng 10 năm 2024', font: TNR_FONT, italics: true, size: 22 })]
              })
            ]
          })
        ]
      })
    ]
  });

  // Monitor personal info box with Bank Account & Branch as requested
  const infoBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                  new TextRun({ text: '1. Họ và tên Lớp trưởng: ', font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: user.fullName, font: TNR_FONT, size: 24 }),
                  new TextRun({ text: '        2. Mã sinh viên (MSSV): ', font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: user.mssv, font: TNR_FONT, size: 24 })
                ]
              }),
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: '3. Lớp khóa học: ', font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: user.className, font: TNR_FONT, size: 24 }),
                  new TextRun({ text: '        4. Khoa / Bộ môn: ', font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: user.department, font: TNR_FONT, size: 24 })
                ]
              }),
              new Paragraph({
                spacing: { before: 40, after: 60 },
                children: [
                  new TextRun({ text: '5. Tài khoản ngân hàng: ', font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: user.bankAccount || '102873648291', font: TNR_FONT, size: 24 }),
                  new TextRun({ text: '        6. Chi nhánh ngân hàng: ', font: TNR_FONT, bold: true, size: 24 }),
                  new TextRun({ text: user.bankBranch || 'Vietcombank - Chi nhánh Thăng Long, Hà Nội', font: TNR_FONT, size: 24 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // Criteria Table
  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin
  };

  const evalRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 24 })] })]
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung tiêu chí tự đánh giá', font: TNR_FONT, bold: true, size: 24 })] })]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Điểm tối đa', font: TNR_FONT, bold: true, size: 24 })] })]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LT tự chấm', font: TNR_FONT, bold: true, size: 24 })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: 'MỤC A: NHIỆM VỤ NHÀ TRƯỜNG GIAO (TỐI ĐA 80 ĐIỂM) - Điểm đạt: ' + schoolScore + '/80đ',
                  font: TNR_FONT,
                  bold: true,
                  size: 24
                })
              ]
            })
          ]
        })
      ]
    })
  ];

  criteria
    .filter((c) => c.category === 'A_NhaTruong')
    .forEach((c, idx) => {
      evalRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, font: TNR_FONT, size: 24 })] })]
            }),
            new TableCell({
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({ text: c.title, font: TNR_FONT, bold: true, size: 24 }),
                    new TextRun({ text: `\n${c.description}`, font: TNR_FONT, italics: true, size: 20 })
                  ]
                })
              ]
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${c.maxScore}`, font: TNR_FONT, size: 24 })] })]
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${c.selfScore}`, font: TNR_FONT, bold: true, size: 24 })] })]
            })
          ]
        })
      );
    });

  evalRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: 'MỤC B: NHIỆM VỤ ĐOÀN - HỘI GIAO (TỐI ĐA 20 ĐIỂM) - Điểm đạt: ' + unionScore + '/20đ',
                  font: TNR_FONT,
                  bold: true,
                  size: 24
                })
              ]
            })
          ]
        })
      ]
    })
  );

  criteria
    .filter((c) => c.category === 'B_DoanHoi')
    .forEach((c, idx) => {
      evalRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, font: TNR_FONT, size: 24 })] })]
            }),
            new TableCell({
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({ text: c.title, font: TNR_FONT, bold: true, size: 24 }),
                    new TextRun({ text: `\n${c.description}`, font: TNR_FONT, italics: true, size: 20 })
                  ]
                })
              ]
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${c.maxScore}`, font: TNR_FONT, size: 24 })] })]
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${c.selfScore}`, font: TNR_FONT, bold: true, size: 24 })] })]
            })
          ]
        })
      );
    });

  // Total summary
  evalRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [new TextRun({ text: 'TỔNG ĐIỂM TỰ ĐÁNH GIÁ (XẾP LOẠI):', font: TNR_FONT, bold: true, size: 24 })]
            })
          ]
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '100', font: TNR_FONT, bold: true, size: 24 })] })]
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${totalScore} `, font: TNR_FONT, bold: true, size: 24 }),
                new TextRun({ text: `(${rankStr})`, font: TNR_FONT, bold: true, size: 22 })
              ]
            })
          ]
        })
      ]
    })
  );

  const evalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: evalRows
  });

  // Monitor signature image or text
  const monitorSigParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'LỚP TRƯỞNG TỰ ĐÁNH GIÁ', font: TNR_FONT, bold: true, size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })]
    })
  ];

  if (savedSignature) {
    try {
      const sigBytes = base64ToUint8Array(savedSignature);
      const trans = await getSignatureTransformation(savedSignature, 140, 55);
      monitorSigParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new ImageRun({
              data: sigBytes,
              transformation: trans
            })
          ]
        })
      );
    } catch {
      monitorSigParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 300 },
          children: [new TextRun({ text: '[Đã ký số điện tử]', font: TNR_FONT, italics: true, size: 20 })]
        })
      );
    }
  } else {
    monitorSigParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
        children: [new TextRun({ text: '', font: TNR_FONT })]
      })
    );
  }

  monitorSigParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: user.fullName, font: TNR_FONT, bold: true, size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `MSSV: ${user.mssv}`, font: TNR_FONT, size: 20 })]
    })
  );

  const sigsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Ý KIẾN CỐ VẤN HỌC TẬP', font: TNR_FONT, bold: true, size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 },
                children: [new TextRun({ text: '', font: TNR_FONT })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'ThS. Nguyễn Huyền Trang', font: TNR_FONT, bold: true, size: 24 })]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: monitorSigParagraphs
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: STANDARD_A4_PAGE_PROPERTIES,
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 180 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({
                text: 'PHIẾU ĐÁNH GIÁ TRÁCH NHIỆM LỚP TRƯỞNG',
                font: TNR_FONT,
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: '(Kèm theo Quy định công tác Ban cán sự lớp - Trường ĐH Ngoại ngữ, ĐHQGHN)',
                font: TNR_FONT,
                italics: true,
                size: 22
              })
            ]
          }),
          infoBox,
          new Paragraph({ spacing: { before: 180 } }),
          evalTable,
          new Paragraph({ spacing: { before: 240 } }),
          sigsTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerFileSave(blob, `Phieu_Danh_Gia_Trach_Nhiem_Lop_Truong_${user.className}.docx`);
}

// XLSX / CSV Generation for Mẫu 3
export function exportMonitorEvaluationXlsx(
  criteria: MonitorCriterion[],
  user: UserProfile,
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const xlsxLib = getXlsxEngine();
  const totalScore = criteria.reduce((sum, c) => sum + c.selfScore, 0);
  const schoolScore = criteria
    .filter((c) => c.category === 'A_NhaTruong')
    .reduce((sum, c) => sum + c.selfScore, 0);
  const unionScore = criteria
    .filter((c) => c.category === 'B_DoanHoi')
    .reduce((sum, c) => sum + c.selfScore, 0);

  let rankStr = 'Chưa đạt';
  if (totalScore >= 90) rankStr = 'Xuất sắc';
  else if (totalScore >= 80) rankStr = 'Tốt';
  else if (totalScore >= 60) rankStr = 'Đạt yêu cầu';

  const rows: any[][] = [
    ['ĐẠI HỌC QUỐC GIA HÀ NỘI', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ - PHÒNG CT&CTHSSV', '', 'Độc lập – Tự do – Hạnh phúc'],
    ['', '', 'Hà Nội, ngày 28 tháng 10 năm 2024'],
    [],
    ['PHIẾU ĐÁNH GIÁ TRÁCH NHIỆM LỚP TRƯỞNG'],
    ['(Quy định công tác Ban cán sự lớp - Trường ĐH Ngoại ngữ, ĐHQGHN)'],
    [],
    [`1. Họ và tên Lớp trưởng: ${user.fullName}`, `2. Mã sinh viên: ${user.mssv}`],
    [`3. Lớp: ${user.className}`, `4. Khoa: ${user.department}`],
    [`5. Tài khoản ngân hàng: ${user.bankAccount || '102873648291'}`, `6. Chi nhánh: ${user.bankBranch || 'Vietcombank - CN Thăng Long'}`],
    [],
    ['STT', 'Nội dung tiêu chí tự đánh giá', 'Điểm tối đa', 'LT tự chấm'],
    ['MỤC A', `NHIỆM VỤ NHÀ TRƯỜNG GIAO (TỐI ĐA 80 ĐIỂM) - Điểm đạt: ${schoolScore}/80đ`, 80, schoolScore]
  ];

  criteria
    .filter((c) => c.category === 'A_NhaTruong')
    .forEach((c, idx) => {
      rows.push([idx + 1, `${c.title} - ${c.description}`, c.maxScore, c.selfScore]);
    });

  rows.push(['MỤC B', `NHIỆM VỤ ĐOÀN - HỘI GIAO (TỐI ĐA 20 ĐIỂM) - Điểm đạt: ${unionScore}/20đ`, 20, unionScore]);

  criteria
    .filter((c) => c.category === 'B_DoanHoi')
    .forEach((c, idx) => {
      rows.push([idx + 1, `${c.title} - ${c.description}`, c.maxScore, c.selfScore]);
    });

  rows.push(
    ['TỔNG', 'TỔNG ĐIỂM TỰ ĐÁNH GIÁ (XẾP LOẠI)', 100, `${totalScore} (${rankStr})`],
    [],
    ['Ý KIẾN CỐ VẤN HỌC TẬP', '', 'LỚP TRƯỞNG TỰ ĐÁNH GIÁ'],
    ['(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)'],
    ['ThS. Nguyễn Huyền Trang', '', `${user.fullName} (${user.mssv})`]
  );

  const ws = xlsxLib.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 65 },
    { wch: 15 },
    { wch: 20 }
  ];

  // Apply Times New Roman 13pt and administrative styles
  applyAdministrativeExcelStyles(ws, xlsxLib);

  const wb = xlsxLib.utils.book_new();
  xlsxLib.utils.book_append_sheet(wb, ws, 'Danh_Gia_LT');
  const baseName = `Phieu_Danh_Gia_Trach_Nhiem_Lop_Truong_${user.className}`;
  xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
}

/* ========================================================================= */
/* 3. MẪU 3 PHỤ: BIÊN BẢN HỌP LỚP ĐÁNH GIÁ TRÁCH NHIỆM BAN CÁN SỰ LỚP        */
/* ========================================================================= */

// DOCX Generation for Mẫu 3 Phụ
export async function exportMonitorMeetingMinutesDocx(
  criteria: MonitorCriterion[],
  user: UserProfile,
  votes: ConsensusVote[],
  students: Student[],
  savedSignature: string | null
): Promise<void> {
  const docx = getDocxLib();

  const {
    Document,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    Packer,
    ImageRun,
    UnderlineType
  } = docx;

  const totalScore = criteria.reduce((sum, c) => sum + c.selfScore, 0);
  const schoolScore = criteria.filter((c) => c.category === 'A_NhaTruong').reduce((sum, c) => sum + c.selfScore, 0);
  const unionScore = criteria.filter((c) => c.category === 'B_DoanHoi').reduce((sum, c) => sum + c.selfScore, 0);

  const agreeCount = votes.filter((v) => v.agree).length;
  const agreePercentage = Math.round((agreeCount / (votes.length || 1)) * 100);

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ĐẠI HỌC QUỐC GIA HÀ NỘI', font: TNR_FONT, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `LỚP ${user.className} - KHOA ${user.department.toUpperCase()}`, font: TNR_FONT, bold: true, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '————————————', font: TNR_FONT, size: 20 })] })
            ]
          }),
          new TableCell({
            width: { size: 52, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Độc lập – Tự do – Hạnh phúc',
                    font: TNR_FONT,
                    bold: true,
                    size: 26,
                    underline: { type: UnderlineType.SINGLE }
                  })
                ]
              }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: 'Hà Nội, ngày 28 tháng 10 năm 2024', font: TNR_FONT, italics: true, size: 22 })] })
            ]
          })
        ]
      })
    ]
  });

  // Table of student votes: STT | MSSV | Họ và tên | Đồng ý (X) | Không đồng ý (X) | Chữ ký
  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin
  };

  const studentRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 22 })] })]
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mã SV', font: TNR_FONT, bold: true, size: 22 })] })]
        }),
        new TableCell({
          width: { size: 36, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Họ và tên sinh viên', font: TNR_FONT, bold: true, size: 22 })] })]
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đồng ý (X)', font: TNR_FONT, bold: true, size: 22 })] })]
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không Đ/Ý (X)', font: TNR_FONT, bold: true, size: 22 })] })]
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chữ ký', font: TNR_FONT, bold: true, size: 22 })] })]
        })
      ]
    })
  ];

  votes.forEach((v, idx) => {
    studentRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, font: TNR_FONT, size: 22 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.studentMssv, font: TNR_FONT, size: 22 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: v.studentName, font: TNR_FONT, bold: true, size: 22 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.agree ? 'X' : '', font: TNR_FONT, bold: true, size: 22 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: !v.agree ? 'X' : '', font: TNR_FONT, bold: true, size: 22 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '', font: TNR_FONT, size: 22 })] })]
          })
        ]
      })
    );
  });

  const studentsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: studentRows
  });

  // Monitor signature
  const monitorSigParagraphs = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LỚP TRƯỞNG', font: TNR_FONT, bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký xác nhận)', font: TNR_FONT, italics: true, size: 20 })] })
  ];

  if (savedSignature) {
    try {
      const sigBytes = base64ToUint8Array(savedSignature);
      const trans = await getSignatureTransformation(savedSignature, 140, 55);
      monitorSigParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new ImageRun({
              data: sigBytes,
              transformation: trans
            })
          ]
        })
      );
    } catch {
      monitorSigParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 300 }, children: [new TextRun({ text: '[Đã ký số]', font: TNR_FONT })] }));
    }
  } else {
    monitorSigParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 350, after: 350 }, children: [new TextRun({ text: '', font: TNR_FONT })] }));
  }
  monitorSigParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: user.fullName, font: TNR_FONT, bold: true, size: 24 })] }));

  // 3-column signature block: Thư ký - Bí thư (Chủ trì) - Lớp trưởng
  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'THƯ KÝ CUỘC HỌP', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 350, after: 350 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Trần Thị Mai Anh', font: TNR_FONT, bold: true, size: 24 })] })
            ]
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CHỦ TRÌ (BÍ THƯ)', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 350, after: 350 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Lê Minh Tuấn', font: TNR_FONT, bold: true, size: 24 })] })
            ]
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: monitorSigParagraphs
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: STANDARD_A4_PAGE_PROPERTIES,
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 180 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 40 },
            children: [new TextRun({ text: 'BIÊN BẢN HỌP LỚP', font: TNR_FONT, bold: true, size: 28 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'V/V ĐÁNH GIÁ TRÁCH NHIỆM BAN CÁN SỰ LỚP THEO QUY ĐỊNH P.CT&CTHSSV',
                font: TNR_FONT,
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: 'Hôm nay, vào hồi 14h00 ngày 28 tháng 10 năm 2024, tại Giảng đường Trường ĐH Ngoại ngữ - ĐHQGHN, tập thể lớp ' +
                  user.className +
                  ' đã tiến hành họp bình xét trách nhiệm Lớp trưởng.',
                font: TNR_FONT,
                size: 24
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: '1. Thành phần tham dự:\n', font: TNR_FONT, bold: true, size: 24 }),
              new TextRun({ text: '• Chủ trì cuộc họp: Đ/c Lê Minh Tuấn (Bí thư Chi đoàn).\n', font: TNR_FONT, size: 24 }),
              new TextRun({ text: '• Thư ký cuộc họp: Đ/c Trần Thị Mai Anh (Lớp phó học tập).\n', font: TNR_FONT, size: 24 }),
              new TextRun({ text: '• Đại diện Cố vấn học tập: ThS. Nguyễn Huyền Trang.\n', font: TNR_FONT, size: 24 }),
              new TextRun({ text: `• Sĩ số lớp có mặt: ${votes.length}/${students.length} sinh viên (đạt tỷ lệ 100%).`, font: TNR_FONT, size: 24 })
            ]
          }),
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: '2. Nội dung tự đánh giá của Lớp trưởng:\n', font: TNR_FONT, bold: true, size: 24 }),
              new TextRun({ text: `• Điểm tự chấm Mục A (Nhiệm vụ Nhà trường): ${schoolScore}/80 điểm.\n`, font: TNR_FONT, size: 24 }),
              new TextRun({ text: `• Điểm tự chấm Mục B (Nhiệm vụ Đoàn - Hội): ${unionScore}/20 điểm.\n`, font: TNR_FONT, size: 24 }),
              new TextRun({ text: `• TỔNG ĐIỂM TỰ ĐÁNH GIÁ: ${totalScore}/100 điểm.`, font: TNR_FONT, bold: true, size: 24 })
            ]
          }),
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: '3. Kết quả biểu quyết của tập thể lớp:\n', font: TNR_FONT, bold: true, size: 24 }),
              new TextRun({
                text: `• Số sinh viên biểu quyết Đồng ý: ${agreeCount}/${votes.length} (đạt ${agreePercentage}%).\n` +
                  `• Số sinh viên biểu quyết Không đồng ý: ${votes.length - agreeCount}.\n` +
                  '• Kết luận: Tập thể lớp nhất trí đề nghị Nhà trường và Phòng CT&CTHSSV công nhận mức điểm tự chấm của Lớp trưởng.',
                font: TNR_FONT,
                size: 24
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: '4. Bảng danh sách sinh viên lớp tham gia biểu quyết:', font: TNR_FONT, bold: true, size: 24 })]
          }),
          studentsTable,
          new Paragraph({ spacing: { before: 240 } }),
          sigTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerFileSave(blob, `Bien_Ban_Hop_Lop_Danh_Gia_Lop_Truong_${user.className}.docx`);
}

// XLSX / CSV Generation for Mẫu 3 Phụ (Biên bản họp lớp)
export function exportMonitorMeetingMinutesXlsx(
  criteria: MonitorCriterion[],
  user: UserProfile,
  votes: ConsensusVote[],
  students: Student[],
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const xlsxLib = getXlsxEngine();
  const totalScore = criteria.reduce((sum, c) => sum + c.selfScore, 0);
  const agreeCount = votes.filter((v) => v.agree).length;
  const agreePercentage = Math.round((agreeCount / (votes.length || 1)) * 100);

  const rows: any[][] = [
    ['ĐẠI HỌC QUỐC GIA HÀ NỘI', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', '', 'Độc lập – Tự do – Hạnh phúc'],
    [`LỚP ${user.className} - KHOA ${user.department.toUpperCase()}`, '', 'Hà Nội, ngày 28 tháng 10 năm 2024'],
    [],
    ['BIÊN BẢN HỌP LỚP ĐÁNH GIÁ TRÁCH NHIỆM BAN CÁN SỰ LỚP'],
    [`Lớp: ${user.className} | Sĩ số: ${votes.length}/${students.length} | Tỷ lệ đồng ý: ${agreePercentage}% | Điểm tự chấm: ${totalScore}/100đ`],
    [],
    ['STT', 'Mã SV', 'Họ và tên sinh viên', 'Đồng ý (X)', 'Không Đ/Ý (X)', 'Ý kiến / Ghi chú'],
  ];

  votes.forEach((v, idx) => {
    rows.push([
      idx + 1,
      v.studentMssv,
      v.studentName,
      v.agree ? 'X' : '',
      !v.agree ? 'X' : '',
      v.comment || ''
    ]);
  });

  rows.push(
    [],
    ['TỔNG HỢP BIỂU QUYẾT', '', `Đồng ý: ${agreeCount}/${votes.length} (${agreePercentage}%)`, '', `Không đồng ý: ${votes.length - agreeCount}`, ''],
    [],
    ['THƯ KÝ CUỘC HỌP', 'CHỦ TRÌ CUỘC HỌP (BÍ THƯ)', 'LỚP TRƯỞNG'],
    ['(Ký và ghi rõ họ tên)', '(Ký và ghi rõ họ tên)', '(Ký xác nhận)'],
    ['Trần Thị Mai Anh', 'Lê Minh Tuấn', user.fullName]
  );

  const ws = xlsxLib.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 40 }
  ];

  // Apply Times New Roman 13pt and administrative styles
  applyAdministrativeExcelStyles(ws, xlsxLib);

  const wb = xlsxLib.utils.book_new();
  xlsxLib.utils.book_append_sheet(wb, ws, 'Bien_Ban_Hop_Lop');
  const baseName = `Bien_Ban_Hop_Lop_Danh_Gia_Lop_Truong_${user.className}`;
  xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
}

/* ========================================================================= */
/* 4. MẪU 2: HỒ SƠ ĐẠI HỘI CHI ĐOÀN (DOC 1 - 6)                              */
/* ========================================================================= */

// DOCX Generation for Mẫu 2
export async function exportCongressDocx(
  docId: number,
  data: CongressMetadata,
  user: UserProfile,
  savedSignature: string | null
): Promise<void> {
  const docx = getDocxLib();

  const {
    Document,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    Packer,
    ImageRun,
    UnderlineType
  } = docx;

  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin
  };

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ', font: TNR_FONT, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CHI ĐOÀN ${data.tenChiDoan.toUpperCase()}`, font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '————————————', font: TNR_FONT, size: 20 })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: TNR_FONT, bold: true, size: 22 })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Độc lập – Tự do – Hạnh phúc',
                    font: TNR_FONT,
                    bold: true,
                    size: 24,
                    underline: { type: UnderlineType.SINGLE }
                  })
                ]
              }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: 'Hà Nội, ngày 26 tháng 10 năm 2024', font: TNR_FONT, italics: true, size: 20 })] })
            ]
          })
        ]
      })
    ]
  });

  let docChildren: any[] = [headerTable, new Paragraph({ spacing: { before: 180 } })];
  let docFileName = `Ho_So_Dai_Hoi_${docId}.docx`;

  if (docId === 1) {
    // 1. BÁO CÁO CÔNG TÁC
    docFileName = `1_Bao_Cao_Cong_Tac_Chi_Doan_${data.tenChiDoan}.docx`;
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'BÁO CÁO TỔNG KẾT CÔNG TÁC ĐOÀN VÀ PHONG TRÀO THANH NIÊN', font: TNR_FONT, bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: `NHIỆM KỲ VỪA QUA VÀ PHƯƠNG HƯỚNG NHIỆM KỲ ${data.nhiemKy}`, font: TNR_FONT, bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: 'PHẦN THỨ NHẤT: BÁO CÁO TỔNG KẾT NHIỆM KỲ VỪA QUA', font: TNR_FONT, bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: `Được sự chỉ đạo trực tiếp của Ban Thường vụ Đoàn trường, Liên chi đoàn ${data.khoa} và Ban Cố vấn học tập, Chi đoàn ${data.tenChiDoan} với tổng số ${data.tongSoDoanVien} đoàn viên đã nỗ lực hoàn thành xuất sắc các mặt công tác:\n` +
              '1. Công tác giáo dục chính trị, tư tưởng: 100% đoàn viên tham gia đầy đủ các đợt học tập Nghị quyết của Đảng, Đoàn; tham gia tuần sinh hoạt công dân sinh viên đầu khóa và chấp hành nghiêm kỷ cương giảng đường.\n' +
              '2. Phong trào học tập và Nghiên cứu khoa học: Đạt tỷ lệ chuyên cần trên 95%, không có trường hợp bị cảnh báo học vụ. Hơn 3 nhóm sinh viên tham gia báo cáo công trình NCKH cấp Khoa.\n' +
              '3. Phong trào Thanh niên tình nguyện & Văn thể mỹ: Tham gia tích cực Ngày hội việc làm ULIS Job Fair, Ngày hội Chào tân sinh viên, các câu lạc bộ ngoại ngữ và phong trào hiến máu nhân đạo.',
            font: TNR_FONT,
            size: 24
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: `PHẦN THỨ HAI: PHƯƠNG HƯỚNG NHIỆM KỲ ${data.nhiemKy}`, font: TNR_FONT, bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 40, after: 120 },
        children: [
          new TextRun({
            text: '1. 100% đoàn viên đạt kết quả rèn luyện từ loại Khá trở lên (trong đó trên 75% đạt Tốt và Xuất sắc).\n' +
              '2. Tối thiểu 05 đoàn viên đăng ký và đạt danh hiệu "Sinh viên 5 Tốt" cấp Trường.\n' +
              '3. Phối hợp cùng Ban cán sự lớp duy trì sĩ số và đảm bảo 100% sinh viên đủ điều kiện dự thi các môn học phần.',
            font: TNR_FONT,
            size: 24
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200 },
        children: [
          new TextRun({ text: 'TM. BAN CHẤP HÀNH CHI ĐOÀN\n', font: TNR_FONT, bold: true, size: 24 }),
          new TextRun({ text: 'Bí thư Chi đoàn\n\n\n\n', font: TNR_FONT, italics: true, size: 20 }),
          new TextRun({ text: data.phanCongNhiemVu?.biThu || 'Lê Minh Tuấn', font: TNR_FONT, bold: true, size: 24 })
        ]
      })
    );
  } else if (docId === 2) {
    // 2. BIÊN BẢN ĐẠI HỘI
    docFileName = `2_Bien_Ban_Dai_Hoi_Chi_Doan_${data.tenChiDoan}.docx`;
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'BIÊN BẢN ĐẠI HỘI CHI ĐOÀN', font: TNR_FONT, bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: `Nhiệm kỳ ${data.nhiemKy}`, font: TNR_FONT, italics: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: `Vào hồi ${data.thoiGian}, tại ${data.diaDiem}, Chi đoàn ${data.tenChiDoan} thuộc Đoàn TNCS Hồ Chí Minh Trường ĐH Ngoại ngữ - ĐHQGHN đã tiến hành tổ chức Đại hội Chi đoàn nhiệm kỳ ${data.nhiemKy}.\n\n` +
              `1. Thành phần tham dự:\n` +
              `• Tổng số đoàn viên được triệu tập: ${data.tongSoDoanVien} đ/c.\n` +
              `• Có mặt: ${data.soDoanVienCoMat} đ/c. Vắng mặt: ${data.tongSoDoanVien - data.soDoanVienCoMat} đ/c (có lý do chính đáng).\n` +
              `• Đại biểu khách mời: ${data.daiBieuKhachMoi}.\n\n` +
              `2. Đoàn Chủ tịch Đại hội: ${data.doanChuTich.join('; ')}.\n` +
              `3. Thư ký Đại hội: ${data.thuKy.join('; ')}.\n\n` +
              `4. Tiến trình làm việc:\n` +
              `Đại hội đã thảo luận và nhất trí thông qua Báo cáo tổng kết công tác nhiệm kỳ vừa qua và Phương hướng nhiệm kỳ ${data.nhiemKy} với tỷ lệ biểu quyết 100%. Tiếp đó, Đại hội đã tiến hành bỏ phiếu bầu Ban Chấp hành Chi đoàn nhiệm kỳ mới theo đúng quy chế bầu cử trong Đoàn.`,
            font: TNR_FONT,
            size: 24
          })
        ]
      }),
      new Paragraph({ spacing: { before: 240 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'THƯ KÝ ĐẠI HỘI', font: TNR_FONT, bold: true, size: 24 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.thuKy[0] || 'Trần Thị Mai Anh', font: TNR_FONT, bold: true, size: 24 })] })
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'THAY MẶT ĐOÀN CHỦ TỊCH', font: TNR_FONT, bold: true, size: 24 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.doanChuTich[0] || 'Lê Minh Tuấn', font: TNR_FONT, bold: true, size: 24 })] })
                ]
              })
            ]
          })
        ]
      })
    );
  } else if (docId === 3) {
    // 3. BIÊN BẢN KIỂM PHIẾU
    docFileName = `3_Bien_Ban_Kiem_Phieu_BCH_${data.tenChiDoan}.docx`;
    const voteRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Họ và tên ứng cử viên', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số phiếu đồng ý', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tỷ lệ (%)', font: TNR_FONT, bold: true, size: 24 })] })] })
        ]
      })
    ];

    data.danhSachUngVien.forEach((uv, idx) => {
      const nameOnly = uv.split('(')[0].trim();
      const votesCount = data.ketQuaKiemPhieu?.votes[nameOnly] || (idx < data.soLuongBau ? 26 : 2);
      const pct = Math.round((votesCount / (data.ketQuaKiemPhieu?.hopLe || 27)) * 100);
      const isElected = idx < data.soLuongBau;

      voteRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, font: TNR_FONT, size: 24 })] })] }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: uv, font: TNR_FONT, bold: true, size: 24 }),
                    new TextRun({ text: isElected ? '  (Trúng cử)' : '', font: TNR_FONT, bold: true, size: 22 })
                  ]
                })
              ]
            }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${votesCount}/${data.ketQuaKiemPhieu?.hopLe || 27}`, font: TNR_FONT, bold: true, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%`, font: TNR_FONT, size: 24 })] })] })
          ]
        })
      );
    });

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'BIÊN BẢN KIỂM PHIẾU BẦU BAN CHẤP HÀNH CHI ĐOÀN', font: TNR_FONT, bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: `Nhiệm kỳ ${data.nhiemKy}`, font: TNR_FONT, italics: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: `Ban Kiểm phiếu được Đại hội bầu gồm các đồng chí: ${data.banKiemPhieu.join('; ')}.\n\n` +
              `• Tổng số phiếu phát ra: ${data.ketQuaKiemPhieu?.phatRa} phiếu.\n` +
              `• Tổng số phiếu thu về: ${data.ketQuaKiemPhieu?.thuVao} phiếu.\n` +
              `• Số phiếu hợp lệ: ${data.ketQuaKiemPhieu?.hopLe} phiếu.\n` +
              `• Số phiếu không hợp lệ: ${data.ketQuaKiemPhieu?.khongHopLe} phiếu.\n\n` +
              'Kết quả kiểm phiếu cụ thể như sau:',
            font: TNR_FONT,
            size: 24
          })
        ]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: voteRows
      }),
      new Paragraph({ spacing: { before: 240 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'THAY MẶT ĐOÀN CHỦ TỊCH', font: TNR_FONT, bold: true, size: 24 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.doanChuTich[0] || 'Lê Minh Tuấn', font: TNR_FONT, bold: true, size: 24 })] })
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TM. BAN KIỂM PHIẾU', font: TNR_FONT, bold: true, size: 24 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Trưởng ban (Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.banKiemPhieu[0]?.split('(')[0] || 'Vũ Quốc Bảo', font: TNR_FONT, bold: true, size: 24 })] })
                ]
              })
            ]
          })
        ]
      })
    );
  } else if (docId === 4) {
    // 4. BIÊN BẢN PHÂN CÔNG NHIỆM VỤ
    docFileName = `4_Bien_Ban_Phan_Cong_Nhiem_Vu_BCH_${data.tenChiDoan}.docx`;
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'BIÊN BẢN HỌP PHÂN CÔNG NHIỆM VỤ BAN CHẤP HÀNH', font: TNR_FONT, bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: `Nhiệm kỳ ${data.nhiemKy}`, font: TNR_FONT, italics: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: `Ngay sau khi Đại hội kết thúc, Ban Chấp hành Chi đoàn nhiệm kỳ ${data.nhiemKy} đã tiến hành phiên họp thứ nhất để bầu các chức danh chủ chốt và phân công nhiệm vụ cụ thể như sau:\n\n` +
              `1. Bí thư Chi đoàn: Đ/c ${data.phanCongNhiemVu?.biThu} - Phụ trách chung công tác Chi đoàn và chỉ đạo toàn diện các hoạt động.\n` +
              `2. Phó Bí thư Chi đoàn: Đ/c ${data.phanCongNhiemVu?.phoBiThu} - Phụ trách công tác Đoàn vụ, hồ sơ sổ sách đoàn viên và công tác thi đua.\n` +
              `3. Các Ủy viên BCH: ${data.phanCongNhiemVu?.uyVien.join('; ')} - Phụ trách phong trào học tập, văn thể mỹ và phối hợp cùng Ban cán sự lớp.`,
            font: TNR_FONT,
            size: 24
          })
        ]
      }),
      new Paragraph({ spacing: { before: 240 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PHÓ BÍ THƯ CHI ĐOÀN', font: TNR_FONT, bold: true, size: 24 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.phanCongNhiemVu?.phoBiThu || 'Phạm Thu Trang', font: TNR_FONT, bold: true, size: 24 })] })
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BÍ THƯ CHI ĐOÀN', font: TNR_FONT, bold: true, size: 24 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 }, children: [new TextRun({ text: '', font: TNR_FONT })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.phanCongNhiemVu?.biThu || 'Lê Minh Tuấn', font: TNR_FONT, bold: true, size: 24 })] })
                ]
              })
            ]
          })
        ]
      })
    );
  } else if (docId === 5) {
    // 5. PHIẾU BẦU BCH - Trang trọng với viền đôi
    docFileName = `5_Mau_Phieu_Bau_BCH_${data.tenChiDoan}.docx`;
    const ballotRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Họ và tên ứng cử viên', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đồng ý (1)', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đồng ý (2)', font: TNR_FONT, bold: true, size: 24 })] })] })
        ]
      })
    ];

    data.danhSachUngVien.forEach((uv, idx) => {
      ballotRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, font: TNR_FONT, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: uv, font: TNR_FONT, bold: true, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[     ]', font: TNR_FONT, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[     ]', font: TNR_FONT, size: 24 })] })] })
          ]
        })
      );
    });

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'PHIẾU BẦU BAN CHẤP HÀNH CHI ĐOÀN', font: TNR_FONT, bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [new TextRun({ text: `(Nhiệm kỳ ${data.nhiemKy} - Bầu ${data.soLuongBau} đồng chí)`, font: TNR_FONT, italics: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 40, after: 80 },
        children: [
          new TextRun({
            text: `* Hướng dẫn gạch phiếu: Đại biểu tín nhiệm ai thì đánh dấu (X) vào cột "Đồng ý", không tín nhiệm thì đánh dấu (X) vào cột "Không đồng ý". Phiếu bầu quá ${data.soLuongBau} đồng chí là phiếu không hợp lệ.`,
            font: TNR_FONT,
            italics: true,
            size: 22
          })
        ]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: ballotRows
      })
    );
  } else if (docId === 6) {
    // 6. PHIẾU BẦU BÍ THƯ / PHÓ BÍ THƯ - Trang trọng với viền đôi
    docFileName = `6_Mau_Phieu_Bau_Bi_Thu_Pho_Bi_Thu_${data.tenChiDoan}.docx`;
    const secRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ứng cử viên Bí thư', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đồng ý (1)', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đồng ý (2)', font: TNR_FONT, bold: true, size: 24 })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', font: TNR_FONT, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: data.phanCongNhiemVu?.biThu || 'Lê Minh Tuấn', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[     ]', font: TNR_FONT, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[     ]', font: TNR_FONT, size: 24 })] })] })
        ]
      })
    ];

    const depRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ứng cử viên Phó Bí thư', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đồng ý (1)', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đồng ý (2)', font: TNR_FONT, bold: true, size: 24 })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', font: TNR_FONT, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: data.phanCongNhiemVu?.phoBiThu || 'Phạm Thu Trang', font: TNR_FONT, bold: true, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[     ]', font: TNR_FONT, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[     ]', font: TNR_FONT, size: 24 })] })] })
        ]
      })
    ];

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'PHIẾU BẦU BÍ THƯ VÀ PHÓ BÍ THƯ CHI ĐOÀN', font: TNR_FONT, bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [new TextRun({ text: `(Phiên họp thứ nhất BCH Chi đoàn nhiệm kỳ ${data.nhiemKy})`, font: TNR_FONT, italics: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { before: 60, after: 40 },
        children: [new TextRun({ text: 'I. BẦU CHỨC DANH BÍ THƯ CHI ĐOÀN (Bầu 01 đ/c):', font: TNR_FONT, bold: true, size: 24 })]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: secRows
      }),
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [new TextRun({ text: 'II. BẦU CHỨC DANH PHÓ BÍ THƯ CHI ĐOÀN (Bầu 01 đ/c):', font: TNR_FONT, bold: true, size: 24 })]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: depRows
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: STANDARD_A4_PAGE_PROPERTIES,
        children: docChildren
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerFileSave(blob, docFileName);
}

// XLSX / CSV Generation for Mẫu 2 (Congress Documents)
export function exportCongressDocXlsx(
  docId: number,
  data: CongressMetadata,
  user: UserProfile,
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const xlsxLib = getXlsxEngine();
  const wb = xlsxLib.utils.book_new();

  if (docId === 3) {
    // 3. Biên bản kiểm phiếu
    const rows: any[][] = [
      ['ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      [`CHI ĐOÀN ${data.tenChiDoan.toUpperCase()}`, '', 'Độc lập – Tự do – Hạnh phúc'],
      ['', '', 'Hà Nội, ngày 26 tháng 10 năm 2024'],
      [],
      ['BIÊN BẢN KIỂM PHIẾU BẦU BAN CHẤP HÀNH CHI ĐOÀN'],
      [`Nhiệm kỳ: ${data.nhiemKy} | Bầu: ${data.soLuongBau} đồng chí`],
      [],
      ['Ban kiểm phiếu:', data.banKiemPhieu.join('; ')],
      ['Số liệu kiểm phiếu:', `Phát ra: ${data.ketQuaKiemPhieu?.phatRa} | Thu vào: ${data.ketQuaKiemPhieu?.thuVao} | Hợp lệ: ${data.ketQuaKiemPhieu?.hopLe} | Không hợp lệ: ${data.ketQuaKiemPhieu?.khongHopLe}`],
      [],
      ['STT', 'Họ và tên ứng cử viên', 'Số phiếu đồng ý', 'Tỷ lệ (%)', 'Kết quả'],
    ];

    data.danhSachUngVien.forEach((uv, idx) => {
      const nameOnly = uv.split('(')[0].trim();
      const votesCount = data.ketQuaKiemPhieu?.votes[nameOnly] || (idx < data.soLuongBau ? 26 : 2);
      const pct = Math.round((votesCount / (data.ketQuaKiemPhieu?.hopLe || 27)) * 100);
      const isElected = idx < data.soLuongBau;
      rows.push([
        idx + 1,
        uv,
        `${votesCount}/${data.ketQuaKiemPhieu?.hopLe || 27}`,
        `${pct}%`,
        isElected ? 'Trúng cử' : 'Không trúng cử'
      ]);
    });

    rows.push(
      [],
      ['THAY MẶT ĐOÀN CHỦ TỊCH', '', 'TM. BAN KIỂM PHIẾU'],
      ['(Ký và ghi rõ họ tên)', '', 'Trưởng ban (Ký và ghi rõ họ tên)'],
      [data.doanChuTich[0] || 'Lê Minh Tuấn', '', data.banKiemPhieu[0]?.split('(')[0] || 'Vũ Quốc Bảo']
    );

    const ws = xlsxLib.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 18 }];
    applyAdministrativeExcelStyles(ws, xlsxLib);
    xlsxLib.utils.book_append_sheet(wb, ws, 'Bien_Ban_Kiem_Phieu');
    const baseName = `3_Bien_Ban_Kiem_Phieu_BCH_${data.tenChiDoan}`;
    xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
  } else if (docId === 5) {
    // 5. Phiếu bầu BCH
    const rows: any[][] = [
      ['ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ', '', 'PHIẾU BẦU BAN CHẤP HÀNH CHI ĐOÀN'],
      [`CHI ĐOÀN ${data.tenChiDoan.toUpperCase()}`, '', `Nhiệm kỳ ${data.nhiemKy} - Bầu ${data.soLuongBau} đồng chí`],
      [],
      ['STT', 'Họ và tên ứng cử viên', 'Đồng ý (1)', 'Không đồng ý (2)'],
    ];

    data.danhSachUngVien.forEach((uv, idx) => {
      rows.push([idx + 1, uv, '[   ]', '[   ]']);
    });

    const ws = xlsxLib.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 18 }];
    applyAdministrativeExcelStyles(ws, xlsxLib);
    xlsxLib.utils.book_append_sheet(wb, ws, 'Phieu_Bau_BCH');
    const baseName = `5_Mau_Phieu_Bau_BCH_${data.tenChiDoan}`;
    xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
  } else if (docId === 6) {
    // 6. Phiếu bầu Bí thư / Phó Bí thư
    const rows: any[][] = [
      ['ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ', '', 'PHIẾU BẦU BÍ THƯ & PHÓ BÍ THƯ'],
      [`CHI ĐOÀN ${data.tenChiDoan.toUpperCase()}`, '', `Nhiệm kỳ ${data.nhiemKy}`],
      [],
      ['I. BẦU CHỨC DANH BÍ THƯ CHI ĐOÀN (Bầu 01 đ/c)'],
      ['STT', 'Ứng cử viên Bí thư', 'Đồng ý (1)', 'Không đồng ý (2)'],
      [1, data.phanCongNhiemVu?.biThu || 'Lê Minh Tuấn', '[   ]', '[   ]'],
      [],
      ['II. BẦU CHỨC DANH PHÓ BÍ THƯ CHI ĐOÀN (Bầu 01 đ/c)'],
      ['STT', 'Ứng cử viên Phó Bí thư', 'Đồng ý (1)', 'Không đồng ý (2)'],
      [1, data.phanCongNhiemVu?.phoBiThu || 'Phạm Thu Trang', '[   ]', '[   ]'],
    ];

    const ws = xlsxLib.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 18 }];
    applyAdministrativeExcelStyles(ws, xlsxLib);
    xlsxLib.utils.book_append_sheet(wb, ws, 'Phieu_Bau_Bi_Thu');
    const baseName = `6_Mau_Phieu_Bau_Bi_Thu_Pho_Bi_Thu_${data.tenChiDoan}`;
    xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
  } else {
    // Docs 1, 2, 4: Summary sheets
    const rows: any[][] = [
      ['ĐOÀN TNCS HỒ CHÍ MINH TRƯỜNG ĐH NGOẠI NGỮ', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      [`CHI ĐOÀN ${data.tenChiDoan.toUpperCase()}`, '', 'Độc lập – Tự do – Hạnh phúc'],
      [],
      [`HỒ SƠ ĐẠI HỘI CHI ĐOÀN - VĂN BẢN SỐ ${docId}`],
      [`Chi đoàn: ${data.tenChiDoan} | Khoa: ${data.khoa} | Nhiệm kỳ: ${data.nhiemKy}`],
      [`Thời gian: ${data.thoiGian} | Địa điểm: ${data.diaDiem}`],
      [`Tổng số đoàn viên: ${data.tongSoDoanVien} | Có mặt: ${data.soDoanVienCoMat}`],
      [`Đoàn Chủ tịch: ${data.doanChuTich.join('; ')}`],
      [`Thư ký Đại hội: ${data.thuKy.join('; ')}`],
      [`Bí thư được phân công: ${data.phanCongNhiemVu?.biThu}`],
      [`Phó Bí thư: ${data.phanCongNhiemVu?.phoBiThu}`],
      [`Các Ủy viên: ${data.phanCongNhiemVu?.uyVien.join('; ')}`]
    ];

    const ws = xlsxLib.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 45 }];
    applyAdministrativeExcelStyles(ws, xlsxLib);
    xlsxLib.utils.book_append_sheet(wb, ws, `Van_Ban_${docId}`);
    const baseName = `Ho_So_Dai_Hoi_${docId}_${data.tenChiDoan}`;
    xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
  }
}

/* ========================================================================= */
/* 5. MẪU BẢNG ĐIỂM & DANH SÁCH KẾT QUẢ MÔN HỌC CHUẨN ULIS                    */
/* ========================================================================= */

export function exportSubjectGradesXlsx(
  data: UlisSubjectResult,
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const xlsxLib = getXlsxEngine();
  const wb = xlsxLib.utils.book_new();

  const rows: any[][] = [
    ['ĐẠI HỌC QUỐC GIA HÀ NỘI', '', '', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', '', '', '', '', '', 'Độc lập – Tự do – Hạnh phúc'],
    ['PHÒNG ĐÀO TẠO', '', '', '', '', '', 'Hà Nội, ngày 28 tháng 10 năm 2024'],
    [],
    ['DANH SÁCH KẾT QUẢ MÔN HỌC'],
    [`HỌC KỲ ${data.semester.toUpperCase()} – NĂM HỌC ${data.academicYear}`],
    [],
    [`Môn học: ${data.subjectName}`, '', `Mã môn học: ${data.subjectCode}`, '', `Khoa: ${data.department}`, '', `Lớp: ${data.className}`],
    [],
    ['STT', 'MÃ SỐ SV', 'HỌ VÀ TÊN', 'NGÀY SINH', 'LỚP', 'MÃ MÔN HỌC', 'ĐIỂM TP1 (10%)', 'ĐIỂM TP2 (30%)', 'ĐIỂM MÔN HỌC (BẰNG SỐ)', 'GHI CHÚ']
  ];

  data.grades.forEach((g, idx) => {
    rows.push([
      idx + 1,
      g.mssv,
      g.fullName,
      g.birthDate,
      g.className,
      g.subjectCode,
      g.tp1,
      g.tp2,
      g.finalScore,
      g.note || ''
    ]);
  });

  rows.push(
    [],
    [`Danh sách kết quả này có: ${data.grades.length} sinh viên.`],
    [],
    ['NGƯỜI VÀO ĐIỂM', '', 'NGƯỜI KIỂM TRA', '', '', 'TRƯỞNG BỘ MÔN', '', '', 'TRƯỞNG KHOA', ''],
    ['(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', ''],
    [],
    [],
    [data.graderName || 'Nguyễn Hoàng Anh', '', data.checkerName || 'ThS. Lê Thị Thu Hà', '', '', data.headOfDepartment || 'TS. Vũ Đình Hải', '', '', data.deanName || 'PGS.TS. Trần Thị Hạnh', '']
  );

  const ws = xlsxLib.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 20 }
  ];
  applyAdministrativeExcelStyles(ws, xlsxLib);

  xlsxLib.utils.book_append_sheet(wb, ws, 'Ket_Qua_Mon_Hoc');
  const baseName = `Danh_Sach_Ket_Qua_Mon_Hoc_${data.subjectCode}_${data.className}_ULIS`;
  xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
}

export async function exportSubjectGradesDocx(data: UlisSubjectResult): Promise<void> {
  const docx = getDocxLib();
  const {
    Document,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    Packer,
    UnderlineType
  } = docx;

  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin
  };

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PHÒNG ĐÀO TẠO', font: TNR_FONT, bold: true, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '____________________', font: TNR_FONT, size: 20 })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Độc lập – Tự do – Hạnh phúc', font: TNR_FONT, bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 120 }, children: [new TextRun({ text: 'Hà Nội, ngày 28 tháng 10 năm 2024', font: TNR_FONT, italics: true, size: 22 })] })
            ]
          })
        ]
      })
    ]
  });

  const gradeTableRows: any[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MÃ SỐ SV', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'HỌ VÀ TÊN', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGÀY SINH', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LỚP', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MÃ MÔN', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TP1 (10%)', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TP2 (30%)', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ĐIỂM HP', font: TNR_FONT, bold: true, size: 20 })] })] })
      ]
    })
  ];

  data.grades.forEach((g) => {
    gradeTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(g.stt), font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: g.mssv, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: g.fullName, font: TNR_FONT, bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: g.birthDate, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: g.className, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: g.subjectCode, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(g.tp1), font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(g.tp2), font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(g.finalScore), font: TNR_FONT, bold: true, size: 20 })] })] })
        ]
      })
    );
  });

  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI VÀO ĐIỂM', font: TNR_FONT, bold: true, size: 22 })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }), new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.graderName || 'Nguyễn Hoàng Anh', font: TNR_FONT, bold: true, size: 22 })] })] }),
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI KIỂM TRA', font: TNR_FONT, bold: true, size: 22 })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }), new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.checkerName || 'ThS. Lê Thị Thu Hà', font: TNR_FONT, bold: true, size: 22 })] })] }),
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG BỘ MÔN', font: TNR_FONT, bold: true, size: 22 })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }), new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.headOfDepartment || 'TS. Vũ Đình Hải', font: TNR_FONT, bold: true, size: 22 })] })] }),
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG KHOA', font: TNR_FONT, bold: true, size: 22 })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }), new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.deanName || 'PGS.TS. Trần Thị Hạnh', font: TNR_FONT, bold: true, size: 22 })] })] })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: STANDARD_A4_PAGE_PROPERTIES,
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 240, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DANH SÁCH KẾT QUẢ MÔN HỌC', font: TNR_FONT, bold: true, size: 28 })] }),
          new Paragraph({ spacing: { after: 180 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Học kỳ ${data.semester.toUpperCase()} – Năm học ${data.academicYear}`, font: TNR_FONT, italics: true, size: 24 })] }),
          new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `Môn học: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${data.subjectName}    `, font: TNR_FONT, size: 22 }), new TextRun({ text: `Mã môn: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${data.subjectCode}    `, font: TNR_FONT, size: 22 }), new TextRun({ text: `Khoa: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${data.department}    `, font: TNR_FONT, size: 22 }), new TextRun({ text: `Lớp: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${data.className}`, font: TNR_FONT, size: 22 })] }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders, rows: gradeTableRows }),
          new Paragraph({ spacing: { before: 160, after: 240 }, children: [new TextRun({ text: `Danh sách kết quả này có: ${data.grades.length} sinh viên.`, font: TNR_FONT, italics: true, bold: true, size: 22 })] }),
          signaturesTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerFileSave(blob, `Danh_Sach_Ket_Qua_Mon_Hoc_${data.subjectCode}_${data.className}_ULIS.docx`);
}

/* ========================================================================= */
/* 6. MẪU DANH SÁCH LỚP SINH VIÊN CHUẨN ULIS                                */
/* ========================================================================= */

export function exportUlisOfficialRosterXlsx(
  students: Student[],
  user: UserProfile,
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const xlsxLib = getXlsxEngine();
  const wb = xlsxLib.utils.book_new();

  const rows: any[][] = [
    ['ĐẠI HỌC QUỐC GIA HÀ NỘI', '', '', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', '', '', '', '', '', 'Độc lập – Tự do – Hạnh phúc'],
    ['PHÒNG CHÍNH TRỊ VÀ CÔNG TÁC HSSV', '', '', '', '', '', 'Hà Nội, ngày 28 tháng 10 năm 2024'],
    [],
    ['DANH SÁCH LỚP SINH VIÊN'],
    ['HỌC KỲ I – NĂM HỌC 2024 - 2025'],
    [],
    [`Lớp: ${user.className}`, '', `Khoa: ${user.department}`, '', '', '', `Sĩ số: ${students.length} sinh viên`],
    [],
    ['STT', 'MÃ SỐ SV', 'HỌ VÀ TÊN', 'NGÀY SINH', 'GIỚI TÍNH', 'LỚP', 'SỐ ĐIỆN THOẠI', 'EMAIL VNU', 'CHỨC VỤ', 'GHI CHÚ']
  ];

  students.forEach((s, idx) => {
    rows.push([
      idx + 1,
      s.mssv,
      s.fullName,
      s.birthDate,
      s.gender,
      user.className,
      s.phone,
      s.email,
      s.role,
      s.note || ''
    ]);
  });

  rows.push(
    [],
    [`Danh sách này có: ${students.length} sinh viên.`],
    [],
    ['NGƯỜI LẬP DANH SÁCH', '', 'LỚP TRƯỞNG', '', 'CỐ VẤN HỌC TẬP', '', '', 'TRƯỞNG KHOA', ''],
    ['(Ký và ghi rõ họ tên)', '', '(Ký xác nhận)', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', ''],
    [],
    [],
    [user.fullName, '', user.fullName, '', 'ThS. Nguyễn Huyền Trang', '', '', 'PGS.TS. Trần Thị Hạnh', '']
  );

  const ws = xlsxLib.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
    { wch: 18 },
    { wch: 25 }
  ];
  applyAdministrativeExcelStyles(ws, xlsxLib);

  xlsxLib.utils.book_append_sheet(wb, ws, 'Danh_Sach_Lop');
  const baseName = `Danh_Sach_Lop_${user.className}_ULIS_Official`;
  xlsxLib.writeFile(wb, `${baseName}.${format}`, { bookType: format, cellStyles: true });
}

export async function exportUlisOfficialRosterDocx(
  students: Student[],
  user: UserProfile,
  savedSignature: string | null
): Promise<void> {
  const docx = getDocxLib();
  const {
    Document,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    Packer,
    ImageRun,
    UnderlineType
  } = docx;

  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = {
    top: borderThin,
    bottom: borderThin,
    left: borderThin,
    right: borderThin,
    insideHorizontal: borderThin,
    insideVertical: borderThin
  };

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC NGOẠI NGỮ', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PHÒNG CHÍNH TRỊ VÀ CÔNG TÁC HSSV', font: TNR_FONT, bold: true, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '____________________', font: TNR_FONT, size: 20 })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: TNR_FONT, bold: true, size: 24 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Độc lập – Tự do – Hạnh phúc', font: TNR_FONT, bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 120 }, children: [new TextRun({ text: 'Hà Nội, ngày 28 tháng 10 năm 2024', font: TNR_FONT, italics: true, size: 22 })] })
            ]
          })
        ]
      })
    ]
  });

  const rosterTableRows: any[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MÃ SỐ SV', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 24, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'HỌ VÀ TÊN', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGÀY SINH', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'GIỚI TÍNH', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SỐ ĐIỆN THOẠI', font: TNR_FONT, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CHỨC VỤ', font: TNR_FONT, bold: true, size: 20 })] })] })
      ]
    })
  ];

  students.forEach((s) => {
    rosterTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.stt), font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.mssv, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.fullName, font: TNR_FONT, bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.birthDate, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.gender, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.phone, font: TNR_FONT, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.role, font: TNR_FONT, size: 20 })] })] })
        ]
      })
    );
  });

  const monitorSigChildren: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LỚP TRƯỞNG', font: TNR_FONT, bold: true, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký xác nhận)', font: TNR_FONT, italics: true, size: 20 })] })
  ];

  if (savedSignature) {
    try {
      const sigBytes = base64ToUint8Array(savedSignature);
      monitorSigChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new ImageRun({
              data: sigBytes,
              transformation: { width: 130, height: 60 }
            })
          ]
        })
      );
    } catch {
      monitorSigChildren.push(new Paragraph({ spacing: { before: 800 }, children: [] }));
    }
  } else {
    monitorSigChildren.push(new Paragraph({ spacing: { before: 800 }, children: [] }));
  }
  monitorSigChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: user.fullName, font: TNR_FONT, bold: true, size: 22 })] }));

  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI LẬP DANH SÁCH', font: TNR_FONT, bold: true, size: 22 })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }), new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: user.fullName, font: TNR_FONT, bold: true, size: 22 })] })] }),
          new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: monitorSigChildren }),
          new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CỐ VẤN HỌC TẬP', font: TNR_FONT, bold: true, size: 22 })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', font: TNR_FONT, italics: true, size: 20 })] }), new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ThS. Nguyễn Huyền Trang', font: TNR_FONT, bold: true, size: 22 })] })] })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: STANDARD_A4_PAGE_PROPERTIES,
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 240, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DANH SÁCH LỚP SINH VIÊN', font: TNR_FONT, bold: true, size: 28 })] }),
          new Paragraph({ spacing: { after: 180 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Học kỳ I – Năm học 2024 - 2025', font: TNR_FONT, italics: true, size: 24 })] }),
          new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `Lớp: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${user.className}          `, font: TNR_FONT, size: 22 }), new TextRun({ text: `Khoa: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${user.department}          `, font: TNR_FONT, size: 22 }), new TextRun({ text: `Sĩ số: `, font: TNR_FONT, bold: true, size: 22 }), new TextRun({ text: `${students.length} sinh viên`, font: TNR_FONT, size: 22 })] }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders, rows: rosterTableRows }),
          new Paragraph({ spacing: { before: 160, after: 240 }, children: [new TextRun({ text: `Danh sách này có: ${students.length} sinh viên.`, font: TNR_FONT, italics: true, bold: true, size: 22 })] }),
          signaturesTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  triggerFileSave(blob, `Danh_Sach_Lop_${user.className}_ULIS_Official.docx`);
}
