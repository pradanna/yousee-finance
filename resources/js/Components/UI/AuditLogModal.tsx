import Modal from '@/Components/UI/Modal';
import { useState } from 'react';

export interface AuditLogItem {
    id: string;
    event: string;
    description: string;
    user_name: string;
    created_at: string;
    properties?: Record<string, unknown> | null;
}

export interface AuditLogModalProps {
    show: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    logs: AuditLogItem[];
    eventOptions?: { value: string; label: string }[];
}

export const matchEventBadge = (event: string) => {
    switch (event) {
        case 'created':
            return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        case 'updated':
            return 'bg-amber-100 text-amber-700 border border-amber-200';
        case 'voided':
            return 'bg-rose-100 text-rose-700 border border-rose-200';
        case 'deleted':
            return 'bg-slate-800 text-white';
        case 'status_changed':
            return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
        default:
            return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
};

export default function AuditLogModal({
    show,
    onClose,
    title = 'Jejak Audit Keamanan & Riwayat Aktivitas',
    subtitle = 'Audit trail mutasi pencatatan, pembaruan, status, dan riwayat aktivitas sistem',
    logs = [],
    eventOptions = [
        { value: 'all', label: 'Semua Jenis Aktivitas' },
        { value: 'created', label: '🟢 Input Baru (Created)' },
        { value: 'updated', label: '🟡 Pembaruan (Updated)' },
        { value: 'voided', label: '🟠 Pembatalan (Voided)' },
        { value: 'deleted', label: '🔴 Hapus (Deleted)' },
    ],
}: AuditLogModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleReset = () => {
        setSearchQuery('');
        setSelectedEvent('all');
        setStartDate('');
        setEndDate('');
    };

    const filteredLogs = logs.filter((log) => {
        // 1. Filter Event
        const matchEvent =
            selectedEvent === 'all' || log.event === selectedEvent;

        // 2. Filter Search
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
            !q ||
            log.description.toLowerCase().includes(q) ||
            log.user_name.toLowerCase().includes(q) ||
            log.event.toLowerCase().includes(q);

        // 3. Filter Rentang Tanggal
        let matchDate = true;
        if (log.created_at) {
            const logDateStr = log.created_at.substring(0, 10);
            if (startDate && logDateStr < startDate) {
                matchDate = false;
            }
            if (endDate && logDateStr > endDate) {
                matchDate = false;
            }
        }

        return matchEvent && matchSearch && matchDate;
    });

    return (
        <Modal show={show} onClose={onClose} maxWidth="5xl">
            <div className="p-6">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black tracking-tight text-slate-900">
                                {title}
                            </h3>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Toolbar Pencarian & Filter di dalam Modal */}
                <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                    {/* Search Bar */}
                    <div className="relative sm:col-span-4">
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
                            placeholder="Cari kata kunci, user, deskripsi..."
                            className="w-full rounded-xl border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-primary focus:ring-primary"
                        />
                    </div>

                    {/* Filter Event */}
                    <div className="sm:col-span-3">
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="w-full rounded-xl border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-primary focus:ring-primary"
                        >
                            {eventOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Tanggal Mulai */}
                    <div className="sm:col-span-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="Tanggal Mulai"
                            className="w-full rounded-xl border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-primary focus:ring-primary"
                        />
                    </div>

                    {/* Filter Tanggal Sampai */}
                    <div className="sm:col-span-2">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="Tanggal Sampai"
                            className="w-full rounded-xl border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-primary focus:ring-primary"
                        />
                    </div>

                    {/* Reset Filter Button */}
                    <div className="sm:col-span-1">
                        <button
                            type="button"
                            onClick={handleReset}
                            title="Reset Filter"
                            className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Tabel Daftar Log Audit */}
                <div className="max-h-[460px] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white">
                    {filteredLogs.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            Tidak ditemukan catatan audit log yang sesuai dengan
                            filter.
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead className="backdrop-blur-xs sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 font-bold text-slate-600">
                                <tr>
                                    <th className="px-5 py-3">Waktu</th>
                                    <th className="px-5 py-3">Aktivitas</th>
                                    <th className="px-5 py-3">
                                        Staf / Pengguna
                                    </th>
                                    <th className="px-5 py-3">
                                        Rincian Deskripsi Audit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredLogs.map((log) => {
                                    const badgeColor = matchEventBadge(
                                        log.event,
                                    );

                                    return (
                                        <tr
                                            key={log.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[11px] text-slate-500">
                                                {log.created_at
                                                    ? new Date(
                                                          log.created_at,
                                                      ).toLocaleString(
                                                          'id-ID',
                                                          {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          },
                                                      )
                                                    : '-'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-[10px] font-black uppercase ${badgeColor}`}
                                                >
                                                    {log.event}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">
                                                {log.user_name}
                                            </td>
                                            <td className="px-5 py-3.5 leading-relaxed text-slate-700">
                                                {log.description}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-medium text-slate-400">
                        Total {logs.length} catatan aktivitas tersimpan
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900 active:scale-95"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
}
