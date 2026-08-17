import AppLayout from '@/Layouts/AppLayout';
import { useMemo, useState } from 'react';
import {
    ClientPaymentPlan,
    FiscalMode,
    PaymentScheme,
    PaymentTerm,
    PaymentTermStatus,
    Project,
    SCHEME_LABELS,
    calcFinancials,
    calcPaymentSummary,
    fmt,
} from './projectTypes';

// ─── Helpers ────────────────────────────────────────────────────────────────
function addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function generateTerms(
    scheme: PaymentScheme,
    totalAmount: number,
    opts: {
        dpPercent?: number;
        terminCount?: number;
        terminPercents?: number[];
        terminDueDates?: string[];
        fullDueDate?: string;
        dpDueDate?: string;
        pelunasanDueDate?: string;
        installmentCount?: number;
        installmentStartDate?: string;
        installmentIntervalDays?: number;
    },
): PaymentTerm[] {
    const today = new Date();
    switch (scheme) {
        case 'full':
            return [
                {
                    id: `term-full-${Date.now()}`,
                    label: 'Lunas Sekaligus',
                    amount: totalAmount,
                    percent: 100,
                    dueDate: opts.fullDueDate ?? addDays(today, 14),
                    status: 'unpaid',
                },
            ];
        case 'dp': {
            const dpPct = opts.dpPercent ?? 30;
            const pelPct = 100 - dpPct;
            return [
                {
                    id: `term-dp-${Date.now()}`,
                    label: `DP ${dpPct}%`,
                    amount: Math.round((totalAmount * dpPct) / 100),
                    percent: dpPct,
                    dueDate: opts.dpDueDate ?? addDays(today, 7),
                    status: 'unpaid',
                },
                {
                    id: `term-pel-${Date.now()}`,
                    label: `Pelunasan ${pelPct}%`,
                    amount:
                        totalAmount - Math.round((totalAmount * dpPct) / 100),
                    percent: pelPct,
                    dueDate: opts.pelunasanDueDate ?? addDays(today, 30),
                    status: 'unpaid',
                },
            ];
        }
        case 'termin': {
            const count = opts.terminCount ?? 3;
            const percents =
                opts.terminPercents ??
                Array(count).fill(Math.floor(100 / count));
            // Fix rounding: last gets remainder
            const sum = percents.slice(0, -1).reduce((a, b) => a + b, 0);
            percents[percents.length - 1] = 100 - sum;
            let runningAmount = 0;
            return percents.map((pct, i) => {
                const isLast = i === percents.length - 1;
                const amount = isLast
                    ? totalAmount - runningAmount
                    : Math.round((totalAmount * pct) / 100);
                runningAmount += amount;
                return {
                    id: `term-t${i + 1}-${Date.now() + i}`,
                    label:
                        i === 0
                            ? 'Termin 1 – Uang Muka'
                            : i === percents.length - 1
                              ? `Termin ${i + 1} – Pelunasan`
                              : `Termin ${i + 1}`,
                    amount,
                    percent: pct,
                    dueDate:
                        opts.terminDueDates?.[i] ??
                        addDays(today, (i + 1) * 14),
                    status: 'unpaid',
                };
            });
        }
        case 'installment': {
            const count = opts.installmentCount ?? 3;
            const perAmount = Math.floor(totalAmount / count);
            const start = opts.installmentStartDate
                ? new Date(opts.installmentStartDate)
                : today;
            const interval = opts.installmentIntervalDays ?? 30;
            return Array.from({ length: count }, (_, i) => {
                const isLast = i === count - 1;
                const amount = isLast
                    ? totalAmount - perAmount * (count - 1)
                    : perAmount;
                return {
                    id: `term-ci${i + 1}-${Date.now() + i}`,
                    label: `Cicilan ${i + 1} dari ${count}`,
                    amount,
                    percent: Math.round((amount / totalAmount) * 100),
                    dueDate: addDays(start, interval * (i + 1)),
                    status: 'unpaid',
                };
            });
        }
    }
}

// ─── Status Chip ─────────────────────────────────────────────────────────────
function StatusChip({
    status,
    isOverdue,
}: {
    status: PaymentTermStatus;
    isOverdue: boolean;
}) {
    const map = {
        paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        unpaid: isOverdue
            ? 'bg-rose-100 text-rose-700 border-rose-200'
            : 'bg-amber-100 text-amber-700 border-amber-200',
        overdue: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    const label =
        status === 'paid' ? 'Lunas' : isOverdue ? 'Terlambat' : 'Belum Bayar';
    return (
        <span
            className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${map[status]}`}
        >
            {label}
        </span>
    );
}

interface DbProjectInput {
    id?: string;
    code?: string;
    name?: string;
    client_id?: string;
    client?: { id: string; name: string };
    client_name?: string;
    sales_id?: string;
    sales?: { id: string; name: string };
    sales_pic?: string;
    fiscal_mode?: 'ppn' | 'non-ppn' | string;
    start_date?: string;
    end_date?: string;
    contract_value?: number | string;
    status?: Project['status'];
}

interface ProjectPaymentProps {
    projectId?: string | number;
    project?: DbProjectInput;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectPayment({
    projectId,
    project: dbProject,
}: ProjectPaymentProps) {
    const defaultProject: Project = {
        id: dbProject?.id || '',
        code: dbProject?.code || '',
        name: dbProject?.name || '',
        clientId: dbProject?.client_id || '',
        clientName: dbProject?.client?.name || '-',
        salesPIC: dbProject?.sales?.name || '-',
        period: `${dbProject?.start_date || ''} - ${dbProject?.end_date || ''}`,
        contractValue: Number(dbProject?.contract_value) || 0,
        status: dbProject?.status || 'Draft',
        locations: [],
        invoiceIssued: false,
        invoiceNumber: '',
        targetQty: 1,
    };

    const [project, setProject] = useState<Project>(defaultProject);
    const fiscalMode: FiscalMode =
        dbProject?.fiscal_mode === 'non-ppn' ? 'non-ppn' : 'ppn';
    const isPPN = fiscalMode === 'ppn';
    const fin = calcFinancials(project, project.locations, fiscalMode);
    const totalInvoice = fin.totalInvoice;

    // Plan state
    const [plan, setPlan] = useState<ClientPaymentPlan | undefined>(
        project.clientPaymentPlan,
    );
    const [selectedScheme, setSelectedScheme] = useState<PaymentScheme>(
        plan?.scheme ?? 'full',
    );
    const [isSaved, setIsSaved] = useState(!!plan);
    const [showMarkPaidModal, setShowMarkPaidModal] = useState<string | null>(
        null,
    ); // term id
    const [paidAtDate, setPaidAtDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    );

    // Form state
    const [fullDueDate, setFullDueDate] = useState(
        plan?.scheme === 'full'
            ? (plan?.terms[0]?.dueDate ?? addDays(new Date(), 14))
            : addDays(new Date(), 14),
    );
    const [dpPercent, setDpPercent] = useState(
        plan?.scheme === 'dp' ? (plan.terms[0]?.percent ?? 30) : 30,
    );
    const [dpDueDate, setDpDueDate] = useState(
        plan?.scheme === 'dp'
            ? (plan.terms[0]?.dueDate ?? addDays(new Date(), 7))
            : addDays(new Date(), 7),
    );
    const [pelDueDate, setPelDueDate] = useState(
        plan?.scheme === 'dp'
            ? (plan.terms[1]?.dueDate ?? addDays(new Date(), 30))
            : addDays(new Date(), 30),
    );
    const [terminCount, setTerminCount] = useState(
        plan?.scheme === 'termin' ? plan.terms.length : 3,
    );
    const [terminPercents, setTerminPercents] = useState<number[]>(
        plan?.scheme === 'termin'
            ? plan.terms.map((t) => t.percent)
            : [30, 40, 30],
    );
    const [terminDueDates, setTerminDueDates] = useState<string[]>(
        plan?.scheme === 'termin'
            ? plan.terms.map((t) => t.dueDate)
            : [
                  addDays(new Date(), 7),
                  addDays(new Date(), 21),
                  addDays(new Date(), 45),
              ],
    );
    const [installCount, setInstallCount] = useState(
        plan?.scheme === 'installment' ? plan.terms.length : 3,
    );
    const [installInterval, setInstallInterval] = useState(30);
    const [installStart, setInstallStart] = useState(addDays(new Date(), 7));

    const summary = plan ? calcPaymentSummary(plan) : null;

    // Business Rule: Skema TIDAK bisa diubah jika sudah ada termin yang terbayar
    const hasPaidTerms = (plan?.terms ?? []).some((t) => t.status === 'paid');

    // Preview terms from current form
    const previewTerms = useMemo(
        () =>
            generateTerms(selectedScheme, totalInvoice, {
                fullDueDate,
                dpPercent,
                dpDueDate,
                pelunasanDueDate: pelDueDate,
                terminCount,
                terminPercents,
                terminDueDates,
                installmentCount: installCount,
                installmentIntervalDays: installInterval,
                installmentStartDate: installStart,
            }),
        [
            selectedScheme,
            totalInvoice,
            fullDueDate,
            dpPercent,
            dpDueDate,
            pelDueDate,
            terminCount,
            terminPercents,
            terminDueDates,
            installCount,
            installInterval,
            installStart,
        ],
    );

    function handleSavePlan() {
        const newPlan: ClientPaymentPlan = {
            scheme: selectedScheme,
            totalAmount: totalInvoice,
            createdAt: new Date().toISOString().split('T')[0],
            terms: previewTerms,
        };
        setPlan(newPlan);
        setIsSaved(true);
        const updated = { ...project, clientPaymentPlan: newPlan };
        setProject(updated);
    }

    function handleMarkPaid(termId: string) {
        if (!plan) return;
        const updatedTerms = plan.terms.map((t) =>
            t.id === termId
                ? {
                      ...t,
                      status: 'paid' as PaymentTermStatus,
                      paidAt: paidAtDate,
                  }
                : t,
        );
        const updatedPlan = { ...plan, terms: updatedTerms };
        setPlan(updatedPlan);
        setProject((p) => ({ ...p, clientPaymentPlan: updatedPlan }));
        setShowMarkPaidModal(null);
    }

    function handleTerminPercentChange(idx: number, val: number) {
        const newPcts = [...terminPercents];
        newPcts[idx] = val;
        setTerminPercents(newPcts);
    }

    function handleTerminDateChange(idx: number, val: string) {
        const newDates = [...terminDueDates];
        newDates[idx] = val;
        setTerminDueDates(newDates);
    }

    function handleTerminCountChange(count: number) {
        setTerminCount(count);
        // Reset percents evenly
        const base = Math.floor(100 / count);
        const rem = 100 - base * (count - 1);
        setTerminPercents([...Array(count - 1).fill(base), rem]);
        setTerminDueDates(
            Array.from({ length: count }, (_, i) =>
                addDays(new Date(), (i + 1) * 14),
            ),
        );
    }

    const schemes: { value: PaymentScheme; desc: string; color: string }[] = [
        {
            value: 'full',
            desc: 'Bayar satu kali langsung lunas',
            color: 'border-emerald-400 bg-emerald-50 text-emerald-700',
        },
        {
            value: 'dp',
            desc: 'DP di muka, sisanya belakangan',
            color: 'border-blue-400 bg-blue-50 text-blue-700',
        },
        {
            value: 'termin',
            desc: 'Bayar per milestone / progres',
            color: 'border-violet-400 bg-violet-50 text-violet-700',
        },
        {
            value: 'installment',
            desc: 'Cicilan berkala dengan jumlah sama',
            color: 'border-amber-400 bg-amber-50 text-amber-700',
        },
    ];

    return (
        <AppLayout
            title={`Pembayaran — ${project.name}`}
            activePage="projects"
            breadcrumbs={[
                { label: 'Proyek', href: '/projects' },
                { label: project.name, href: '/projects' },
                { label: 'Rencana Pembayaran' },
            ]}
        >
            <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <a
                        href="/projects"
                        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-800"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </a>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-blue-600">
                                {project.code}
                            </span>
                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                                {isPPN ? 'Mode PPN (11%)' : 'Mode Non-PPN'}
                            </span>
                        </div>
                        <h1 className="truncate text-xl font-black text-slate-900">
                            {project.name}
                        </h1>
                        <div className="mt-0.5 text-xs text-slate-500">
                            {project.clientName} &bull; {project.period}
                        </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Invoice
                        </div>
                        <div className="font-mono text-lg font-black text-emerald-600">
                            {fmt(totalInvoice)}
                        </div>
                        {isPPN && (
                            <div className="text-[10px] text-slate-400">
                                Termasuk PPN {fmt(fin.ppnKeluaran)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-6">
                    {/* LEFT: Form Skema */}
                    <div className="col-span-2 space-y-5">
                        <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-sm font-black text-slate-800">
                                    Pengaturan Skema Pembayaran
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Pilih skema dan tentukan jadwal termin
                                </p>
                            </div>

                            {/* Lock Banner — tampil jika sudah ada pembayaran */}
                            {hasPaidTerms && (
                                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
                                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                                        <svg
                                            className="h-4 w-4 text-rose-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-rose-700">
                                            Skema Terkunci
                                        </div>
                                        <div className="mt-0.5 text-[11px] leading-relaxed text-rose-500">
                                            Sudah ada pembayaran yang dicatat.
                                            Skema pembayaran tidak dapat diubah.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scheme Picker */}
                            <div
                                className={`space-y-2 ${hasPaidTerms ? 'pointer-events-none select-none opacity-50' : ''}`}
                            >
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Skema
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {schemes.map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() =>
                                                !hasPaidTerms &&
                                                setSelectedScheme(s.value)
                                            }
                                            disabled={hasPaidTerms}
                                            className={`rounded-xl border-2 p-3 text-left transition-all ${
                                                hasPaidTerms
                                                    ? 'cursor-not-allowed'
                                                    : 'cursor-pointer'
                                            } ${selectedScheme === s.value ? s.color + ' border-current' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                                        >
                                            <div className="text-xs font-black">
                                                {SCHEME_LABELS[s.value]}
                                            </div>
                                            <div className="mt-0.5 text-[10px] opacity-70">
                                                {s.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic form per scheme */}
                            <div
                                className={`space-y-3 border-t border-slate-100 pt-4 ${hasPaidTerms ? 'pointer-events-none select-none opacity-50' : ''}`}
                            >
                                {selectedScheme === 'full' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Tanggal Jatuh Tempo
                                        </label>
                                        <input
                                            type="date"
                                            value={fullDueDate}
                                            onChange={(e) =>
                                                setFullDueDate(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-400 focus:outline-none"
                                        />
                                    </div>
                                )}

                                {selectedScheme === 'dp' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Persentase DP (%)
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min={10}
                                                    max={90}
                                                    step={5}
                                                    value={dpPercent}
                                                    onChange={(e) =>
                                                        setDpPercent(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="flex-1 accent-blue-500"
                                                />
                                                <span className="w-10 text-right text-xs font-black text-blue-600">
                                                    {dpPercent}%
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                DP:{' '}
                                                {fmt(
                                                    Math.round(
                                                        (totalInvoice *
                                                            dpPercent) /
                                                            100,
                                                    ),
                                                )}{' '}
                                                &bull; Sisa:{' '}
                                                {fmt(
                                                    totalInvoice -
                                                        Math.round(
                                                            (totalInvoice *
                                                                dpPercent) /
                                                                100,
                                                        ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Jatuh Tempo DP
                                            </label>
                                            <input
                                                type="date"
                                                value={dpDueDate}
                                                onChange={(e) =>
                                                    setDpDueDate(e.target.value)
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Jatuh Tempo Pelunasan
                                            </label>
                                            <input
                                                type="date"
                                                value={pelDueDate}
                                                onChange={(e) =>
                                                    setPelDueDate(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedScheme === 'termin' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Jumlah Termin
                                            </label>
                                            <div className="flex gap-2">
                                                {[2, 3, 4, 5].map((n) => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() =>
                                                            handleTerminCountChange(
                                                                n,
                                                            )
                                                        }
                                                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${terminCount === n ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                                                    >
                                                        {n}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {Array.from(
                                                { length: terminCount },
                                                (_, i) => (
                                                    <div
                                                        key={i}
                                                        className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3"
                                                    >
                                                        <div className="text-[10px] font-black uppercase text-slate-500">
                                                            Termin {i + 1}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 space-y-0.5">
                                                                <label className="text-[10px] text-slate-400">
                                                                    Persentase
                                                                </label>
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={
                                                                            100
                                                                        }
                                                                        value={
                                                                            terminPercents[
                                                                                i
                                                                            ] ??
                                                                            0
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleTerminPercentChange(
                                                                                i,
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-violet-400 focus:outline-none"
                                                                    />
                                                                    <span className="text-xs text-slate-400">
                                                                        % ={' '}
                                                                        {fmt(
                                                                            Math.round(
                                                                                (totalInvoice *
                                                                                    (terminPercents[
                                                                                        i
                                                                                    ] ??
                                                                                        0)) /
                                                                                    100,
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <label className="text-[10px] text-slate-400">
                                                                Jatuh Tempo
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={
                                                                    terminDueDates[
                                                                        i
                                                                    ] ?? ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleTerminDateChange(
                                                                        i,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-violet-400 focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedScheme === 'installment' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Jumlah Cicilan
                                            </label>
                                            <div className="flex gap-2">
                                                {[2, 3, 4, 6, 12].map((n) => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() =>
                                                            setInstallCount(n)
                                                        }
                                                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${installCount === n ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                                                    >
                                                        {n}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Interval (hari)
                                            </label>
                                            <div className="flex gap-2">
                                                {[7, 14, 30, 60].map((n) => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() =>
                                                            setInstallInterval(
                                                                n,
                                                            )
                                                        }
                                                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${installInterval === n ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                                                    >
                                                        {n === 7
                                                            ? '1 mgg'
                                                            : n === 14
                                                              ? '2 mgg'
                                                              : n === 30
                                                                ? '1 bln'
                                                                : '2 bln'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Tanggal Mulai
                                            </label>
                                            <input
                                                type="date"
                                                value={installStart}
                                                onChange={(e) =>
                                                    setInstallStart(
                                                        e.target.value,
                                                    )
                                                }
                                                onClick={(e) => {
                                                    if (
                                                        'showPicker' in
                                                        HTMLInputElement.prototype
                                                    ) {
                                                        try {
                                                            (
                                                                e.target as HTMLInputElement
                                                            ).showPicker();
                                                        } catch (err) {
                                                            // ignore
                                                        }
                                                    }
                                                }}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-[10px] text-slate-400">
                                            Per cicilan:{' '}
                                            <span className="font-bold text-amber-700">
                                                {fmt(
                                                    Math.floor(
                                                        totalInvoice /
                                                            installCount,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {hasPaidTerms ? (
                                <div className="flex w-full cursor-not-allowed select-none items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-400">
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                    Skema Terkunci (Ada Pembayaran)
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSavePlan}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-slate-800"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {isSaved
                                        ? 'Perbarui Rencana Pembayaran'
                                        : 'Simpan Rencana Pembayaran'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Timeline & Status */}
                    <div className="col-span-3 space-y-5">
                        {/* Summary if plan exists */}
                        {plan && summary && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1 rounded-2xl border border-slate-200/80 bg-white p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Total Tagihan
                                    </div>
                                    <div className="font-mono text-sm font-black text-slate-900">
                                        {fmt(plan.totalAmount)}
                                    </div>
                                </div>
                                <div className="space-y-1 rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                        Sudah Diterima
                                    </div>
                                    <div className="font-mono text-sm font-black text-emerald-700">
                                        {fmt(summary.totalPaid)}
                                    </div>
                                </div>
                                <div className="space-y-1 rounded-2xl border border-rose-200/80 bg-rose-50 p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                                        Sisa Tagihan
                                    </div>
                                    <div className="font-mono text-sm font-black text-rose-600">
                                        {fmt(summary.totalRemaining)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar (if plan exists) */}
                        {plan && summary && (
                            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-500">
                                        Progress Pelunasan
                                    </span>
                                    <span
                                        className={`font-mono font-black ${summary.progressPercent === 100 ? 'text-emerald-600' : 'text-blue-600'}`}
                                    >
                                        {summary.progressPercent}%
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${summary.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                        style={{
                                            width: `${summary.progressPercent}%`,
                                        }}
                                    />
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    {summary.paidCount} dari{' '}
                                    {summary.totalCount} termin selesai
                                </div>
                            </div>
                        )}

                        {/* Terms Table */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
                                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    {plan
                                        ? 'Timeline Pembayaran Aktif'
                                        : 'Preview Termin (Belum Disimpan)'}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {SCHEME_LABELS[selectedScheme]}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {(plan?.terms ?? previewTerms).map(
                                    (term, idx) => {
                                        const isOverdue =
                                            term.status === 'unpaid' &&
                                            new Date(term.dueDate) < new Date();
                                        return (
                                            <div
                                                key={term.id}
                                                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/40"
                                            >
                                                <div
                                                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-black ${term.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {term.status === 'paid' ? (
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2.5}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold text-slate-800">
                                                        {term.label}
                                                    </div>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                        <span>
                                                            Jatuh tempo:{' '}
                                                            {new Date(
                                                                term.dueDate,
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </span>
                                                        {term.paidAt && (
                                                            <span className="font-semibold text-emerald-600">
                                                                ✓ Dibayar:{' '}
                                                                {new Date(
                                                                    term.paidAt,
                                                                ).toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    },
                                                                )}
                                                            </span>
                                                        )}
                                                        {term.notes && (
                                                            <span className="text-slate-300">
                                                                |
                                                            </span>
                                                        )}
                                                        {term.notes && (
                                                            <span className="italic">
                                                                {term.notes}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 text-right">
                                                    <div className="font-mono text-xs font-black text-slate-800">
                                                        {fmt(term.amount)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {term.percent}%
                                                    </div>
                                                </div>

                                                <StatusChip
                                                    status={term.status}
                                                    isOverdue={isOverdue}
                                                />

                                                {/* Mark as Paid button — only on saved plan terms that are unpaid */}
                                                {plan &&
                                                    term.status !== 'paid' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowMarkPaidModal(
                                                                    term.id,
                                                                );
                                                                setPaidAtDate(
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            'T',
                                                                        )[0],
                                                                );
                                                            }}
                                                            className="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 transition-opacity hover:bg-emerald-700 group-hover:opacity-100"
                                                        >
                                                            <svg
                                                                className="h-3 w-3"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                            Tandai Lunas
                                                        </button>
                                                    )}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mark Paid Modal */}
            {showMarkPaidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={() => setShowMarkPaidModal(null)}
                    />
                    <div className="relative w-80 space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">
                                Konfirmasi Pembayaran
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Catat tanggal realisasi penerimaan pembayaran
                                termin ini.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Tanggal Diterima
                            </label>
                            <input
                                type="date"
                                value={paidAtDate}
                                onChange={(e) => setPaidAtDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowMarkPaidModal(null)}
                                className="flex-1 cursor-pointer rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleMarkPaid(showMarkPaidModal)
                                }
                                className="flex-1 cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-700"
                            >
                                Konfirmasi Lunas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
