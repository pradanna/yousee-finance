import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import EmptyState from '@/Components/Table/EmptyState';
import Modal from '@/Components/UI/Modal';
import { formatRupiah } from '@/Utils/formatters';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

export interface CommissionItem {
    projectId: string;
    projectCode: string;
    projectName: string;
    clientName: string;
    fiscalMode: 'ppn' | 'non-ppn';
    startDate: string;
    contractValue: number;
    salesId: string;
    salesName: string;
    salesPhone?: string;
    salesEmail?: string;
    commissionRate: number;
    commissionAmount: number;
    isClientPaid: boolean;
    totalInvoiced: number;
    commissionStatus: 'pending' | 'ready' | 'paid';
    paidTransactionNo?: string | null;
    paidDate?: string | null;
    paidAmount?: number;
}

export interface CommissionSummary {
    totalCommissionEarned: number;
    totalCommissionReady: number;
    totalCommissionPaid: number;
    totalCommissionPending: number;
    readyCount: number;
    paidCount: number;
    pendingCount: number;
}

interface PaymentAccountOption {
    id: string;
    code: string;
    name: string;
    friendly_name?: string;
    current_balance?: number;
}

interface SalesCommissionTabProps {
    commissions: CommissionItem[];
    summary: CommissionSummary;
    paymentAccounts: PaymentAccountOption[];
    isPeriodLocked?: boolean;
    onTriggerToast: (
        type: 'success' | 'error' | 'warning',
        title: string,
        message: string,
    ) => void;
}

export default function SalesCommissionTab({
    commissions,
    summary,
    paymentAccounts,
    isPeriodLocked,
    onTriggerToast,
}: SalesCommissionTabProps) {
    const [selectedStatusFilter, setSelectedStatusFilter] =
        useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCommission, setSelectedCommission] =
        useState<CommissionItem | null>(null);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    // Form bayar komisi via Cash Out
    const payForm = useForm({
        project_id: '',
        payment_account_id:
            paymentAccounts.length > 0 ? paymentAccounts[0].id : '',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        recipient: '',
        description: '',
    });

    const openPayModal = (item: CommissionItem) => {
        setSelectedCommission(item);
        const roundedAmount = Math.round(Number(item.commissionAmount) || 0);
        payForm.setData({
            project_id: item.projectId,
            payment_account_id:
                paymentAccounts.length > 0 ? paymentAccounts[0].id : '',
            amount: roundedAmount,
            transaction_date: new Date().toISOString().split('T')[0],
            recipient: item.salesName,
            description: `Pembayaran Komisi Sales: ${item.salesName} (${item.commissionRate}%) - Proyek ${item.projectCode} (${item.projectName})`,
        });
        setIsPayModalOpen(true);
    };

    const handlePaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        payForm.post('/cash-out/commissions/pay', {
            preserveScroll: true,
            onSuccess: () => {
                setIsPayModalOpen(false);
                onTriggerToast(
                    'success',
                    'Komisi Berhasil Dibayarkan',
                    `Pengeluaran kas komisi sales senilai ${formatRupiah(payForm.data.amount)} berhasil dibukukan.`,
                );
            },
            onError: (err) => {
                const msg =
                    Object.values(err)[0] ||
                    'Terjadi kesalahan saat memproses pembayaran komisi.';
                onTriggerToast('error', 'Gagal Membayar Komisi', String(msg));
            },
        });
    };

    // Filter list di frontend untuk kecepatan interaksi
    const filteredList = commissions.filter((c) => {
        if (
            selectedStatusFilter !== 'all' &&
            c.commissionStatus !== selectedStatusFilter
        ) {
            return false;
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const matchProject =
                c.projectCode.toLowerCase().includes(q) ||
                c.projectName.toLowerCase().includes(q);
            const matchSales = c.salesName.toLowerCase().includes(q);
            const matchClient = c.clientName.toLowerCase().includes(q);
            return matchProject || matchSales || matchClient;
        }
        return true;
    });

    return (
        <div className="space-y-5">
            {/* Metric Overview Cards for Sales Commission */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Hak Komisi */}
                <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Total Hak Komisi
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </span>
                    </div>
                    <div className="mt-2 font-mono text-xl font-extrabold text-slate-900">
                        {formatRupiah(summary.totalCommissionEarned)}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">
                        Dari {commissions.length} Proyek Billboard
                    </div>
                </div>

                {/* 2. Siap Dicairkan (Invoice Klien Lunas) */}
                <div className="shadow-xs rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                            Siap Dicairkan
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </span>
                    </div>
                    <div className="mt-2 font-mono text-xl font-extrabold text-amber-900">
                        {formatRupiah(summary.totalCommissionReady)}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-amber-800">
                        {summary.readyCount} Proyek (Klien Sudah Lunas)
                    </div>
                </div>

                {/* 3. Sudah Dibayar (Kas Keluar Selesai) */}
                <div className="shadow-xs rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Sudah Dibayarkan
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </span>
                    </div>
                    <div className="mt-2 font-mono text-xl font-extrabold text-emerald-900">
                        {formatRupiah(summary.totalCommissionPaid)}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-800">
                        {summary.paidCount} Proyek Selesai Dibayar
                    </div>
                </div>

                {/* 4. Menunggu Pelunasan Klien */}
                <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Menunggu Pelunasan
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </span>
                    </div>
                    <div className="mt-2 font-mono text-xl font-extrabold text-slate-700">
                        {formatRupiah(summary.totalCommissionPending)}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">
                        {summary.pendingCount} Proyek Invoice Belum Lunas
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('all')}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                            selectedStatusFilter === 'all'
                                ? 'shadow-xs bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Semua Status ({commissions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('ready')}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                            selectedStatusFilter === 'ready'
                                ? 'shadow-xs bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                    >
                        Siap Dicairkan ({summary.readyCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('paid')}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                            selectedStatusFilter === 'paid'
                                ? 'shadow-xs bg-emerald-600 text-white'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                    >
                        Sudah Dibayar ({summary.paidCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('pending')}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                            selectedStatusFilter === 'pending'
                                ? 'shadow-xs bg-slate-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Menunggu Klien ({summary.pendingCount})
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative min-w-[240px]">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari sales, proyek, atau klien..."
                        className="w-full rounded-xl border-slate-200 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-primary focus:ring-primary"
                    />
                </div>
            </div>

            {/* Table: Sales Commission Tracking & Payment */}
            <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4">Proyek & Klien</th>
                                <th className="px-5 py-4">Sales Personil</th>
                                <th className="px-5 py-4 text-right">
                                    Nilai Kontrak
                                </th>
                                <th className="px-5 py-4 text-center">
                                    Komisi (%)
                                </th>
                                <th className="px-5 py-4 text-right">
                                    Nominal Bonus
                                </th>
                                <th className="px-5 py-4 text-center">
                                    Status Invoice
                                </th>
                                <th className="px-5 py-4 text-center">
                                    Status Pembayaran
                                </th>
                                <th className="px-5 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12">
                                        <EmptyState
                                            title="Tidak Ada Data Komisi"
                                            description="Belum ada data proyek atau komisi sales yang cocok dengan kriteria filter."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item) => (
                                    <tr
                                        key={item.projectId}
                                        className="transition-colors hover:bg-slate-50/60"
                                    >
                                        {/* Proyek & Klien */}
                                        <td className="px-5 py-3.5">
                                            <div className="font-mono text-xs font-bold text-blue-600">
                                                {item.projectCode}
                                            </div>
                                            <div className="max-w-[200px] truncate text-xs font-bold text-slate-900">
                                                {item.projectName}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Klien: {item.clientName}
                                            </div>
                                        </td>

                                        {/* Sales Personil */}
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-slate-900">
                                                {item.salesName}
                                            </div>
                                            <div className="text-[10.5px] text-slate-400">
                                                {item.salesPhone ||
                                                    item.salesEmail ||
                                                    'Sales Executive'}
                                            </div>
                                        </td>

                                        {/* Nilai Kontrak */}
                                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800">
                                            {formatRupiah(item.contractValue)}
                                        </td>

                                        {/* % Komisi */}
                                        <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                                                {item.commissionRate}%
                                            </span>
                                        </td>

                                        {/* Nominal Bonus */}
                                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-blue-700">
                                            {formatRupiah(
                                                item.commissionAmount,
                                            )}
                                        </td>

                                        {/* Status Invoice Klien */}
                                        <td className="px-5 py-3.5 text-center">
                                            {item.isClientPaid ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Klien Lunas
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                                    Belum Lunas
                                                </span>
                                            )}
                                        </td>

                                        {/* Status Komisi */}
                                        <td className="px-5 py-3.5 text-center">
                                            {item.commissionStatus ===
                                            'paid' ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                                        <svg
                                                            className="h-3.5 w-3.5 text-emerald-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                        Sudah Dibayar
                                                    </span>
                                                    {item.paidTransactionNo && (
                                                        <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                                                            {
                                                                item.paidTransactionNo
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ) : item.commissionStatus ===
                                              'ready' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></span>
                                                    Siap Dicairkan
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                                                    Menunggu Klien
                                                </span>
                                            )}
                                        </td>

                                        {/* Aksi Bayar */}
                                        <td className="px-5 py-3.5 text-center">
                                            {item.commissionStatus ===
                                            'paid' ? (
                                                <span className="text-[11px] font-bold text-emerald-600">
                                                    ✓ Selesai
                                                </span>
                                            ) : item.commissionStatus ===
                                              'ready' ? (
                                                <button
                                                    type="button"
                                                    disabled={isPeriodLocked}
                                                    onClick={() =>
                                                        openPayModal(item)
                                                    }
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                                        />
                                                    </svg>
                                                    Bayar Komisi
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={isPeriodLocked}
                                                    onClick={() =>
                                                        openPayModal(item)
                                                    }
                                                    title="Klien belum lunas. Anda tetap dapat mencairkan komisi di muka jika diizinkan Pimpinan."
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Bayar di Muka
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Konfirmasi Pembayaran Komisi */}
            <Modal
                show={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                maxWidth="lg"
            >
                <form onSubmit={handlePaySubmit} className="p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl text-primary">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Pencairan Komisi / Bonus Sales
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Otomatis membuat voucher Kas Keluar dan
                                    jurnal akuntansi
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPayModalOpen(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>

                    {selectedCommission && (
                        <div className="mt-4 space-y-4">
                            {/* Project Summary Box */}
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-slate-700">
                                <div className="flex justify-between font-bold">
                                    <span className="text-blue-900">
                                        Proyek: {selectedCommission.projectCode}
                                    </span>
                                    <span className="text-slate-600">
                                        Rate:{' '}
                                        {selectedCommission.commissionRate}%
                                    </span>
                                </div>
                                <div className="mt-1 font-semibold text-slate-800">
                                    {selectedCommission.projectName}
                                </div>
                                <div className="mt-2 flex justify-between border-t border-blue-200/60 pt-2 text-[11px]">
                                    <span>
                                        Nilai Kontrak:{' '}
                                        {formatRupiah(
                                            selectedCommission.contractValue,
                                        )}
                                    </span>
                                    <span className="font-bold text-blue-700">
                                        Nominal Bonus:{' '}
                                        {formatRupiah(
                                            selectedCommission.commissionAmount,
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Form Input: Sumber Kas */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700">
                                    Sumber Pembayaran Kas / Rekening Bank{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={payForm.data.payment_account_id}
                                    onChange={(e) =>
                                        payForm.setData(
                                            'payment_account_id',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 focus:border-primary focus:ring-primary"
                                    required
                                >
                                    {paymentAccounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.friendly_name || acc.name}{' '}
                                            (Saldo:{' '}
                                            {formatRupiah(
                                                acc.current_balance ?? 0,
                                            )}
                                            )
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tanggal & Nominal */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">
                                        Tanggal Kas Keluar{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={payForm.data.transaction_date}
                                        onChange={(e) =>
                                            payForm.setData(
                                                'transaction_date',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 focus:border-primary focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-700">
                                            Nominal Dicairkan (Rp){' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="pointer-events-none absolute left-3 top-2 font-mono text-xs font-bold text-slate-500">
                                            Rp
                                        </span>
                                        <input
                                            type="text"
                                            readOnly
                                            value={
                                                payForm.data.amount
                                                    ? Number(
                                                          payForm.data.amount,
                                                      ).toLocaleString('id-ID')
                                                    : ''
                                            }
                                            className="w-full cursor-not-allowed rounded-xl border-slate-200 bg-slate-100/90 py-2 pl-9 pr-3 font-mono text-xs font-bold text-slate-800 focus:border-slate-300 focus:ring-0"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Penerima */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700">
                                    Nama Penerima (Sales){' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={payForm.data.recipient}
                                    onChange={(e) =>
                                        payForm.setData(
                                            'recipient',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 focus:border-primary focus:ring-primary"
                                    required
                                />
                            </div>

                            {/* Keterangan */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700">
                                    Keterangan / Memo Kas Keluar{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={payForm.data.description}
                                    onChange={(e) =>
                                        payForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border-slate-200 text-xs font-normal text-slate-800 focus:border-primary focus:ring-primary"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsPayModalOpen(false)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={payForm.processing}
                        >
                            {payForm.processing
                                ? 'Memproses...'
                                : 'Konfirmasi & Bayar Kas'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
