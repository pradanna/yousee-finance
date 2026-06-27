import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';
import StatusBadge from '@/Components/StatusBadge';

export default function InvoicePoList() {
    const fiscalMode = useDemoFiscalMode();
    const [activeTab, setActiveTab] = useState<'invoice' | 'po'>('invoice');

    // Dummy data based on fiscalMode
    const invoices = fiscalMode === 'ppn'
        ? [
              { id: 'INV-PPN-001', client: 'PT. Gojek Tokopedia', date: '2026-06-25', due: '2026-07-02', subtotal: 'IDR 10.000.000', ppn: 'IDR 1.100.000', total: 'IDR 11.100.000', status: 'paid' },
              { id: 'INV-PPN-002', client: 'Traveloka Corp', date: '2026-06-22', due: '2026-06-29', subtotal: 'IDR 5.000.000', ppn: 'IDR 550.000', total: 'IDR 5.550.000', status: 'issued' },
              { id: 'INV-PPN-003', client: 'Shopee Indonesia', date: '2026-06-12', due: '2026-06-19', subtotal: 'IDR 8.000.000', ppn: 'IDR 880.000', total: 'IDR 8.880.000', status: 'draft' }
          ]
        : [
              { id: 'INV-NP-001', client: 'Shopee Indonesia', date: '2026-06-25', due: '2026-07-02', subtotal: 'IDR 10.000.000', ppn: 'IDR 0', total: 'IDR 10.000.000', status: 'paid' },
              { id: 'INV-NP-002', client: 'PT. Citra Digital', date: '2026-06-22', due: '2026-06-29', subtotal: 'IDR 5.000.000', ppn: 'IDR 0', total: 'IDR 5.000.000', status: 'issued' },
              { id: 'INV-NP-003', client: 'PT. Gojek Tokopedia', date: '2026-06-18', due: '2026-06-25', subtotal: 'IDR 12.000.000', ppn: 'IDR 0', total: 'IDR 12.000.000', status: 'paid' }
          ];

    const purchaseOrders = fiscalMode === 'ppn'
        ? [
              { id: 'PO-PPN-001', vendor: 'PT. Megah Billboard Jaya', date: '2026-06-24', itemsCount: 3, subtotal: 'IDR 3.000.000', ppn: 'IDR 330.000', total: 'IDR 3.330.000', status: 'received' },
              { id: 'PO-PPN-002', vendor: 'PT. Promosi Outdoor Kreasindo', date: '2026-06-20', itemsCount: 1, subtotal: 'IDR 8.000.000', ppn: 'IDR 880.000', total: 'IDR 8.880.000', status: 'received' },
              { id: 'PO-PPN-003', vendor: 'CV. Media Ad Perkasa', date: '2026-06-15', itemsCount: 5, subtotal: 'IDR 1.200.000', ppn: 'IDR 0', total: 'IDR 1.200.000', status: 'received' }
          ]
        : [
              { id: 'PO-NP-001', vendor: 'CV. Media Ad Perkasa', date: '2026-06-24', itemsCount: 3, subtotal: 'IDR 1.200.000', ppn: 'IDR 0', total: 'IDR 1.200.000', status: 'received' },
              { id: 'PO-NP-002', vendor: 'PT. Promosi Outdoor Kreasindo', date: '2026-06-20', itemsCount: 1, subtotal: 'IDR 2.000.000', ppn: 'IDR 0', total: 'IDR 2.000.000', status: 'received' },
              { id: 'PO-NP-003', vendor: 'CV. Citra Bali Billboard', date: '2026-06-15', itemsCount: 5, subtotal: 'IDR 2.500.000', ppn: 'IDR 0', total: 'IDR 2.500.000', status: 'received' }
          ];

    return (
        <DemoLayout
            activePage="invoice-po"
            title="Penerbitan Invoice & PO"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Invoice & PO' }]}
        >
            <div className="space-y-6">
                {/* Tab Switcher & Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Daftar Penerbitan Dokumen</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Kelola seluruh tagihan penjualan dan pesanan pembelian</p>
                    </div>
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('invoice')}
                            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'invoice' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Invoices (Pendapatan)
                        </button>
                        <button
                            onClick={() => setActiveTab('po')}
                            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'po' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Purchase Orders (Pengeluaran)
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        {activeTab === 'invoice' ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                        <th className="px-6 py-4">Nomor Invoice</th>
                                        <th className="px-6 py-4">Client / Pelanggan</th>
                                        <th className="px-6 py-4">Tanggal Penerbitan</th>
                                        <th className="px-6 py-4">Jatuh Tempo</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                        <th className="px-6 py-4 text-right">PPN (11%)</th>
                                        <th className="px-6 py-4 text-right">Total Tagihan</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">{inv.id}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">{inv.client}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">{inv.date}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">{inv.due}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">{inv.subtotal}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">
                                                {fiscalMode === 'ppn' ? inv.ppn : <span className="text-slate-300 font-sans text-[10px] font-bold uppercase">Disabled</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{inv.total}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={inv.status as any} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                        <th className="px-6 py-4">Nomor PO</th>
                                        <th className="px-6 py-4">Vendor Partner</th>
                                        <th className="px-6 py-4">Tanggal Pesan</th>
                                        <th className="px-6 py-4 text-center">Jumlah Barang</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                        <th className="px-6 py-4 text-right">PPN Masukan</th>
                                        <th className="px-6 py-4 text-right">Total Transaksi</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                    {purchaseOrders.map((po) => (
                                        <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">{po.id}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">{po.vendor}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">{po.date}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600 font-mono text-xs">{po.itemsCount} Items</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">{po.subtotal}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">
                                                {po.ppn === 'IDR 0' ? <span className="text-slate-300 font-sans text-[10px] font-bold uppercase">No Tax</span> : po.ppn}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{po.total}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={po.status as any} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </DemoLayout>
    );
}
