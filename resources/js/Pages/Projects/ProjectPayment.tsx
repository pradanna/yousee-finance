import React, { useState, useMemo } from "react";
import AppLayout from "@/Layouts/AppLayout";
import {
    Project,
    ClientPaymentPlan,
    PaymentScheme,
    PaymentTerm,
    PaymentTermStatus,
    SCHEME_LABELS,
    calcPaymentSummary,
    fmt,
    FiscalMode,
    calcFinancials,
} from "./projectTypes";
import { initialProjectsPPN, initialProjectsNonPPN } from "./projectData";

// ─── Helpers ────────────────────────────────────────────────────────────────
function addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
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
    }
): PaymentTerm[] {
    const today = new Date();
    switch (scheme) {
        case "full":
            return [
                {
                    id: `term-full-${Date.now()}`,
                    label: "Lunas Sekaligus",
                    amount: totalAmount,
                    percent: 100,
                    dueDate: opts.fullDueDate ?? addDays(today, 14),
                    status: "unpaid",
                },
            ];
        case "dp": {
            const dpPct = opts.dpPercent ?? 30;
            const pelPct = 100 - dpPct;
            return [
                {
                    id: `term-dp-${Date.now()}`,
                    label: `DP ${dpPct}%`,
                    amount: Math.round(totalAmount * dpPct / 100),
                    percent: dpPct,
                    dueDate: opts.dpDueDate ?? addDays(today, 7),
                    status: "unpaid",
                },
                {
                    id: `term-pel-${Date.now()}`,
                    label: `Pelunasan ${pelPct}%`,
                    amount: totalAmount - Math.round(totalAmount * dpPct / 100),
                    percent: pelPct,
                    dueDate: opts.pelunasanDueDate ?? addDays(today, 30),
                    status: "unpaid",
                },
            ];
        }
        case "termin": {
            const count = opts.terminCount ?? 3;
            const percents = opts.terminPercents ?? Array(count).fill(Math.floor(100 / count));
            // Fix rounding: last gets remainder
            const sum = percents.slice(0, -1).reduce((a, b) => a + b, 0);
            percents[percents.length - 1] = 100 - sum;
            let runningAmount = 0;
            return percents.map((pct, i) => {
                const isLast = i === percents.length - 1;
                const amount = isLast ? totalAmount - runningAmount : Math.round(totalAmount * pct / 100);
                runningAmount += amount;
                return {
                    id: `term-t${i + 1}-${Date.now() + i}`,
                    label: i === 0 ? "Termin 1 – Uang Muka" : i === percents.length - 1 ? `Termin ${i + 1} – Pelunasan` : `Termin ${i + 1}`,
                    amount,
                    percent: pct,
                    dueDate: opts.terminDueDates?.[i] ?? addDays(today, (i + 1) * 14),
                    status: "unpaid",
                };
            });
        }
        case "installment": {
            const count = opts.installmentCount ?? 3;
            const perAmount = Math.floor(totalAmount / count);
            const start = opts.installmentStartDate ? new Date(opts.installmentStartDate) : today;
            const interval = opts.installmentIntervalDays ?? 30;
            return Array.from({ length: count }, (_, i) => {
                const isLast = i === count - 1;
                const amount = isLast ? totalAmount - perAmount * (count - 1) : perAmount;
                return {
                    id: `term-ci${i + 1}-${Date.now() + i}`,
                    label: `Cicilan ${i + 1} dari ${count}`,
                    amount,
                    percent: Math.round((amount / totalAmount) * 100),
                    dueDate: addDays(start, interval * (i + 1)),
                    status: "unpaid",
                };
            });
        }
    }
}

// ─── Status Chip ─────────────────────────────────────────────────────────────
function StatusChip({ status, isOverdue }: { status: PaymentTermStatus; isOverdue: boolean }) {
    const map = {
        paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
        unpaid: isOverdue ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-700 border-amber-200",
        overdue: "bg-rose-100 text-rose-700 border-rose-200",
    };
    const label = status === "paid" ? "Lunas" : isOverdue ? "Terlambat" : "Belum Bayar";
    return (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${map[status]}`}>
            {label}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectPayment({ projectId }: { projectId?: number }) {
    // In a real app, this would come from Inertia props.
    // For prototype, we resolve from mock data.
    const urlId = projectId ?? parseInt(window.location.pathname.split("/").filter(Boolean)[1] ?? "1");
    const allProjects = [...initialProjectsPPN, ...initialProjectsNonPPN];
    const initialProject = allProjects.find(p => p.id === urlId) ?? allProjects[0];

    const [project, setProject] = useState<Project>(initialProject);
    const [fiscalMode] = useState<FiscalMode>(initialProject.id >= 100 ? "non-ppn" : "ppn");
    const isPPN = fiscalMode === "ppn";
    const fin = calcFinancials(project, project.locations, fiscalMode);
    const totalInvoice = fin.totalInvoice;

    // Plan state
    const [plan, setPlan] = useState<ClientPaymentPlan | undefined>(project.clientPaymentPlan);
    const [selectedScheme, setSelectedScheme] = useState<PaymentScheme>(plan?.scheme ?? "full");
    const [isSaved, setIsSaved] = useState(!!plan);
    const [showMarkPaidModal, setShowMarkPaidModal] = useState<string | null>(null); // term id
    const [paidAtDate, setPaidAtDate] = useState<string>(new Date().toISOString().split("T")[0]);

    // Form state
    const [fullDueDate, setFullDueDate] = useState(plan?.scheme === "full" ? (plan?.terms[0]?.dueDate ?? addDays(new Date(), 14)) : addDays(new Date(), 14));
    const [dpPercent, setDpPercent] = useState(plan?.scheme === "dp" ? plan.terms[0]?.percent ?? 30 : 30);
    const [dpDueDate, setDpDueDate] = useState(plan?.scheme === "dp" ? (plan.terms[0]?.dueDate ?? addDays(new Date(), 7)) : addDays(new Date(), 7));
    const [pelDueDate, setPelDueDate] = useState(plan?.scheme === "dp" ? (plan.terms[1]?.dueDate ?? addDays(new Date(), 30)) : addDays(new Date(), 30));
    const [terminCount, setTerminCount] = useState(plan?.scheme === "termin" ? plan.terms.length : 3);
    const [terminPercents, setTerminPercents] = useState<number[]>(plan?.scheme === "termin" ? plan.terms.map(t => t.percent) : [30, 40, 30]);
    const [terminDueDates, setTerminDueDates] = useState<string[]>(plan?.scheme === "termin" ? plan.terms.map(t => t.dueDate) : [addDays(new Date(), 7), addDays(new Date(), 21), addDays(new Date(), 45)]);
    const [installCount, setInstallCount] = useState(plan?.scheme === "installment" ? plan.terms.length : 3);
    const [installInterval, setInstallInterval] = useState(30);
    const [installStart, setInstallStart] = useState(addDays(new Date(), 7));

    const summary = plan ? calcPaymentSummary(plan) : null;

    // Business Rule: Skema TIDAK bisa diubah jika sudah ada termin yang terbayar
    const hasPaidTerms = (plan?.terms ?? []).some(t => t.status === "paid");

    // Preview terms from current form
    const previewTerms = useMemo(() => generateTerms(selectedScheme, totalInvoice, {
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
    }), [selectedScheme, totalInvoice, fullDueDate, dpPercent, dpDueDate, pelDueDate, terminCount, terminPercents, terminDueDates, installCount, installInterval, installStart]);

    function handleSavePlan() {
        const newPlan: ClientPaymentPlan = {
            scheme: selectedScheme,
            totalAmount: totalInvoice,
            createdAt: new Date().toISOString().split("T")[0],
            terms: previewTerms,
        };
        setPlan(newPlan);
        setIsSaved(true);
        const updated = { ...project, clientPaymentPlan: newPlan };
        setProject(updated);
    }

    function handleMarkPaid(termId: string) {
        if (!plan) return;
        const updatedTerms = plan.terms.map(t =>
            t.id === termId ? { ...t, status: "paid" as PaymentTermStatus, paidAt: paidAtDate } : t
        );
        const updatedPlan = { ...plan, terms: updatedTerms };
        setPlan(updatedPlan);
        setProject(p => ({ ...p, clientPaymentPlan: updatedPlan }));
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
        setTerminDueDates(Array.from({ length: count }, (_, i) => addDays(new Date(), (i + 1) * 14)));
    }

    const schemes: { value: PaymentScheme; desc: string; color: string }[] = [
        { value: "full", desc: "Bayar satu kali langsung lunas", color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
        { value: "dp", desc: "DP di muka, sisanya belakangan", color: "border-blue-400 bg-blue-50 text-blue-700" },
        { value: "termin", desc: "Bayar per milestone / progres", color: "border-violet-400 bg-violet-50 text-violet-700" },
        { value: "installment", desc: "Cicilan berkala dengan jumlah sama", color: "border-amber-400 bg-amber-50 text-amber-700" },
    ];

    return (
        <AppLayout
            title={`Pembayaran — ${project.name}`}
            activePage="projects"
            breadcrumbs={[
                { label: "Proyek", href: "/projects" },
                { label: project.name, href: "/projects" },
                { label: "Rencana Pembayaran" },
            ]}
        >
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* Header */}
                <div className="flex items-start gap-4">
                    <a
                        href="/projects"
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm flex-shrink-0 mt-0.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </a>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md tracking-wider uppercase border border-blue-100 font-mono">{project.code}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{isPPN ? "Mode PPN (11%)" : "Mode Non-PPN"}</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 truncate">{project.name}</h1>
                        <div className="text-xs text-slate-500 mt-0.5">{project.clientName} &bull; {project.period}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoice</div>
                        <div className="text-lg font-black font-mono text-emerald-600">{fmt(totalInvoice)}</div>
                        {isPPN && <div className="text-[10px] text-slate-400">Termasuk PPN {fmt(fin.ppnKeluaran)}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-6">

                    {/* LEFT: Form Skema */}
                    <div className="col-span-2 space-y-5">
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                            <div>
                                <h2 className="text-sm font-black text-slate-800">Pengaturan Skema Pembayaran</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Pilih skema dan tentukan jadwal termin</p>
                            </div>

                            {/* Lock Banner — tampil jika sudah ada pembayaran */}
                            {hasPaidTerms && (
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-rose-700">Skema Terkunci</div>
                                        <div className="text-[11px] text-rose-500 mt-0.5 leading-relaxed">
                                            Sudah ada pembayaran yang dicatat. Skema pembayaran tidak dapat diubah.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scheme Picker */}
                            <div className={`space-y-2 ${hasPaidTerms ? "opacity-50 pointer-events-none select-none" : ""}`}>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Skema</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {schemes.map(s => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => !hasPaidTerms && setSelectedScheme(s.value)}
                                            disabled={hasPaidTerms}
                                            className={`text-left p-3 rounded-xl border-2 transition-all ${
                                                hasPaidTerms ? "cursor-not-allowed" : "cursor-pointer"
                                            } ${selectedScheme === s.value ? s.color + " border-current" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
                                        >
                                            <div className="text-xs font-black">{SCHEME_LABELS[s.value]}</div>
                                            <div className="text-[10px] mt-0.5 opacity-70">{s.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic form per scheme */}
                            <div className={`space-y-3 border-t border-slate-100 pt-4 ${hasPaidTerms ? "opacity-50 pointer-events-none select-none" : ""}`}>
                                {selectedScheme === "full" && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Jatuh Tempo</label>
                                        <input type="date" value={fullDueDate} onChange={e => setFullDueDate(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400" />
                                    </div>
                                )}

                                {selectedScheme === "dp" && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Persentase DP (%)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="range" min={10} max={90} step={5} value={dpPercent} onChange={e => setDpPercent(Number(e.target.value))} className="flex-1 accent-blue-500" />
                                                <span className="text-xs font-black text-blue-600 w-10 text-right">{dpPercent}%</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">DP: {fmt(Math.round(totalInvoice * dpPercent / 100))} &bull; Sisa: {fmt(totalInvoice - Math.round(totalInvoice * dpPercent / 100))}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jatuh Tempo DP</label>
                                            <input type="date" value={dpDueDate} onChange={e => setDpDueDate(e.target.value)}
                                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jatuh Tempo Pelunasan</label>
                                            <input type="date" value={pelDueDate} onChange={e => setPelDueDate(e.target.value)}
                                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400" />
                                        </div>
                                    </div>
                                )}

                                {selectedScheme === "termin" && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Termin</label>
                                            <div className="flex gap-2">
                                                {[2, 3, 4, 5].map(n => (
                                                    <button key={n} type="button" onClick={() => handleTerminCountChange(n)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${terminCount === n ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                                                    >{n}x</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {Array.from({ length: terminCount }, (_, i) => (
                                                <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200/80">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase">Termin {i + 1}</div>
                                                    <div className="flex gap-2 items-center">
                                                        <div className="flex-1 space-y-0.5">
                                                            <label className="text-[10px] text-slate-400">Persentase</label>
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" min={1} max={100} value={terminPercents[i] ?? 0}
                                                                    onChange={e => handleTerminPercentChange(i, Number(e.target.value))}
                                                                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400" />
                                                                <span className="text-xs text-slate-400">% = {fmt(Math.round(totalInvoice * (terminPercents[i] ?? 0) / 100))}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[10px] text-slate-400">Jatuh Tempo</label>
                                                        <input type="date" value={terminDueDates[i] ?? ""}
                                                            onChange={e => handleTerminDateChange(i, e.target.value)}
                                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedScheme === "installment" && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Cicilan</label>
                                            <div className="flex gap-2">
                                                {[2, 3, 4, 6, 12].map(n => (
                                                    <button key={n} type="button" onClick={() => setInstallCount(n)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${installCount === n ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                                                    >{n}x</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interval (hari)</label>
                                            <div className="flex gap-2">
                                                {[7, 14, 30, 60].map(n => (
                                                    <button key={n} type="button" onClick={() => setInstallInterval(n)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${installInterval === n ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                                                    >{n === 7 ? "1 mgg" : n === 14 ? "2 mgg" : n === 30 ? "1 bln" : "2 bln"}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Mulai</label>
                                            <input type="date" value={installStart} onChange={e => setInstallStart(e.target.value)}
                                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400" />
                                        </div>
                                        <div className="text-[10px] text-slate-400 bg-amber-50 border border-amber-100 rounded-lg p-2">
                                            Per cicilan: <span className="font-bold text-amber-700">{fmt(Math.floor(totalInvoice / installCount))}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {hasPaidTerms ? (
                                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-400 text-xs font-black rounded-xl cursor-not-allowed select-none">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Skema Terkunci (Ada Pembayaran)
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSavePlan}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {isSaved ? "Perbarui Rencana Pembayaran" : "Simpan Rencana Pembayaran"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Timeline & Status */}
                    <div className="col-span-3 space-y-5">

                        {/* Summary if plan exists */}
                        {plan && summary && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</div>
                                    <div className="text-sm font-black font-mono text-slate-900">{fmt(plan.totalAmount)}</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Sudah Diterima</div>
                                    <div className="text-sm font-black font-mono text-emerald-700">{fmt(summary.totalPaid)}</div>
                                </div>
                                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-1">
                                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Sisa Tagihan</div>
                                    <div className="text-sm font-black font-mono text-rose-600">{fmt(summary.totalRemaining)}</div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar (if plan exists) */}
                        {plan && summary && (
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-500">Progress Pelunasan</span>
                                    <span className={`font-black font-mono ${summary.progressPercent === 100 ? "text-emerald-600" : "text-blue-600"}`}>{summary.progressPercent}%</span>
                                </div>
                                <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${summary.progressPercent === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                        style={{ width: `${summary.progressPercent}%` }} />
                                </div>
                                <div className="text-[10px] text-slate-400">{summary.paidCount} dari {summary.totalCount} termin selesai</div>
                            </div>
                        )}

                        {/* Terms Table */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    {plan ? "Timeline Pembayaran Aktif" : "Preview Termin (Belum Disimpan)"}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {SCHEME_LABELS[selectedScheme]}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {(plan?.terms ?? previewTerms).map((term, idx) => {
                                    const isOverdue = term.status === "unpaid" && new Date(term.dueDate) < new Date();
                                    return (
                                        <div key={term.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/40 transition-colors group">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${term.status === "paid" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                                {term.status === "paid" ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : idx + 1}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-800">{term.label}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                                    <span>Jatuh tempo: {new Date(term.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                    {term.paidAt && (
                                                        <span className="text-emerald-600 font-semibold">
                                                            ✓ Dibayar: {new Date(term.paidAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                                        </span>
                                                    )}
                                                    {term.notes && <span className="text-slate-300">|</span>}
                                                    {term.notes && <span className="italic">{term.notes}</span>}
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <div className="text-xs font-black font-mono text-slate-800">{fmt(term.amount)}</div>
                                                <div className="text-[10px] text-slate-400">{term.percent}%</div>
                                            </div>

                                            <StatusChip status={term.status} isOverdue={isOverdue} />

                                            {/* Mark as Paid button — only on saved plan terms that are unpaid */}
                                            {plan && term.status !== "paid" && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowMarkPaidModal(term.id); setPaidAtDate(new Date().toISOString().split("T")[0]); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer flex-shrink-0"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Tandai Lunas
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mark Paid Modal */}
            {showMarkPaidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowMarkPaidModal(null)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-80 space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Konfirmasi Pembayaran</h3>
                            <p className="text-xs text-slate-500 mt-1">Catat tanggal realisasi penerimaan pembayaran termin ini.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Diterima</label>
                            <input
                                type="date"
                                value={paidAtDate}
                                onChange={e => setPaidAtDate(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowMarkPaidModal(null)}
                                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMarkPaid(showMarkPaidModal)}
                                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer"
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
