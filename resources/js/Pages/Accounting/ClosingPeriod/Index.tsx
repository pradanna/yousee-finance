import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Modal from '@/Components/UI/Modal';
import Toast from '@/Components/UI/Toast';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface MonthPeriodStatus {
    month: number;
    name: string;
    isClosedPpn: boolean;
    closedAtPpn: string | null;
    isClosedNonPpn: boolean;
    closedAtNonPpn: string | null;
}

interface AuditLogItem {
    id: string;
    event: string;
    description: string;
    userName: string;
    createdAt: string;
    properties?: Record<string, unknown>;
}

interface ClosingPeriodIndexProps {
    selectedYear: number;
    currentMode: string;
    months: MonthPeriodStatus[];
    auditLogs: AuditLogItem[];
    isOwner: boolean;
}

export default function ClosingPeriodIndex({
    selectedYear,
    months,
    auditLogs,
    isOwner,
}: ClosingPeriodIndexProps) {
    const fiscalMode = useFiscalMode();
    const [year, setYear] = useState<number>(selectedYear);

    // State Modal Lock & Unlock
    const [lockingMonth, setLockingMonth] = useState<MonthPeriodStatus | null>(null);
    const [unlockingMonth, setUnlockingMonth] = useState<MonthPeriodStatus | null>(null);

    const [toast, setToast] = useState<{
        show: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({
        show: false,
        type: 'success',
        title: '',
        message: '',
    });

    const triggerToast = (
        type: 'success' | 'error' | 'warning',
        title: string,
        message: string,
    ) => {
        setToast({ show: true, type, title, message });
    };

    // Form Lock
    const lockForm = useForm<{
        month: number;
        year: number;
        fiscal_mode: string;
    }>({
        month: 1,
        year: year,
        fiscal_mode: fiscalMode,
    });

    // Form Unlock
    const unlockForm = useForm<{
        month: number;
        year: number;
        fiscal_mode: string;
        reason: string;
        password: string;
    }>({
        month: 1,
        year: year,
        fiscal_mode: fiscalMode,
        reason: '',
        password: '',
    });

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        router.get(
            '/accounting/closing-periods',
            { year: newYear, fiscal_mode: fiscalMode },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openLockModal = (m: MonthPeriodStatus) => {
        setLockingMonth(m);
        lockForm.setData({
            month: m.month,
            year: year,
            fiscal_mode: fiscalMode,
        });
    };

    const openUnlockModal = (m: MonthPeriodStatus) => {
        setUnlockingMonth(m);
        unlockForm.setData({
            month: m.month,
            year: year,
            fiscal_mode: fiscalMode,
            reason: '',
            password: '',
        });
    };

    const handleLockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        lockForm.post('/accounting/closing-periods/lock', {
            preserveScroll: true,
            onSuccess: () => {
                setLockingMonth(null);
                triggerToast(
                    'success',
                    'Tutup Buku Berhasil',
                    `Periode ${lockingMonth?.name} ${year} (${fiscalMode.toUpperCase()}) telah berhasil dikunci dan ditutup buku.`,
                );
            },
            onError: (errs) => {
                const msg =
                    errs.lock_error ||
                    Object.values(errs)[0] ||
                    'Gagal melakukan tutup buku.';
                triggerToast('error', 'Gagal Tutup Buku', String(msg));
            },
        });
    };

    const handleUnlockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        unlockForm.post('/accounting/closing-periods/unlock', {
            preserveScroll: true,
            onSuccess: () => {
                setUnlockingMonth(null);
                triggerToast(
                    'warning',
                    'Gembok Periode Dibuka',
                    `Gembok periode ${unlockingMonth?.name} ${year} (${fiscalMode.toUpperCase()}) berhasil dibuka kembali.`,
                );
            },
            onError: (errs) => {
                const msg =
                    errs.unlock_error ||
                    errs.password ||
                    errs.reason ||
                    Object.values(errs)[0] ||
                    'Gagal membuka gembok periode.';
                triggerToast('error', 'Gagal Buka Gembok', String(msg));
            },
        });
    };

    return (
        <AppLayout
            activePage="closing-periods"
            title="Tutup Buku & Kunci Periode"
            breadcrumbs={[
                { label: 'Akuntansi', href: '/accounting/coa' },
                { label: 'Tutup Buku & Kunci Periode' },
            ]}
        >
            <Head title="Tutup Buku & Kunci Periode Akuntansi" />

            <div className="space-y-6">
                {/* Header Card & Otoritas Banner */}
                <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">
                                    Kontrol Tutup Buku & Kunci Periode
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Membekukan transaksi keuangan masa lampau agar tidak dapat diubah atau dimanipulasi
                                </p>
                            </div>
                        </div>

                        {/* Year Selector */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600">
                                Tahun Buku:
                            </label>
                            <select
                                value={year}
                                onChange={(e) => handleYearChange(Number(e.target.value))}
                                className="rounded-xl border-slate-200 px-4 py-2 font-mono text-xs font-bold text-slate-900 focus:border-amber-500 focus:ring-amber-500"
                            >
                                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Role Indicator Banner */}
                    <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span className="font-semibold text-slate-700">
                                Status Otoritas Anda:{' '}
                                <strong className={isOwner ? 'text-amber-700' : 'text-slate-900'}>
                                    {isOwner ? '👑 Owner / Pimpinan (Akses Penuh Lock & Unlock)' : '👤 Admin Keuangan (Read-Only / Viewing Only)'}
                                </strong>
                            </span>
                        </div>
                        <span className="font-bold text-slate-500">
                            Mode Fiskal Aktif:{' '}
                            <span className="uppercase text-primary">
                                {fiscalMode}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Grid 12 Bulan: Matriks Tutup Buku */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {months.map((m) => {
                        const isClosed = fiscalMode === 'ppn' ? m.isClosedPpn : m.isClosedNonPpn;
                        const closedAt = fiscalMode === 'ppn' ? m.closedAtPpn : m.closedAtNonPpn;

                        return (
                            <div
                                key={m.month}
                                className={`shadow-2xs relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                                    isClosed
                                        ? 'border-amber-300 bg-amber-50/40'
                                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-slate-400">
                                            Bulan {String(m.month).padStart(2, '0')}
                                        </span>
                                        {isClosed ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                                                🔒 Terkunci
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                                                🟢 Terbuka
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="mt-2 text-base font-bold text-slate-900">
                                        {m.name} {year}
                                    </h3>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {isClosed ? (
                                            <>
                                                Tutup buku pada:{' '}
                                                <strong className="text-slate-700">
                                                    {closedAt}
                                                </strong>
                                            </>
                                        ) : (
                                            'Transaksi masih dapat ditambah, diubah & dihapus'
                                        )}
                                    </p>
                                </div>

                                <div className="mt-5 border-t border-slate-100 pt-3.5">
                                    {isClosed ? (
                                        <button
                                            type="button"
                                            disabled={!isOwner}
                                            onClick={() => openUnlockModal(m)}
                                            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 shadow-2xs transition-all hover:bg-amber-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                            title={
                                                isOwner
                                                    ? 'Buka kembali gembok periode ini'
                                                    : 'Hanya Owner/Pimpinan yang berhak membuka gembok periode'
                                            }
                                        >
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                                />
                                            </svg>
                                            Buka Gembok (Unlock)
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={!isOwner}
                                            onClick={() => openLockModal(m)}
                                            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                            title={
                                                isOwner
                                                    ? 'Tutup buku dan kunci transaksi bulan ini'
                                                    : 'Hanya Owner/Pimpinan yang berhak melakukan tutup buku'
                                            }
                                        >
                                            <svg
                                                className="h-3.5 w-3.5 text-amber-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                                />
                                            </svg>
                                            Tutup Buku (Lock)
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Audit Trail Tutup Buku */}
                <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                📋 Jejak Audit Tutup Buku & Pembukaan Periode
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Rekam jejak resmi aktivitas lock dan unlock periode oleh Pimpinan/Owner
                            </p>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                            {auditLogs.length} Riwayat Tercatat
                        </span>
                    </div>

                    {auditLogs.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                            Belum ada riwayat aktivitas tutup buku atau pembukaan gembok periode.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start justify-between p-3.5 text-xs transition-colors hover:bg-slate-50/60"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs">
                                            {log.event === 'lock_period' ? '🔒' : '🔓'}
                                        </span>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {log.description}
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-slate-400">
                                                Dilakukan oleh:{' '}
                                                <strong className="text-slate-600">
                                                    {log.userName}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-400">
                                        {log.createdAt}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Konfirmasi Tutup Buku (Lock) */}
            <Modal
                show={lockingMonth !== null}
                onClose={() => setLockingMonth(null)}
                maxWidth="md"
            >
                <form onSubmit={handleLockSubmit} className="p-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Konfirmasi Tutup Buku
                            </h3>
                            <p className="text-xs text-slate-500">
                                Periode {lockingMonth?.name} {year} ({fiscalMode.toUpperCase()})
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs leading-relaxed text-amber-900">
                        ⚠️ <strong>PENTING:</strong> Setelah periode ini ditutup buku, seluruh transaksi pada bulan{' '}
                        <strong>{lockingMonth?.name} {year}</strong> (Invoice, PO, Kas Keluar, Jurnal) akan menjadi{' '}
                        <strong>Read-Only</strong> dan tidak dapat diubah oleh staf manapun.
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setLockingMonth(null)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={lockForm.processing}
                            className="bg-slate-900 hover:bg-slate-800"
                        >
                            {lockForm.processing ? 'Mengunci...' : 'Ya, Tutup Buku & Kunci'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Buka Gembok (Unlock) */}
            <Modal
                show={unlockingMonth !== null}
                onClose={() => setUnlockingMonth(null)}
                maxWidth="md"
            >
                <form onSubmit={handleUnlockSubmit} className="p-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Buka Gembok Periode Akuntansi
                            </h3>
                            <p className="text-xs text-slate-500">
                                Otoritas Eksklusif Owner / Pimpinan
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700">
                                Alasan Pembukaan Kembali Periode <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                value={unlockForm.data.reason}
                                onChange={(e) =>
                                    unlockForm.setData('reason', e.target.value)
                                }
                                placeholder="Contoh: Pembetulan data faktur pajak PPN & retribusi reklame"
                                className="mt-1 w-full rounded-xl border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-rose-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700">
                                Konfirmasi Kata Sandi Pimpinan <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={unlockForm.data.password}
                                onChange={(e) =>
                                    unlockForm.setData('password', e.target.value)
                                }
                                placeholder="Masukkan password akun Anda untuk verifikasi"
                                className="mt-1 w-full rounded-xl border-slate-200 text-xs text-slate-800 focus:border-rose-500 focus:ring-rose-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setUnlockingMonth(null)}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={unlockForm.processing}
                            className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                        >
                            {unlockForm.processing ? 'Membuka...' : 'Konfirmasi Buka Gembok'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Global Toast */}
            <Toast
                show={toast.show}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </AppLayout>
    );
}
