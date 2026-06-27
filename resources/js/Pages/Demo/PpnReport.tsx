import React from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';

export default function PpnReport() {
    const fiscalMode = useDemoFiscalMode();

    // Dummy PPN details
    const ppnKeluaran = [
        { doc: 'INV-PPN-001', client: 'PT. Gojek Tokopedia', date: '2026-06-25', subtotal: 'IDR 10.000.000', rate: '11%', ppn: 'IDR 1.100.000' },
        { doc: 'INV-PPN-002', client: 'Traveloka Corp', date: '2026-06-22', subtotal: 'IDR 5.000.000', rate: '11%', ppn: 'IDR 550.000' },
        { doc: 'INV-PPN-004', client: 'Shopee Indonesia', date: '2026-06-18', subtotal: 'IDR 15.000.000', rate: '11%', ppn: 'IDR 1.650.000' }
    ];

    const ppnMasukan = [
        { doc: 'PO-PPN-001', vendor: 'PT. Megah Billboard Jaya', date: '2026-06-24', subtotal: 'IDR 3.000.000', rate: '11%', ppn: 'IDR 330.000' },
        { doc: 'PO-PPN-002', vendor: 'PT. Promosi Outdoor Kreasindo', date: '2026-06-20', subtotal: 'IDR 8.000.000', rate: '11%', ppn: 'IDR 880.000' }
    ];

    const totalKeluaran = 3300000;
    const totalMasukan = 1210000;
    const netPayable = totalKeluaran - totalMasukan;

    return (
        <DemoLayout
            activePage="ppn"
            title="Laporan PPN & Pajak"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Accounting' }, { label: 'Rekapitulasi PPN' }]}
        >
            {fiscalMode === 'ppn' ? (
                <div className="space-y-6">
                    {/* Tax Net Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL PPN KELUARAN</span>
                            <span className="text-xl font-bold text-slate-800 font-mono block">IDR {totalKeluaran.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">Dari penjualan/tagihan ke client</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL PPN MASUKAN</span>
                            <span className="text-xl font-bold text-slate-800 font-mono block">IDR {totalMasukan.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">Dari belanja/PO vendor PKP</span>
                        </div>
                        <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-2xl shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">PPN NET KURANG BAYAR</span>
                            <span className="text-xl font-black text-blue-700 font-mono block">IDR {netPayable.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] text-blue-500 font-bold block">Selisih yang harus disetorkan ke Kas Negara</span>
                        </div>
                    </div>

                    {/* Grouped Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* PPN Keluaran */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    Daftar Faktur PPN Keluaran (Penjualan)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/20">
                                            <th className="px-5 py-3">Doc</th>
                                            <th className="px-5 py-3">Client</th>
                                            <th className="px-5 py-3 text-right">Subtotal</th>
                                            <th className="px-5 py-3 text-right">PPN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                        {ppnKeluaran.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3 font-mono font-bold text-slate-900">{item.doc}</td>
                                                <td className="px-5 py-3 font-semibold text-slate-600">{item.client}</td>
                                                <td className="px-5 py-3 text-right font-mono text-slate-500">{item.subtotal}</td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{item.ppn}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* PPN Masukan */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Daftar Faktur PPN Masukan (Pembelian PKP)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/20">
                                            <th className="px-5 py-3">Doc</th>
                                            <th className="px-5 py-3">Vendor</th>
                                            <th className="px-5 py-3 text-right">Subtotal</th>
                                            <th className="px-5 py-3 text-right">PPN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                        {ppnMasukan.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3 font-mono font-bold text-slate-900">{item.doc}</td>
                                                <td className="px-5 py-3 font-semibold text-slate-600">{item.vendor}</td>
                                                <td className="px-5 py-3 text-right font-mono text-slate-500">{item.subtotal}</td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{item.ppn}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Non-PPN Placeholder Screen */
                <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-4 max-w-2xl mx-auto my-12">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Laporan PPN Dinonaktifkan</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md">
                        Aplikasi saat ini berjalan dalam **Mode Non-PPN (Silo Bebas Pajak)**. Semua pencatatan PPN Masukan dan PPN Keluaran disembunyikan.
                    </p>
                    <div className="pt-4">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Langkah Aktivasi:</span>
                        <span className="text-[11px] text-slate-500 mt-1 block">Silakan klik tombol **"Mode PPN"** di bagian atas sidebar kiri untuk membuka laporan rekonsiliasi PPN.</span>
                    </div>
                </div>
            )}
        </DemoLayout>
    );
}
