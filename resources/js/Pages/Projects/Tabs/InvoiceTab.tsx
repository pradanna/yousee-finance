import { router } from '@inertiajs/react';
import React from 'react';
import { Project, fmt, SCHEME_LABELS, ClientPaymentPlan, PaymentTermStatus, formatIndoDate, calcPaymentSummary, calcFinancials, PaymentTerm } from '../projectTypes';
import { StatusBadge } from '../Show';

export default function InvoiceTab({ 
    project, 
    isPPN,
    onOpenInvoiceModal,
    onOpenPaymentModal,
    onUpdateProject,
    onTriggerToast,
}: { 
    project: Project;
    isPPN: boolean;
    onOpenInvoiceModal: () => void;
    onOpenPaymentModal: (term: PaymentTerm, targetAmt: number) => void;
    onUpdateProject: (p: Project) => void;
    onTriggerToast?: (message: string, type?: 'success' | 'error' | 'info', title?: string) => void;
}) {
    
    const PPN_RATE = 0.11;
    const fin = calcFinancials(project, project.locations, isPPN ? 'ppn' : 'non-ppn');
    const dueAlerts: PaymentTerm[] = [];
    const hasPaidTerm = project.clientPaymentPlan?.terms?.some(t => t.status === 'paid') || false;

    const handleDownloadInvoicePdf = (term?: PaymentTerm) => {
        const isTermin = !!term;
        const totalContractDpp = project.contractValue;
        const totalContractInvoice = isPPN ? Math.round(totalContractDpp * 1.11) : totalContractDpp;

        // Jika cetak invoice per termin:
        // DPP termin = term.amount
        // PPN termin = isPPN ? round(term.amount * 0.11) : 0
        // Grand Total termin = isPPN ? round(term.amount * 1.11) : term.amount
        const dppValue = isTermin ? term.amount : totalContractDpp;
        const invoiceTotalValue = isPPN ? Math.round(dppValue * 1.11) : dppValue;

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/client-invoice-pdf';
        form.target = '_blank';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('clientName', project.clientName);
        appendInput('clientSubName', 'Attn: Finance & Procurement');
        appendInput('invoiceNumber', project.invoiceNumber || 'INV-06/2026/001');
        appendInput('invoiceDate', new Date().toLocaleDateString('id-ID'));
        appendInput('isPPN', isPPN ? 'true' : 'false');
        appendInput('dpAmount', '0'); // Tidak mengurangi DP dari subtotal agar total pas sesuai tagihan termin / master
        appendInput('subtotal', String(dppValue));
        appendInput('contractTotalDpp', String(totalContractDpp));
        appendInput('contractTotalInvoice', String(totalContractInvoice));
        appendInput('termLabel', isTermin ? `${term.label} (${term.percent}%)` : 'Tagihan Keseluruhan Kontrak');
        appendInput('stream', 'true');

        if (project.locations && project.locations.length > 0) {
            const locCount = project.locations.length;
            const pricePerLoc = Math.round(dppValue / locCount);
            
            project.locations.forEach((loc, i) => {
                // Lokasi terakhir menampung sisa pembagian agar jumlah total lokasi persis sama dengan dppValue
                const actualLocPrice = (i === locCount - 1)
                    ? (dppValue - (pricePerLoc * (locCount - 1)))
                    : pricePerLoc;

                appendInput(`locations[${i}][type]`, loc.type);
                appendInput(`locations[${i}][size]`, loc.size);
                appendInput(`locations[${i}][orientation]`, loc.orientation || 'V');
                appendInput(`locations[${i}][description]`, loc.description);
                appendInput(`locations[${i}][area]`, loc.area);
                appendInput(`locations[${i}][qty]`, String(loc.qty ?? 1));
                appendInput(`locations[${i}][clientPrice]`, String(actualLocPrice));
                appendInput(`locations[${i}][vendorCost]`, String(actualLocPrice));
            });
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleDownloadKwitansiPdf = (term: PaymentTerm) => {
        const totalAmount = isPPN ? Math.round(term.amount * 1.11) : term.amount;
        const paidAmount = term.paidAmount 
            ? (isPPN ? Math.round(term.paidAmount * 1.11) : term.paidAmount)
            : totalAmount;

        const locDetails =
            project.locations && project.locations.length > 0
                ? project.locations
                      .map(
                          (loc) =>
                              `Pemasangan ${loc.type} ${loc.size} ${loc.description}${loc.area ? ' (' + loc.area + ')' : ''}`,
                      )
                      .join(' dan ')
                : project.name;

        const totalTerms = project.clientPaymentPlan?.terms?.length || 1;
        const termIdx = (project.clientPaymentPlan?.terms?.findIndex(t => t.id === term.id) ?? 0) + 1;
        const receiptNum = term.paymentRef ? `KW-${term.paymentRef}` : `KW-${project.invoiceNumber || project.code}-${termIdx}`;
        const dateVal = term.paidAt || new Date().toISOString().split('T')[0];
        const paymentDesc = `Pembayaran ${term.label} (${totalTerms > 1 ? totalTerms + ' Termin' : 'Lunas'}) Sewa Media Iklan - ${locDetails}`;

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/kwitansi-pdf';
        form.target = '_blank';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('receiptNumber', receiptNum);
        appendInput('receivedFrom', project.clientName);
        appendInput('amount', String(paidAmount));
        appendInput('forPaymentOf', paymentDesc);
        appendInput('date', dateVal);
        appendInput('stream', 'true');

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
                                <div className="space-y-6">
                                    {/* Header Summary Cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Status Invoice Client
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {project.invoiceIssued ? (
                                                    <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                                        Sudah Diterbitkan
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                        Draft (Belum Terbit)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-blue-200/80 bg-blue-50 p-4">
                                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                Nomor Invoice
                                            </div>
                                            <div className="font-mono text-sm font-bold text-blue-900">
                                                {project.invoiceIssued
                                                    ? project.invoiceNumber ||
                                                      'INV-PPN-2026/001'
                                                    : 'Belum Diterbitkan'}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4">
                                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                                {isPPN
                                                    ? 'Total Tagihan (+PPN 11%)'
                                                    : 'Total Tagihan Client'}
                                            </div>
                                            <div className="font-mono text-sm font-bold text-emerald-700">
                                                {fmt(fin.totalInvoice)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Due Date Alert Reminder Banner */}
                                    {dueAlerts.length > 0 && (
                                        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                            <div className="shadow-2xs flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 font-bold text-white">
                                                🔔
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                                                    Pengingat Penagihan:{' '}
                                                    {dueAlerts.length} Termin
                                                    Membutuhkan Follow-Up Client
                                                </div>
                                                <div className="mt-1 space-y-0.5 text-[11px] text-amber-800/90">
                                                    {dueAlerts.map(
                                                        (alertTerm) => {
                                                            const today =
                                                                new Date();
                                                            const due =
                                                                new Date(
                                                                    alertTerm.dueDate,
                                                                );
                                                            const diffDays =
                                                                Math.ceil(
                                                                    (due.getTime() -
                                                                        today.getTime()) /
                                                                        (1000 *
                                                                            3600 *
                                                                            24),
                                                                );
                                                            const isOverdue =
                                                                diffDays < 0;
                                                            return (
                                                                <div
                                                                    key={
                                                                        alertTerm.id
                                                                    }
                                                                    className="flex items-center gap-1.5 font-medium"
                                                                >
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                                                    <span>
                                                                        {
                                                                            alertTerm.label
                                                                        }{' '}
                                                                        (
                                                                        {fmt(
                                                                            isPPN
                                                                                ? Math.round(
                                                                                      alertTerm.amount *
                                                                                          1.11,
                                                                                  )
                                                                                : alertTerm.amount,
                                                                        )}
                                                                        )
                                                                    </span>
                                                                    <span
                                                                        className={`py-0.2 rounded px-1.5 text-[10px] font-bold ${isOverdue ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}
                                                                    >
                                                                        {isOverdue
                                                                            ? `Terlambat ${Math.abs(diffDays)} hari!`
                                                                            : `Jatuh tempo ${diffDays} hari lagi (${formatIndoDate(alertTerm.dueDate)})`}
                                                                    </span>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Main Document Preview & Issuance Card */}
                                    <div className="shadow-xs space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                            <div>
                                                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                                    <span className="h-2 w-2 rounded-full bg-blue-600" />{' '}
                                                    Penagihan & Skema Pembayaran
                                                    Client
                                                </h3>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Atur skema termin, tanggal
                                                    jatuh tempo, dan terbitkan
                                                    invoice resmi
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Case 1: No Payment Plan yet */}
                                                {!project.clientPaymentPlan ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onOpenInvoiceModal()
                                                        }
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
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
                                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                            />
                                                        </svg>
                                                        Atur Skema Pembayaran
                                                    </button>
                                                ) : !project.invoiceIssued ? (
                                                    /* Case 2: Payment Plan set, Invoice NOT issued yet */
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onOpenInvoiceModal()
                                                            }
                                                            className="cursor-pointer rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                                                        >
                                                            Ubah Skema
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Pastikan URL hash tetap di #invoice
                                                                if (typeof window !== 'undefined') {
                                                                    const currentUrl = new URL(window.location.href);
                                                                    currentUrl.hash = 'invoice';
                                                                    window.history.replaceState(null, '', currentUrl.toString());
                                                                }

                                                                router.post(
                                                                    `/projects/${project.id}/invoice/issue`,
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                        preserveState: true,
                                                                        onSuccess: () => {
                                                                            if (onTriggerToast) {
                                                                                onTriggerToast(
                                                                                    `Invoice resmi proyek ${project.name} berhasil diterbitkan dan piutang tercatat di jurnal akuntansi.`,
                                                                                    'success',
                                                                                    'Invoice Diterbitkan',
                                                                                );
                                                                            }
                                                                        },
                                                                        onError: (errs) => {
                                                                            const errorMsg = Object.values(errs).flat().join(' ') || 'Gagal menerbitkan invoice.';
                                                                            if (onTriggerToast) {
                                                                                onTriggerToast(
                                                                                    errorMsg,
                                                                                    'error',
                                                                                    'Penerbitan Gagal',
                                                                                );
                                                                            }
                                                                        },
                                                                    },
                                                                );
                                                            }}
                                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700"
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
                                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            Terbitkan Invoice
                                                            Resmi
                                                        </button>
                                                    </>
                                                ) : (
                                                    /* Case 3: Invoice already issued */
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDownloadInvoicePdf()
                                                            }
                                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
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
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                            Cetak Invoice Utama
                                                        </button>

                                                        {!hasPaidTerm ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onOpenInvoiceModal()
                                                                }
                                                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                                            >
                                                                Ubah Skema
                                                            </button>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                                                                Skema Terkunci
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Plan / Term breakdown table for Invoice */}
                                        {project.clientPaymentPlan &&
                                        project.clientPaymentPlan.terms.length >
                                            0 ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-slate-800">
                                                        Tahapan Penagihan per
                                                        Termin (
                                                        {
                                                            SCHEME_LABELS[
                                                                project
                                                                    .clientPaymentPlan
                                                                    .scheme
                                                            ]
                                                        }
                                                        )
                                                    </h4>
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        Total{' '}
                                                        {
                                                            project
                                                                .clientPaymentPlan
                                                                .terms.length
                                                        }{' '}
                                                        Termin Penagihan
                                                    </span>
                                                </div>

                                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                                    {project.clientPaymentPlan.terms.map(
                                                        (term, tIdx) => {
                                                            const termAmountWithPpn =
                                                                isPPN
                                                                    ? Math.round(
                                                                          term.amount *
                                                                              1.11,
                                                                      )
                                                                    : term.amount;
                                                            const today =
                                                                new Date();
                                                            const due =
                                                                new Date(
                                                                    term.dueDate,
                                                                );
                                                            const isOverdue =
                                                                term.status ===
                                                                    'unpaid' &&
                                                                due < today;

                                                            return (
                                                                <div
                                                                    key={
                                                                        term.id
                                                                    }
                                                                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/50"
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                        <div
                                                                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                                                term.status ===
                                                                                'paid'
                                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                                    : isOverdue
                                                                                      ? 'border border-rose-200 bg-rose-100 text-rose-700'
                                                                                      : 'border border-blue-100 bg-blue-50 text-blue-700'
                                                                            }`}
                                                                        >
                                                                            {term.status ===
                                                                            'paid'
                                                                                ? '✓'
                                                                                : tIdx +
                                                                                  1}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="truncate text-xs font-bold text-slate-900">
                                                                                    {
                                                                                        term.label
                                                                                    }
                                                                                </span>
                                                                                {(() => {
                                                                                    const isPartial =
                                                                                        term.status !==
                                                                                            'paid' &&
                                                                                        term.paidAmount &&
                                                                                        term.paidAmount >
                                                                                            0;
                                                                                    return (
                                                                                        <span
                                                                                            className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold ${
                                                                                                term.status ===
                                                                                                'paid'
                                                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                                                    : isPartial
                                                                                                      ? 'border-blue-200 bg-blue-50 font-extrabold text-blue-700'
                                                                                                      : isOverdue
                                                                                                        ? 'animate-pulse border-rose-200 bg-rose-50 text-rose-700'
                                                                                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                                                                            }`}
                                                                                        >
                                                                                            {term.status ===
                                                                                            'paid'
                                                                                                ? 'Lunas'
                                                                                                : isPartial
                                                                                                  ? 'Bayar Parsial'
                                                                                                  : isOverdue
                                                                                                    ? 'Terlambat'
                                                                                                    : 'Belum Bayar'}
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                            <div className="mt-0.5 text-[10px] text-slate-400">
                                                                                Porsi:{' '}
                                                                                <span className="font-semibold text-slate-600">
                                                                                    {
                                                                                        term.percent
                                                                                    }

                                                                                    %
                                                                                </span>{' '}
                                                                                &bull;
                                                                                Jatuh
                                                                                Tempo:{' '}
                                                                                <span className="font-semibold text-slate-700">
                                                                                    {formatIndoDate(
                                                                                        term.dueDate,
                                                                                    )}
                                                                                </span>
                                                                                {term.paidAt && (
                                                                                    <span className="font-medium text-emerald-600">
                                                                                        {' '}
                                                                                        &bull;
                                                                                        Dibayar:{' '}
                                                                                        {formatIndoDate(
                                                                                            term.paidAt,
                                                                                        )}
                                                                                        {term.paidAmount &&
                                                                                            ` (${fmt(isPPN ? Math.round(term.paidAmount * 1.11) : term.paidAmount)})`}
                                                                                        {term.paymentMethod &&
                                                                                            ` via ${term.paymentMethod}`}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-shrink-0 items-center gap-3">
                                                                        <div className="text-right">
                                                                            <div className="font-mono text-xs font-black text-slate-900">
                                                                                {fmt(
                                                                                    termAmountWithPpn,
                                                                                )}
                                                                            </div>
                                                                            <div className="text-[9px] text-slate-400">
                                                                                {isPPN
                                                                                    ? 'Termasuk PPN 11%'
                                                                                    : 'Non-PPN'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Tombol Cetak Invoice Dokumen PDF */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleDownloadInvoicePdf(
                                                                                    term,
                                                                                )
                                                                            }
                                                                            className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-700"
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
                                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                />
                                                                            </svg>
                                                                            Cetak Invoice
                                                                        </button>

                                                                        {/* Tombol Cetak Kwitansi jika termin sudah lunas */}
                                                                        {term.status === 'paid' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleDownloadKwitansiPdf(
                                                                                        term,
                                                                                    )
                                                                                }
                                                                                className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100"
                                                                            >
                                                                                <svg
                                                                                    className="h-3.5 w-3.5 text-emerald-600"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth={2}
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                    />
                                                                                </svg>
                                                                                Cetak Kwitansi
                                                                            </button>
                                                                        )}

                                                                        {term.status !== 'paid' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const targetAmt =
                                                                                        isPPN
                                                                                            ? Math.round(
                                                                                                  term.amount *
                                                                                                      1.11,
                                                                                              )
                                                                                            : term.amount;
                                                                                    const existingPaid =
                                                                                        term.paidAmount
                                                                                            ? isPPN
                                                                                                ? Math.round(
                                                                                                      term.paidAmount *
                                                                                                          1.11,
                                                                                                  )
                                                                                                : term.paidAmount
                                                                                            : 0;
                                                                                    const remTarget =
                                                                                        Math.max(
                                                                                            0,
                                                                                            targetAmt -
                                                                                                existingPaid,
                                                                                        );

                                                                                    onOpenPaymentModal(
                                                                                        term,
                                                                                        remTarget > 0
                                                                                            ? remTarget
                                                                                            : targetAmt,
                                                                                    );
                                                                                }}
                                                                                className="shadow-2xs cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                                                                            >
                                                                                Terima Pembayaran
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Riwayat Penerimaan Pembayaran Client */}
                                        {project.clientPaymentPlan && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                                    <div>
                                                        <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                            Riwayat Penerimaan
                                                            Pembayaran Client
                                                        </h4>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                                            Catatan log
                                                            transaksi dana masuk
                                                            dari client
                                                        </p>
                                                    </div>
                                                    {(() => {
                                                        const paidTerms =
                                                            project.clientPaymentPlan.terms.filter(
                                                                (t) =>
                                                                    t.paidAt ||
                                                                    (t.paidAmount &&
                                                                        t.paidAmount >
                                                                            0) ||
                                                                    t.status ===
                                                                        'paid',
                                                            );
                                                        return (
                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                                {
                                                                    paidTerms.length
                                                                }{' '}
                                                                Transaksi Masuk
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                {(() => {
                                                    const paidTerms =
                                                        project.clientPaymentPlan.terms.filter(
                                                            (t) =>
                                                                t.paidAt ||
                                                                (t.paidAmount &&
                                                                    t.paidAmount >
                                                                        0) ||
                                                                t.status ===
                                                                    'paid',
                                                        );
                                                    if (
                                                        paidTerms.length === 0
                                                    ) {
                                                        return (
                                                            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 text-center">
                                                                <div className="text-xs font-semibold text-slate-500">
                                                                    Belum ada
                                                                    riwayat
                                                                    pembayaran
                                                                </div>
                                                                <div className="mt-0.5 text-[10px] text-slate-400">
                                                                    Klik tombol
                                                                    "Terima
                                                                    Pembayaran"
                                                                    pada termin
                                                                    di atas
                                                                    untuk
                                                                    mencatat
                                                                    pembayaran
                                                                    masuk
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                                            {paidTerms.map(
                                                                (
                                                                    term,
                                                                    pIdx,
                                                                ) => {
                                                                    const paidAmtDpp =
                                                                        term.paidAmount ||
                                                                        term.amount;
                                                                    const paidAmtWithPpn =
                                                                        isPPN
                                                                            ? Math.round(
                                                                                  paidAmtDpp *
                                                                                      1.11,
                                                                              )
                                                                            : paidAmtDpp;
                                                                    const isFullPaid =
                                                                        term.status ===
                                                                        'paid';

                                                                    return (
                                                                        <div
                                                                            key={`history-${term.id}-${pIdx}`}
                                                                            className="flex items-center justify-between gap-3 bg-slate-50/30 p-3.5 text-xs"
                                                                        >
                                                                            <div className="flex min-w-0 items-center gap-3">
                                                                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700">
                                                                                    ↓
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="truncate font-bold text-slate-900">
                                                                                            {
                                                                                                term.label
                                                                                            }
                                                                                        </span>
                                                                                        <span
                                                                                            className={`py-0.2 rounded border px-1.5 text-[9px] font-bold ${
                                                                                                isFullPaid
                                                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                                                    : 'border-blue-200 bg-blue-50 text-blue-700'
                                                                                            }`}
                                                                                        >
                                                                                            {isFullPaid
                                                                                                ? 'Lunas'
                                                                                                : 'Parsial'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                                                        <span>
                                                                                            Tgl:{' '}
                                                                                            <strong className="text-slate-600">
                                                                                                {formatIndoDate(
                                                                                                    term.paidAt,
                                                                                                )}
                                                                                            </strong>
                                                                                        </span>
                                                                                        <span>
                                                                                            &bull;
                                                                                        </span>
                                                                                        <span>
                                                                                            Metode:{' '}
                                                                                            <strong className="text-slate-600">
                                                                                                {term.paymentMethod ||
                                                                                                    'Transfer Bank BCA'}
                                                                                            </strong>
                                                                                        </span>
                                                                                        {term.paymentRef && (
                                                                                            <>
                                                                                                <span>
                                                                                                    &bull;
                                                                                                </span>
                                                                                                <span>
                                                                                                    Ref:{' '}
                                                                                                    <strong className="font-mono text-slate-600">
                                                                                                        {
                                                                                                            term.paymentRef
                                                                                                        }
                                                                                                    </strong>
                                                                                                </span>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-shrink-0 items-center gap-3">
                                                                                <div className="text-right">
                                                                                    <div className="font-mono text-xs font-black text-emerald-700">
                                                                                        +{' '}
                                                                                        {fmt(
                                                                                            paidAmtWithPpn,
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-[9px] font-medium text-slate-400">
                                                                                        Dana Masuk Diterima
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleDownloadKwitansiPdf(
                                                                                            term,
                                                                                        )
                                                                                    }
                                                                                    className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100"
                                                                                    title="Cetak Kwitansi Pembayaran Resmi"
                                                                                >
                                                                                    <svg
                                                                                        className="h-3.5 w-3.5 text-emerald-600"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth={2}
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                        />
                                                                                    </svg>
                                                                                    Kwitansi
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Client & Invoice Meta Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Ditagihkan Kepada (Client)
                                                </div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    {project.clientName}
                                                </div>
                                                <div className="space-y-0.5 text-[11px] text-slate-500">
                                                    <div>
                                                        Sales PIC:{' '}
                                                        <span className="font-semibold text-slate-700">
                                                            {project.salesPIC}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Periode Sewa:{' '}
                                                        <span className="font-semibold text-slate-700">
                                                            {project.period}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Skema Pembayaran
                                                </div>
                                                {project.clientPaymentPlan ? (
                                                    (() => {
                                                        const plan =
                                                            project.clientPaymentPlan!;
                                                        const summary =
                                                            calcPaymentSummary(
                                                                plan,
                                                            );
                                                        return (
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                                                        {
                                                                            SCHEME_LABELS[
                                                                                plan
                                                                                    .scheme
                                                                            ]
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-0.5 text-[11px] text-slate-500">
                                                                    <div>
                                                                        Progress:{' '}
                                                                        <span
                                                                            className={`font-semibold ${summary.progressPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}
                                                                        >
                                                                            {
                                                                                summary.progressPercent
                                                                            }
                                                                            % (
                                                                            {
                                                                                summary.paidCount
                                                                            }
                                                                            /
                                                                            {
                                                                                summary.totalCount
                                                                            }{' '}
                                                                            termin)
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        Mode
                                                                        Pajak:{' '}
                                                                        <span className="font-semibold text-slate-700">
                                                                            {isPPN
                                                                                ? 'PPN 11%'
                                                                                : 'Non-PPN'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-bold text-amber-700">
                                                            Belum Diatur
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">
                                                            Mode Pajak:{' '}
                                                            <span className="font-semibold text-slate-700">
                                                                {isPPN
                                                                    ? 'PPN 11%'
                                                                    : 'Non-PPN'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rincian Total Tagihan */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Ringkasan Tagihan Akhir
                                                    Proyek
                                                </div>
                                                <div className="mt-0.5 text-xs font-medium text-slate-600">
                                                    {isPPN
                                                        ? `DPP (${fmt(fin.dpp)}) + PPN 11% (${fmt(fin.ppnKeluaran)})`
                                                        : `DPP (${fmt(fin.dpp)}) - Non PPN`}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Grand Total Invoice
                                                </div>
                                                <div className="font-mono text-base font-bold text-slate-900">
                                                    {fmt(fin.totalInvoice)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

    );
}
