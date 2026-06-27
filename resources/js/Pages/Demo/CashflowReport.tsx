import React from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';

export default function CashflowReport() {
    const fiscalMode = useDemoFiscalMode();

    // Dummy cashflow entries
    const cashflows = fiscalMode === 'ppn'
        ? [
              { date: '2026-06-25', ref: 'KW-PPN-001', desc: 'Pelunasan INV-PPN-001 - PT. Gojek Tokopedia', type: 'inflow', amount: 'IDR 11.100.000' },
              { date: '2026-06-24', ref: 'PO-PPN-001', desc: 'Sewa Lahan Billboard Sudirman - PT. Megah Billboard Jaya', type: 'outflow', amount: 'IDR 3.330.000' },
              { date: '2026-06-18', ref: 'KW-PPN-002', desc: 'Pelunasan INV-PPN-004 - Shopee Indonesia', type: 'inflow', amount: 'IDR 16.650.000' },
              { date: '2026-06-15', ref: 'PO-PPN-003', desc: 'Cetak Spanduk Banner - CV. Media Ad Perkasa', type: 'outflow', amount: 'IDR 1.200.000' }
          ]
        : [
              { date: '2026-06-25', ref: 'KW-NP-001', desc: 'Pelunasan INV-NP-001 (Non-PPN) - Shopee Indonesia', type: 'inflow', amount: 'IDR 10.000.000' },
              { date: '2026-06-24', ref: 'PO-NP-001', desc: 'Jasa Konstruksi Billboard Kayu - CV. Media Ad Perkasa', type: 'outflow', amount: 'IDR 1.200.000' },
              { date: '2026-06-18', ref: 'KW-NP-002', desc: 'Pelunasan INV-NP-003 (Non-PPN) - PT. Citra Digital', type: 'inflow', amount: 'IDR 15.000.000' },
              { date: '2026-06-15', ref: 'PO-NP-002', desc: 'Cetak Banner MMT Baliho Super - PT. Promosi Outdoor Kreasindo', type: 'outflow', amount: 'IDR 3.000.000' }
          ];

    // Compute sums
    const totalInflow = fiscalMode === 'ppn' ? 27750000 : 25000000;
    const totalOutflow = fiscalMode === 'ppn' ? 4530000 : 4200000;
    const netCashflow = totalInflow - totalOutflow;

    return (
        <DemoLayout
            activePage="cashflow"
            title="Laporan Arus Kas (Cashflow)"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Accounting' }, { label: 'Cashflow' }]}
        >
            <div className="space-y-6">
                {/* Net Cash Position Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL UANG MASUK (INFLOW)</span>
                        <span className="text-xl font-bold text-emerald-600 font-mono block">IDR {totalInflow.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Dari pelunasan tagihan client</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL UANG KELUAR (OUTFLOW)</span>
                        <span className="text-xl font-bold text-rose-600 font-mono block">IDR {totalOutflow.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Dari realisasi pembayaran PO vendor</span>
                    </div>
                    <div className="bg-blue-600 p-6 rounded-2xl shadow-md space-y-1 text-white">
                        <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider block">NET CASH POSITION</span>
                        <span className="text-xl font-black font-mono block">IDR {netCashflow.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-blue-200 font-semibold block">Sisa dana bersih periode berjalan</span>
                    </div>
                </div>

                {/* Table Registry */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Buku Catatan Arus Kas</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Daftar mutasi debit dan kredit akun Kas / Bank</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Referensi</th>
                                    <th className="px-6 py-4">Keterangan Transaksi</th>
                                    <th className="px-6 py-4 text-right">Uang Masuk (+)</th>
                                    <th className="px-6 py-4 text-right">Uang Keluar (-)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {cashflows.map((cf, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 whitespace-nowrap">{cf.date}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">{cf.ref}</td>
                                        <td className="px-6 py-4 text-slate-800 font-semibold">{cf.desc}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                                            {cf.type === 'inflow' ? cf.amount : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                                            {cf.type === 'outflow' ? cf.amount : '—'}
                                        </td>
                                    </tr>
                                ))}

                                {/* Net Summary Footer */}
                                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                                    <td colSpan={3} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Total Mutasi Arus Kas</td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-600">IDR {totalInflow.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-600">IDR {totalOutflow.toLocaleString('id-ID')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DemoLayout>
    );
}
