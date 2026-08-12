import StatusBadge from '@/Components/UI/StatusBadge';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { useState } from 'react';

export default function InvoicePoList() {
    const fiscalMode = useFiscalMode();
    const [activeTab, setActiveTab] = useState<'invoice' | 'po'>('invoice');

    // Dummy data based on fiscalMode
    const invoices =
        fiscalMode === 'ppn'
            ? [
                  {
                      id: 'INV-PPN-001',
                      client: 'PT. Gojek Tokopedia',
                      date: '2026-06-25',
                      due: '2026-07-02',
                      subtotal: 'IDR 10.000.000',
                      ppn: 'IDR 1.100.000',
                      total: 'IDR 11.100.000',
                      status: 'paid',
                  },
                  {
                      id: 'INV-PPN-002',
                      client: 'Traveloka Corp',
                      date: '2026-06-22',
                      due: '2026-06-29',
                      subtotal: 'IDR 5.000.000',
                      ppn: 'IDR 550.000',
                      total: 'IDR 5.550.000',
                      status: 'issued',
                  },
                  {
                      id: 'INV-PPN-003',
                      client: 'Shopee Indonesia',
                      date: '2026-06-12',
                      due: '2026-06-19',
                      subtotal: 'IDR 8.000.000',
                      ppn: 'IDR 880.000',
                      total: 'IDR 8.880.000',
                      status: 'draft',
                  },
              ]
            : [
                  {
                      id: 'INV-NP-001',
                      client: 'Shopee Indonesia',
                      date: '2026-06-25',
                      due: '2026-07-02',
                      subtotal: 'IDR 10.000.000',
                      ppn: 'IDR 0',
                      total: 'IDR 10.000.000',
                      status: 'paid',
                  },
                  {
                      id: 'INV-NP-002',
                      client: 'PT. Citra Digital',
                      date: '2026-06-22',
                      due: '2026-06-29',
                      subtotal: 'IDR 5.000.000',
                      ppn: 'IDR 0',
                      total: 'IDR 5.000.000',
                      status: 'issued',
                  },
                  {
                      id: 'INV-NP-003',
                      client: 'PT. Gojek Tokopedia',
                      date: '2026-06-18',
                      due: '2026-06-25',
                      subtotal: 'IDR 12.000.000',
                      ppn: 'IDR 0',
                      total: 'IDR 12.000.000',
                      status: 'paid',
                  },
              ];

    const purchaseOrders =
        fiscalMode === 'ppn'
            ? [
                  {
                      id: 'PO-PPN-001',
                      vendor: 'PT. Megah Billboard Jaya',
                      date: '2026-06-24',
                      itemsCount: 3,
                      subtotal: 'IDR 3.000.000',
                      ppn: 'IDR 330.000',
                      total: 'IDR 3.330.000',
                      status: 'received',
                  },
                  {
                      id: 'PO-PPN-002',
                      vendor: 'PT. Promosi Outdoor Kreasindo',
                      date: '2026-06-20',
                      itemsCount: 1,
                      subtotal: 'IDR 8.000.000',
                      ppn: 'IDR 880.000',
                      total: 'IDR 8.880.000',
                      status: 'received',
                  },
                  {
                      id: 'PO-PPN-003',
                      vendor: 'CV. Media Ad Perkasa',
                      date: '2026-06-15',
                      itemsCount: 5,
                      subtotal: 'IDR 1.200.000',
                      ppn: 'IDR 0',
                      total: 'IDR 1.200.000',
                      status: 'received',
                  },
              ]
            : [
                  {
                      id: 'PO-NP-001',
                      vendor: 'CV. Media Ad Perkasa',
                      date: '2026-06-24',
                      itemsCount: 3,
                      subtotal: 'IDR 1.200.000',
                      ppn: 'IDR 0',
                      total: 'IDR 1.200.000',
                      status: 'received',
                  },
                  {
                      id: 'PO-NP-002',
                      vendor: 'PT. Promosi Outdoor Kreasindo',
                      date: '2026-06-20',
                      itemsCount: 1,
                      subtotal: 'IDR 2.000.000',
                      ppn: 'IDR 0',
                      total: 'IDR 2.000.000',
                      status: 'received',
                  },
                  {
                      id: 'PO-NP-003',
                      vendor: 'CV. Citra Bali Billboard',
                      date: '2026-06-15',
                      itemsCount: 5,
                      subtotal: 'IDR 2.500.000',
                      ppn: 'IDR 0',
                      total: 'IDR 2.500.000',
                      status: 'received',
                  },
              ];

    return (
        <AppLayout
            activePage="invoice-po"
            title="Penerbitan Invoice & PO"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Transaksi' },
                { label: 'Invoice & PO' },
            ]}
        >
            <div className="space-y-6">
                {/* Tab Switcher & Title */}
                <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-800">
                            Daftar Penerbitan Dokumen
                        </h2>
                        <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                            Kelola seluruh tagihan penjualan dan pesanan
                            pembelian
                        </p>
                    </div>
                    <div className="flex w-full gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 md:w-auto">
                        <button
                            onClick={() => setActiveTab('invoice')}
                            className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-all md:flex-initial ${
                                activeTab === 'invoice'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Invoices (Pendapatan)
                        </button>
                        <button
                            onClick={() => setActiveTab('po')}
                            className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-all md:flex-initial ${
                                activeTab === 'po'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Purchase Orders (Pengeluaran)
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                    <div className="overflow-x-auto">
                        {activeTab === 'invoice' ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4">
                                            Nomor Invoice
                                        </th>
                                        <th className="px-6 py-4">
                                            Client / Pelanggan
                                        </th>
                                        <th className="px-6 py-4">
                                            Tanggal Penerbitan
                                        </th>
                                        <th className="px-6 py-4">
                                            Jatuh Tempo
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Subtotal
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            PPN (11%)
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Total Tagihan
                                        </th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {invoices.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                                                {inv.id}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {inv.client}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">
                                                {inv.date}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">
                                                {inv.due}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">
                                                {inv.subtotal}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">
                                                {fiscalMode === 'ppn' ? (
                                                    inv.ppn
                                                ) : (
                                                    <span className="font-sans text-[10px] font-bold uppercase text-slate-300">
                                                        Disabled
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                {inv.total}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    status={inv.status as any}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4">Nomor PO</th>
                                        <th className="px-6 py-4">
                                            Vendor Partner
                                        </th>
                                        <th className="px-6 py-4">
                                            Tanggal Pesan
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Jumlah Barang
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Subtotal
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            PPN Masukan
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Total Transaksi
                                        </th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {purchaseOrders.map((po) => (
                                        <tr
                                            key={po.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                                                {po.id}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {po.vendor}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">
                                                {po.date}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-600">
                                                {po.itemsCount} Items
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">
                                                {po.subtotal}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-600">
                                                {po.ppn === 'IDR 0' ? (
                                                    <span className="font-sans text-[10px] font-bold uppercase text-slate-300">
                                                        No Tax
                                                    </span>
                                                ) : (
                                                    po.ppn
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                {po.total}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    status={po.status as any}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
