/**
 * 总览 — 今日名单 CSV / PDF 导出
 */

import React, { useRef, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { staffDownloadTodayCsv, staffFetchTodayExportData } from '../api/admin';
import type { TodayExportRow } from '../types';

interface AdminDashboardExportsProps {
  onMessage: (msg: string) => void;
}

export const AdminDashboardExports: React.FC<AdminDashboardExportsProps> = ({
  onMessage,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [preview, setPreview] = useState<{
    date: string;
    clinicName: string;
    rows: TodayExportRow[];
  } | null>(null);

  const handleCsv = async () => {
    setExportingCsv(true);
    onMessage('');
    try {
      await staffDownloadTodayCsv();
      onMessage('CSV 已下载');
    } catch (e) {
      onMessage(e instanceof Error ? e.message : 'CSV 下载失败');
    } finally {
      setExportingCsv(false);
    }
  };

  const handlePdf = async () => {
    setExportingPdf(true);
    onMessage('');
    try {
      const data = await staffFetchTodayExportData();
      setPreview(data);

      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 120)));

      const el = printRef.current;
      if (!el) throw new Error('无法生成 PDF');

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = margin;

      pdf.addImage(img, 'PNG', margin, position, imgW, imgH);
      heightLeft -= pageH - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgH - heightLeft);
        pdf.addImage(img, 'PNG', margin, position, imgW, imgH);
        heightLeft -= pageH - margin * 2;
      }

      pdf.save(`fht-${data.date}.pdf`);
      onMessage('PDF 已下载（含中文姓名）');
      setPreview(null);
    } catch (e) {
      onMessage(e instanceof Error ? e.message : 'PDF 生成失败');
      setPreview(null);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <h3 className="font-serif font-bold text-stone-800 text-sm mb-1">导出今日名单</h3>
      <p className="text-[11px] text-stone-500 mb-3">
        含完整姓名与手机号，仅供店员内部使用，请勿外传。
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCsv}
          disabled={exportingCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          <Download size={14} />
          {exportingCsv ? '下载中…' : '下载 CSV'}
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={exportingPdf}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#10143A] text-[#FDD772] text-xs font-semibold disabled:opacity-50"
        >
          <FileText size={14} />
          {exportingPdf ? '生成中…' : '下载 PDF'}
        </button>
      </div>

      {preview && (
        <div
          ref={printRef}
          className="fixed left-[-9999px] top-0 w-[900px] p-6 bg-white text-stone-900 text-sm"
          aria-hidden
        >
          <h1 className="text-lg font-bold mb-1">{preview.clinicName}</h1>
          <p className="text-stone-600 mb-4">今日名单 · {preview.date}</p>
          {preview.rows.length === 0 ? (
            <p>今日暂无记录</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100">
                  <th className="border border-stone-300 px-2 py-1 text-left">排队号</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">时段</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">姓名</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">手机</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">性别</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">预约</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">排队</th>
                  <th className="border border-stone-300 px-2 py-1 text-left">来源</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-stone-200 px-2 py-1">{r.queueCode}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.timeSlot}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.patientName}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.patientPhone}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.gender}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.status}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.queueStatus}</td>
                    <td className="border border-stone-200 px-2 py-1">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
