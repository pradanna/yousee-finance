import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    BillboardLocation,
    fmt,
    formatIndoDate,
    PaymentScheme,
    Project,
    PurchaseOrderWithPlan,
    VendorPaymentRecord,
} from '../projectTypes';

export default function VendorPOTab({
    locations,
    isPPN,
    project,
    projectId,
    purchaseOrders,
    cashBankAccounts = [],
    onIssuePO,
    onIssueBulkPO,
    onUpdateProject,
}: {
    locations: BillboardLocation[];
    isPPN: boolean;
    project: Project;
    projectId: string;
    purchaseOrders: PurchaseOrderWithPlan[];
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
    onIssuePO: (
        locId: string | number,
        poNumber: string,
        lighting?: 'Berlampu' | 'Tidak Berlampu',
        topNotes?: string,
        vendorTermScheme?: PaymentScheme,
        vendorTermPercents?: number[],
        vendorTermDates?: string[],
    ) => void;
    onIssueBulkPO?: (
        vendorId: string | number,
        locationIds: Array<string | number>,
        poNumber: string,
        lighting?: 'Berlampu' | 'Tidak Berlampu',
        topNotes?: string,
        vendorTermScheme?: PaymentScheme,
        vendorTermPercents?: number[],
        vendorTermDates?: string[],
    ) => void;
    onUpdateProject: (updated: Project) => void;
}) {
    const [confirmingLoc, setConfirmingLoc] =
        useState<BillboardLocation | null>(null);
    const [confirmingVendorGroup, setConfirmingVendorGroup] = useState<{
        vendorId: string | number;
        vendorName: string;
        unissuedItems: BillboardLocation[];
    } | null>(null);
    const [poLighting, setPoLighting] = useState<'Berlampu' | 'Tidak Berlampu'>(
        'Berlampu',
    );
    const [poTopNotes, setPoTopNotes] = useState<string>(
        'Lunas setelah visual terpasang',
    );

    // Vendor Payment Modal State
    const [selectedVendorForPay, setSelectedVendorForPay] = useState<{
        vendorName: string;
        poNumber: string;
        poId?: string | number;
        totalAmount: number;
        remainingAmount: number;
        schedule: Array<{
            id: string;
            label: string;
            percent: number;
            targetAmount: number;
            paidAmount: number;
            remainingAmount: number;
            dueDate: string;
            isPaid: boolean;
            isPartial: boolean;
            poId?: string | number;
            poNumber?: string;
        }>;
        selectedTermId?: string;
    } | null>(null);
    const [vPayType, setVPayType] = useState<'full' | 'partial'>('full');
    const [vPayAmountInput, setVPayAmountInput] = useState<number>(0);
    const [vPayDateInput, setVPayDateInput] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [vPayMethodInput, setVPayMethodInput] =
        useState<string>('Transfer Bank BCA');
    const [vPayAccountId, setVPayAccountId] = useState<string | number>(
        cashBankAccounts[0]?.id ? String(cashBankAccounts[0].id) : '',
    );
    const [vPayRefInput, setVPayRefInput] = useState<string>('');
    const [vPayNotesInput, setVPayNotesInput] = useState<string>('');

    // Collapsible Vendor TOP State
    const [expandedVendorTop, setExpandedVendorTop] = useState<
        Record<string | number, boolean>
    >({});

    // Vendor TOP Terms Breakdown State
    const [vendorTermScheme, setVendorTermScheme] =
        useState<PaymentScheme>('full');
    const [vendorTermPercents, setVendorTermPercents] = useState<number[]>([
        100,
    ]);
    const [vendorTermDates, setVendorTermDates] = useState<string[]>([
        new Date().toISOString().split('T')[0],
    ]);

    const handleSelectVendorScheme = (scheme: PaymentScheme) => {
        setVendorTermScheme(scheme);
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        const month2 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

        if (scheme === 'full') {
            setVendorTermPercents([100]);
            setVendorTermDates([today]);
            setPoTopNotes('Lunas setelah visual terpasang');
        } else if (scheme === 'dp') {
            setVendorTermPercents([50, 50]);
            setVendorTermDates([today, nextMonth]);
            setPoTopNotes('DP 50%, Pelunasan 50% setelah terpasang');
        } else if (scheme === 'termin') {
            setVendorTermPercents([30, 40, 30]);
            setVendorTermDates([today, nextMonth, month2]);
            setPoTopNotes('Termin 3 Tahap (30%, 40%, 30%)');
        } else if (scheme === 'installment') {
            setVendorTermPercents([100]);
            setVendorTermDates([nextMonth]);
            setPoTopNotes('Tempo 30 Hari (Net 30)');
        }
    };

    const handleDownloadPO = (
        vendorName: string,
        poNumber: string,
        items: BillboardLocation[],
    ) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/po-pdf';
        form.target = '_blank';

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('vendorName', vendorName);
        appendInput('poNumber', poNumber);
        appendInput('isPPN', isPPN ? 'true' : 'false');
        appendInput('stream', 'true');

        items.forEach((item, index) => {
            appendInput(`locations[${index}][id]`, item.id.toString());
            appendInput(`locations[${index}][description]`, item.description);
            appendInput(`locations[${index}][area]`, item.area);
            appendInput(`locations[${index}][type]`, item.type);
            appendInput(
                `locations[${index}][orientation]`,
                item.orientation || 'V',
            );
            appendInput(`locations[${index}][size]`, item.size || '4x6');
            appendInput(
                `locations[${index}][vendorCost]`,
                item.vendorCost.toString(),
            );
            appendInput(
                `locations[${index}][lighting]`,
                item.lighting || 'Berlampu',
            );
            appendInput(
                `locations[${index}][topNotes]`,
                item.topNotes || 'Lunas setelah visual terpasang',
            );
        });

        appendInput('project[name]', project.name);
        appendInput('project[period]', project.period || '1 Minggu');

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const [editingLoc, setEditingLoc] = useState<BillboardLocation | null>(
        null,
    );

    const handleConfirmPO = () => {
        if (!confirmingLoc) return;
        const now = new Date();
        const seq = String(Math.floor(Math.random() * 899) + 100).padStart(
            3,
            '0',
        );
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const yearShort = String(now.getFullYear()).slice(-2);

        // PPN: No urut / PTSSI-PO / bln / thn (cth: 001/PTSSI-PO/06/26)
        // NON PPN: No urut / YS-PO / bln / thn (cth: 001/YS-PO/06/26)
        const poNumber = isPPN
            ? `${seq}/PTSSI-PO/${monthStr}/${yearShort}`
            : `${seq}/YS-PO/${monthStr}/${yearShort}`;

        const updatedLoc: BillboardLocation = {
            ...confirmingLoc,
            poIssued: true,
            poNumber,
            lighting: poLighting,
            topNotes: poTopNotes,
            vendorTermScheme,
            vendorTermPercents,
            vendorTermDates,
        };

        onIssuePO(
            confirmingLoc.id,
            poNumber,
            poLighting,
            poTopNotes,
            vendorTermScheme,
            vendorTermPercents,
            vendorTermDates,
        );
        setConfirmingLoc(null);

        // Auto Download PDF upon issuance
        handleDownloadPO(confirmingLoc.vendorName || 'Vendor', poNumber, [
            updatedLoc,
        ]);
    };

    const handleConfirmVendorBulkPO = () => {
        if (
            !confirmingVendorGroup ||
            confirmingVendorGroup.unissuedItems.length === 0
        )
            return;
        const now = new Date();
        const seq = String(Math.floor(Math.random() * 899) + 100).padStart(
            3,
            '0',
        );
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const yearShort = String(now.getFullYear()).slice(-2);

        // PPN: No urut / PTSSI-PO / bln / thn (cth: 001/PTSSI-PO/06/26)
        // NON PPN: No urut / YS-PO / bln / thn (cth: 001/YS-PO/06/26)
        const collectivePoNumber = isPPN
            ? `${seq}/PTSSI-PO/${monthStr}/${yearShort}`
            : `${seq}/YS-PO/${monthStr}/${yearShort}`;

        const updatedItems = confirmingVendorGroup.unissuedItems.map((loc) => ({
            ...loc,
            poIssued: true,
            poNumber: collectivePoNumber,
            lighting: poLighting,
            topNotes: poTopNotes,
            vendorTermScheme,
            vendorTermPercents,
            vendorTermDates,
        }));

        if (onIssueBulkPO) {
            onIssueBulkPO(
                confirmingVendorGroup.vendorId,
                confirmingVendorGroup.unissuedItems.map((loc) => loc.id),
                collectivePoNumber,
                poLighting,
                poTopNotes,
                vendorTermScheme,
                vendorTermPercents,
                vendorTermDates,
            );
        } else {
            confirmingVendorGroup.unissuedItems.forEach((loc) => {
                onIssuePO(
                    loc.id,
                    collectivePoNumber,
                    poLighting,
                    poTopNotes,
                    vendorTermScheme,
                    vendorTermPercents,
                    vendorTermDates,
                );
            });
        }
        setConfirmingVendorGroup(null);

        // Auto Download PDF upon bulk issuance
        handleDownloadPO(
            confirmingVendorGroup.vendorName,
            collectivePoNumber,
            updatedItems,
        );
    };

    const handleSaveEditPO = () => {
        if (!editingLoc) return;
        onIssuePO(
            editingLoc.id,
            editingLoc.poNumber || '',
            poLighting,
            poTopNotes,
            vendorTermScheme,
            vendorTermPercents,
            vendorTermDates,
        );
        setEditingLoc(null);
    };

    const totalVendorDPP = locations.reduce((s, l) => s + l.vendorCost, 0);
    const totalPO = isPPN ? totalVendorDPP * 1.11 : totalVendorDPP;
    const issuedCount = locations.filter((l) => l.poIssued).length;

    const [poFilterScheme, setPoFilterScheme] = useState<
        'all' | 'kolektif' | 'titik'
    >('all');

    // Group PO locations by vendor
    const groupedVendorPOs = useMemo(() => {
        const map = new Map<
            string | number,
            {
                vendorId: string | number;
                vendorName: string;
                items: BillboardLocation[];
            }
        >();
        locations.forEach((loc) => {
            const vId = loc.vendorId || 'unassigned';
            if (!map.has(vId)) {
                map.set(vId, {
                    vendorId: vId,
                    vendorName:
                        loc.vendorName || 'Vendor Tidak Teridentifikasi',
                    items: [],
                });
            }
            map.get(vId)!.items.push(loc);
        });
        return Array.from(map.values());
    }, [locations]);

    // Filter vendor POs by PO scheme (Kolektif vs Per Titik)
    const filteredVendorPOs = useMemo(() => {
        return groupedVendorPOs.filter((group) => {
            const issuedItems = group.items.filter((l) => l.poIssued);
            const uniquePoNumbers = new Set(issuedItems.map((l) => l.poNumber));
            const isCollective =
                uniquePoNumbers.size === 1 && issuedItems.length > 1;
            const isPerTitik =
                uniquePoNumbers.size > 1 ||
                (issuedItems.length === 1 && group.items.length === 1);

            if (poFilterScheme === 'kolektif')
                return isCollective || issuedItems.length === 0;
            if (poFilterScheme === 'titik')
                return isPerTitik || issuedItems.length === 0;
            return true;
        });
    }, [groupedVendorPOs, poFilterScheme]);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Lokasi
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                        {locations.length} titik
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        PO Sudah Terbit
                    </div>
                    <div className="text-lg font-bold text-emerald-700">
                        {issuedCount} titik
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        {isPPN ? 'Total All PO (DPP+PPN)' : 'Total All PO'}
                    </div>
                    <div className="font-mono text-sm font-bold text-amber-700">
                        {fmt(totalPO)}
                    </div>
                </div>
            </div>

            {/* Filter Skema PO Segmented Switch */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setPoFilterScheme('all')}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            poFilterScheme === 'all'
                                ? 'shadow-2xs border border-slate-200/80 bg-white text-slate-900'
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
                    >
                        <span>Semua Skema PO</span>
                        <span className="py-0.2 rounded-md bg-slate-100 px-1.5 font-mono text-[10px] text-slate-600">
                            {groupedVendorPOs.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPoFilterScheme('kolektif')}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            poFilterScheme === 'kolektif'
                                ? 'shadow-2xs bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
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
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                        <span>PO Kolektif Vendor</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPoFilterScheme('titik')}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            poFilterScheme === 'titik'
                                ? 'shadow-2xs bg-teal-600 text-white'
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        <span>PO Per Titik Lokasi</span>
                    </button>
                </div>

                <div className="pr-2 text-[11px] font-medium text-slate-500">
                    Menampilkan{' '}
                    <strong className="text-slate-800">
                        {filteredVendorPOs.length} Vendor
                    </strong>
                </div>
            </div>

            {filteredVendorPOs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white py-10 text-center text-slate-400">
                    <p className="text-xs font-medium">
                        Tidak ada vendor untuk skema PO yang dipilih.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredVendorPOs.map((group) => {
                        const vendorDpp = group.items.reduce(
                            (s, l) => s + l.vendorCost,
                            0,
                        );
                        const vendorPpn = isPPN ? vendorDpp * 0.11 : 0;
                        const vendorGrandTotal = vendorDpp + vendorPpn;
                        const unissuedItems = group.items.filter(
                            (l) => !l.poIssued,
                        );
                        const vendorIssuedCount =
                            group.items.length - unissuedItems.length;

                        // Payment Calculations for Vendor (Mendukung Multi-PO per Vendor)
                        const vendorPos = purchaseOrders.filter(
                            (po) => po.vendor_id === group.vendorId,
                        );
                        const vendorPo = vendorPos[0] ?? null;
                        const dbPlans = vendorPos
                            .map((po) => po.payment_plan)
                            .filter(
                                (
                                    p,
                                ): p is NonNullable<
                                    (typeof vendorPos)[number]['payment_plan']
                                > => p !== null && p !== undefined,
                            );

                        // Gabungkan semua terms dari seluruh PO vendor ini
                        const allDbTerms = dbPlans.flatMap(
                            (plan) => plan.terms || [],
                        );
                        const dbTerms =
                            allDbTerms.length > 0 ? allDbTerms : null;

                        // Gunakan settlement dari DB jika ada, fallback ke project.vendorPayments lokal
                        const dbSettlements = dbTerms
                            ? dbTerms.flatMap((t) => {
                                  const parentPo = vendorPos.find((po) =>
                                      po.payment_plan?.terms?.some(
                                          (term) => term.id === t.id,
                                      ),
                                  );
                                  return t.settlements.map((s) => ({
                                      id: s.id,
                                      poNumber:
                                          parentPo?.po_number ||
                                          vendorPo?.po_number ||
                                          `PO-${group.vendorName.replace(/\s+/g, '')}`,
                                      vendorName: group.vendorName,
                                      amount: s.amount,
                                      paidAt: s.paid_at,
                                      paymentMethod: s.payment_method,
                                      paymentRef: s.payment_ref || undefined,
                                      notes: s.notes || undefined,
                                  }));
                              })
                            : [];

                        const vendorRecords =
                            dbSettlements.length > 0
                                ? dbSettlements
                                : (project.vendorPayments || []).filter(
                                      (vp) =>
                                          vp.vendorName === group.vendorName,
                                  );

                        const totalVendorPaid = dbTerms
                            ? dbTerms.reduce((sum, t) => sum + t.totalPaid, 0)
                            : vendorRecords.reduce((s, r) => s + r.amount, 0);
                        const vendorRemaining = Math.max(
                            0,
                            Math.round(vendorGrandTotal - totalVendorPaid),
                        );
                        const isFullyPaid =
                            totalVendorPaid >= vendorGrandTotal &&
                            vendorGrandTotal > 0;
                        const isPartialPaid =
                            totalVendorPaid > 0 && !isFullyPaid;

                        const firstPoNum =
                            group.items.find((l) => l.poNumber)?.poNumber ||
                            `PO-${group.vendorName.replace(/\s+/g, '')}`;

                        const issuedItems = group.items.filter(
                            (l) => l.poIssued,
                        );
                        const uniquePoNumbers = new Set(
                            issuedItems.map((l) => l.poNumber),
                        );
                        const isCollectivePO =
                            uniquePoNumbers.size === 1 &&
                            issuedItems.length > 1;
                        const isPerTitikPO =
                            uniquePoNumbers.size > 1 ||
                            (issuedItems.length === 1 &&
                                group.items.length === 1);

                        return (
                            <div
                                key={group.vendorId}
                                className="shadow-xs space-y-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white"
                            >
                                {/* Header Per Vendor (Soft Slate) */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-100/90 px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-xs font-bold text-blue-600">
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
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-xs font-bold tracking-tight text-slate-900">
                                                    {group.vendorName}
                                                </h4>

                                                {/* Badge Skema PO */}
                                                {isCollectivePO ? (
                                                    <span className="flex items-center gap-1 rounded-lg border border-violet-200/80 bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                                                        <svg
                                                            className="h-3 w-3 text-violet-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                            />
                                                        </svg>
                                                        PO Kolektif
                                                    </span>
                                                ) : isPerTitikPO ? (
                                                    <span className="flex items-center gap-1 rounded-lg border border-teal-200/80 bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-700">
                                                        <svg
                                                            className="h-3 w-3 text-teal-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                        </svg>
                                                        PO Per Titik
                                                    </span>
                                                ) : null}

                                                <span
                                                    className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold ${
                                                        isFullyPaid
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : isPartialPaid
                                                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                              : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {isFullyPaid
                                                        ? 'Lunas Vendor'
                                                        : isPartialPaid
                                                          ? 'Bayar Parsial'
                                                          : 'Belum Dibayar'}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[10px] text-slate-500">
                                                {group.items.length} Titik
                                                Lokasi &bull;{' '}
                                                {vendorIssuedCount}/
                                                {group.items.length} PO Terbit
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Tombol Terbitkan PO Kolektif Per Vendor */}
                                        {unissuedItems.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmingVendorGroup({
                                                        vendorId:
                                                            group.vendorId,
                                                        vendorName:
                                                            group.vendorName,
                                                        unissuedItems,
                                                    })
                                                }
                                                className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-blue-700"
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
                                                Terbitkan PO Vendor (
                                                {unissuedItems.length} Titik)
                                            </button>
                                        ) : (
                                            <span className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                                                <svg
                                                    className="h-3 w-3"
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
                                                Semua PO Terbit
                                            </span>
                                        )}

                                        {/* Dynamic Vendor TOP Schedule & Due Dates calculation */}
                                        {(() => {
                                            const vendorSchedule: Array<{
                                                id: string;
                                                label: string;
                                                percent: number;
                                                targetAmount: number;
                                                paidAmount: number;
                                                remainingAmount: number;
                                                dueDate: string;
                                                isPaid: boolean;
                                                isPartial: boolean;
                                                poId?: string | number;
                                                poNumber?: string;
                                            }> = dbTerms
                                                ? dbTerms.map((term) => {
                                                      const parentPo =
                                                          vendorPos.find((po) =>
                                                              po.payment_plan?.terms?.some(
                                                                  (t) =>
                                                                      t.id ===
                                                                      term.id,
                                                              ),
                                                          );
                                                      return {
                                                          id: term.id,
                                                          label: term.label,
                                                          percent: term.percent,
                                                          targetAmount:
                                                              Math.round(
                                                                  term.amount,
                                                              ),
                                                          paidAmount:
                                                              Math.round(
                                                                  term.totalPaid,
                                                              ),
                                                          remainingAmount:
                                                              Math.round(
                                                                  term.remaining,
                                                              ),
                                                          dueDate:
                                                              term.due_date,
                                                          isPaid: term.isPaid,
                                                          isPartial:
                                                              term.totalPaid >
                                                                  0 &&
                                                              !term.isPaid,
                                                          poId: parentPo?.id,
                                                          poNumber:
                                                              parentPo?.po_number,
                                                      };
                                                  })
                                                : (() => {
                                                      const firstIssuedLoc =
                                                          group.items.find(
                                                              (l) => l.poIssued,
                                                          );
                                                      const schemePercents =
                                                          firstIssuedLoc?.vendorTermPercents ||
                                                          (poTopNotes.includes(
                                                              '30',
                                                          ) ||
                                                          poTopNotes.includes(
                                                              'Termin',
                                                          )
                                                              ? [30, 40, 30]
                                                              : [50, 50]);
                                                      const schemeDates =
                                                          firstIssuedLoc?.vendorTermDates || [
                                                              new Date()
                                                                  .toISOString()
                                                                  .split(
                                                                      'T',
                                                                  )[0],
                                                              new Date(
                                                                  Date.now() +
                                                                      30 *
                                                                          24 *
                                                                          60 *
                                                                          60 *
                                                                          1000,
                                                              )
                                                                  .toISOString()
                                                                  .split(
                                                                      'T',
                                                                  )[0],
                                                              new Date(
                                                                  Date.now() +
                                                                      60 *
                                                                          24 *
                                                                          60 *
                                                                          60 *
                                                                          1000,
                                                              )
                                                                  .toISOString()
                                                                  .split(
                                                                      'T',
                                                                  )[0],
                                                          ];

                                                      let runningPaid =
                                                          totalVendorPaid;
                                                      return schemePercents.map(
                                                          (pct, idx) => {
                                                              const targetAmount =
                                                                  Math.round(
                                                                      (vendorGrandTotal *
                                                                          pct) /
                                                                          100,
                                                                  );
                                                              const paidAmount =
                                                                  Math.min(
                                                                      targetAmount,
                                                                      Math.max(
                                                                          0,
                                                                          runningPaid,
                                                                      ),
                                                                  );
                                                              runningPaid -=
                                                                  paidAmount;
                                                              const remainingAmount =
                                                                  Math.max(
                                                                      0,
                                                                      targetAmount -
                                                                          paidAmount,
                                                                  );
                                                              const isPaid =
                                                                  paidAmount >=
                                                                      targetAmount &&
                                                                  targetAmount >
                                                                      0;
                                                              const isPartial =
                                                                  paidAmount >
                                                                      0 &&
                                                                  !isPaid;
                                                              const dueDate =
                                                                  schemeDates[
                                                                      idx
                                                                  ] ||
                                                                  new Date()
                                                                      .toISOString()
                                                                      .split(
                                                                          'T',
                                                                      )[0];

                                                              const label =
                                                                  schemePercents.length ===
                                                                  1
                                                                      ? 'Pelunasan Total Vendor'
                                                                      : idx ===
                                                                          0
                                                                        ? 'Termin 1 – Uang Muka (DP)'
                                                                        : idx ===
                                                                            schemePercents.length -
                                                                                1
                                                                          ? `Termin ${idx + 1} – Pelunasan`
                                                                          : `Termin ${idx + 1} – Progres`;

                                                              return {
                                                                  id: `vterm-${group.vendorId}-${idx}`,
                                                                  label,
                                                                  percent: pct,
                                                                  targetAmount,
                                                                  paidAmount,
                                                                  remainingAmount,
                                                                  dueDate,
                                                                  isPaid,
                                                                  isPartial,
                                                                  poId: vendorPo?.id,
                                                                  poNumber:
                                                                      firstPoNum,
                                                              };
                                                          },
                                                      );
                                                  })();

                                            if (vendorIssuedCount === 0)
                                                return null;

                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const firstUnpaid =
                                                            vendorSchedule.find(
                                                                (t) =>
                                                                    !t.isPaid,
                                                            );
                                                        setSelectedVendorForPay(
                                                            {
                                                                vendorName:
                                                                    group.vendorName,
                                                                poNumber:
                                                                    firstUnpaid?.poNumber ||
                                                                    firstPoNum,
                                                                poId:
                                                                    firstUnpaid?.poId ||
                                                                    vendorPo?.id,
                                                                totalAmount:
                                                                    Math.round(
                                                                        vendorGrandTotal,
                                                                    ),
                                                                remainingAmount:
                                                                    Math.round(
                                                                        vendorRemaining,
                                                                    ),
                                                                schedule:
                                                                    vendorSchedule,
                                                                selectedTermId:
                                                                    firstUnpaid?.id,
                                                            },
                                                        );
                                                        setVPayType(
                                                            firstUnpaid
                                                                ? 'partial'
                                                                : 'full',
                                                        );
                                                        setVPayAmountInput(
                                                            firstUnpaid
                                                                ? firstUnpaid.remainingAmount
                                                                : vendorRemaining >
                                                                    0
                                                                  ? Math.round(
                                                                        vendorRemaining,
                                                                    )
                                                                  : Math.round(
                                                                        vendorGrandTotal,
                                                                    ),
                                                        );
                                                        setVPayDateInput(
                                                            new Date()
                                                                .toISOString()
                                                                .split('T')[0],
                                                        );
                                                        setVPayMethodInput(
                                                            'Transfer Bank BCA',
                                                        );
                                                        setVPayRefInput('');
                                                        setVPayNotesInput(
                                                            firstUnpaid
                                                                ? `Pembayaran ${firstUnpaid.label} PO ${firstUnpaid.poNumber || firstPoNum}`
                                                                : `Pelunasan PO ${firstPoNum}`,
                                                        );
                                                    }}
                                                    className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-emerald-700"
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
                                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                        />
                                                    </svg>
                                                    Bayar Vendor
                                                </button>
                                            );
                                        })()}

                                        {/* Ringkasan Keuangan Vendor */}
                                        <div className="shadow-2xs flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-[10px]">
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-slate-400">
                                                    Target PO
                                                </div>
                                                <div className="font-bold text-slate-800">
                                                    {fmt(vendorGrandTotal)}
                                                </div>
                                            </div>
                                            <div className="mx-1 h-5 w-px bg-slate-200" />
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-emerald-600">
                                                    Dibayar
                                                </div>
                                                <div className="font-bold text-emerald-700">
                                                    {fmt(totalVendorPaid)}
                                                </div>
                                            </div>
                                            <div className="mx-1 h-5 w-px bg-slate-200" />
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-rose-500">
                                                    Sisa Hutang
                                                </div>
                                                <div className="font-bold text-rose-600">
                                                    {fmt(vendorRemaining)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daftar Titik PO Under Vendor */}
                                <div className="space-y-3 bg-slate-50/40 p-3.5">
                                    {group.items.map((loc, idx) => {
                                        const dppTotal = loc.vendorCost;
                                        const ppnTotal = isPPN
                                            ? dppTotal * 0.11
                                            : 0;
                                        const grandTotal = dppTotal + ppnTotal;
                                        return (
                                            <div
                                                key={loc.id}
                                                className={`rounded-xl border p-4 transition-all ${loc.poIssued ? 'border-emerald-200/60 bg-emerald-50/60' : 'border-slate-200/80 bg-white'}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold text-slate-800">
                                                                {
                                                                    loc.description
                                                                }
                                                            </div>
                                                            <div className="mt-0.5 text-[10px] text-slate-400">
                                                                {loc.area}{' '}
                                                                &middot;{' '}
                                                                {loc.type}{' '}
                                                                &middot;{' '}
                                                                {loc.size}
                                                            </div>
                                                            <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                                                <span className="font-mono text-[10px] text-slate-600">
                                                                    DPP:{' '}
                                                                    <span className="font-bold">
                                                                        {fmt(
                                                                            dppTotal,
                                                                        )}
                                                                    </span>
                                                                </span>
                                                                {isPPN && (
                                                                    <span className="font-mono text-[10px] text-slate-500">
                                                                        PPN:{' '}
                                                                        <span className="font-bold text-violet-600">
                                                                            {fmt(
                                                                                ppnTotal,
                                                                            )}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                                <span className="font-mono text-[10px] font-bold text-slate-800">
                                                                    Total Biaya
                                                                    PO Titik:{' '}
                                                                    {fmt(
                                                                        grandTotal,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {loc.poIssued && (
                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                                                                        <svg
                                                                            className="h-3 w-3 text-emerald-600"
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
                                                                        {
                                                                            loc.poNumber
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!loc.poIssued ? (
                                                        <button
                                                            onClick={() =>
                                                                setConfirmingLoc(
                                                                    loc,
                                                                )
                                                            }
                                                            className="shadow-2xs flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-700"
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
                                                            Terbitkan PO
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-shrink-0 items-center gap-1.5">
                                                            <button
                                                                onClick={() =>
                                                                    handleDownloadPO(
                                                                        group.vendorName,
                                                                        loc.poNumber,
                                                                        [loc],
                                                                    )
                                                                }
                                                                className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-700"
                                                                title="Buka Dokumen PO PDF"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                Buka PO PDF
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLoc(
                                                                        loc,
                                                                    );
                                                                    setPoLighting(
                                                                        loc.lighting ||
                                                                            'Berlampu',
                                                                    );
                                                                    setPoTopNotes(
                                                                        loc.topNotes ||
                                                                            'Lunas setelah visual terpasang',
                                                                    );
                                                                }}
                                                                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-100 p-1.5 text-slate-600 transition-all hover:bg-slate-200"
                                                                title="Edit Parameter PO"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Dynamic Vendor TOP Stepper & Collapsible Schedule (Hanya tampil jika PO sudah terbit) */}
                                {vendorIssuedCount > 0 &&
                                    (() => {
                                        // vendorSchedule: preferensikan data DB, fallback ke komputasi lokal.
                                        const vendorSchedule: Array<{
                                            id: string;
                                            label: string;
                                            percent: number;
                                            targetAmount: number;
                                            paidAmount: number;
                                            remainingAmount: number;
                                            dueDate: string;
                                            isPaid: boolean;
                                            isPartial: boolean;
                                            poId?: string | number;
                                            poNumber?: string;
                                        }> = dbTerms
                                            ? dbTerms.map((term) => {
                                                  const parentPo =
                                                      vendorPos.find((po) =>
                                                          po.payment_plan?.terms?.some(
                                                              (t) =>
                                                                  t.id ===
                                                                  term.id,
                                                          ),
                                                      );
                                                  return {
                                                      id: term.id,
                                                      label: term.label,
                                                      percent: term.percent,
                                                      targetAmount: Math.round(
                                                          term.amount,
                                                      ),
                                                      paidAmount: Math.round(
                                                          term.totalPaid,
                                                      ),
                                                      remainingAmount:
                                                          Math.round(
                                                              term.remaining,
                                                          ),
                                                      dueDate: term.due_date,
                                                      isPaid: term.isPaid,
                                                      isPartial:
                                                          term.totalPaid > 0 &&
                                                          !term.isPaid,
                                                      poId: parentPo?.id,
                                                      poNumber:
                                                          parentPo?.po_number,
                                                  };
                                              })
                                            : (() => {
                                                  // Fallback lokal (PO belum punya payment_plan di DB)
                                                  const firstIssuedLoc =
                                                      group.items.find(
                                                          (l) => l.poIssued,
                                                      );
                                                  const schemePercents =
                                                      firstIssuedLoc?.vendorTermPercents ||
                                                      (poTopNotes.includes(
                                                          '30',
                                                      ) ||
                                                      poTopNotes.includes(
                                                          'Termin',
                                                      )
                                                          ? [30, 40, 30]
                                                          : [50, 50]);
                                                  const schemeDates =
                                                      firstIssuedLoc?.vendorTermDates || [
                                                          new Date()
                                                              .toISOString()
                                                              .split('T')[0],
                                                      ];
                                                  let runningPaid =
                                                      totalVendorPaid;
                                                  return schemePercents.map(
                                                      (pct, idx) => {
                                                          const targetAmount =
                                                              Math.round(
                                                                  (vendorGrandTotal *
                                                                      pct) /
                                                                      100,
                                                              );
                                                          const paidAmount =
                                                              Math.min(
                                                                  targetAmount,
                                                                  Math.max(
                                                                      0,
                                                                      runningPaid,
                                                                  ),
                                                              );
                                                          runningPaid -=
                                                              paidAmount;
                                                          const remainingAmount =
                                                              Math.max(
                                                                  0,
                                                                  targetAmount -
                                                                      paidAmount,
                                                              );
                                                          const isPaid =
                                                              paidAmount >=
                                                                  targetAmount &&
                                                              targetAmount > 0;
                                                          const isPartial =
                                                              paidAmount > 0 &&
                                                              !isPaid;
                                                          const dueDate =
                                                              schemeDates[
                                                                  idx
                                                              ] ||
                                                              new Date()
                                                                  .toISOString()
                                                                  .split(
                                                                      'T',
                                                                  )[0];
                                                          const label =
                                                              schemePercents.length ===
                                                              1
                                                                  ? 'Pelunasan Total Vendor'
                                                                  : idx === 0
                                                                    ? 'Termin 1 – Uang Muka (DP)'
                                                                    : idx ===
                                                                        schemePercents.length -
                                                                            1
                                                                      ? `Termin ${idx + 1} – Pelunasan`
                                                                      : `Termin ${idx + 1} – Progres`;
                                                          return {
                                                              id: `vterm-${group.vendorId}-${idx}`,
                                                              label,
                                                              percent: pct,
                                                              targetAmount,
                                                              paidAmount,
                                                              remainingAmount,
                                                              dueDate,
                                                              isPaid,
                                                              isPartial,
                                                              poId: vendorPo?.id,
                                                              poNumber:
                                                                  firstPoNum,
                                                          };
                                                      },
                                                  );
                                              })();

                                        const isExpanded =
                                            !!expandedVendorTop[group.vendorId];

                                        return (
                                            <div className="border-t border-slate-200/80 bg-slate-50/90 px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedVendorTop(
                                                            (prev) => ({
                                                                ...prev,
                                                                [group.vendorId]:
                                                                    !prev[
                                                                        group
                                                                            .vendorId
                                                                    ],
                                                            }),
                                                        )
                                                    }
                                                    className="group flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                                                >
                                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                                        <div className="flex flex-shrink-0 items-center gap-1.5 text-xs font-bold text-slate-700">
                                                            <svg
                                                                className="h-4 w-4 text-blue-600"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                />
                                                            </svg>
                                                            <span>
                                                                TOP Vendor:
                                                            </span>
                                                        </div>

                                                        {/* Stepper Progress Bar horizontal */}
                                                        <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5">
                                                            {vendorSchedule.map(
                                                                (term, idx) => (
                                                                    <div
                                                                        key={
                                                                            term.id
                                                                        }
                                                                        className="flex flex-shrink-0 items-center gap-2"
                                                                    >
                                                                        <div
                                                                            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold transition-all ${
                                                                                term.isPaid
                                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                                                    : term.isPartial
                                                                                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                                                                                      : 'border-slate-200 bg-white text-slate-700'
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                                    term.isPaid
                                                                                        ? 'bg-emerald-500'
                                                                                        : term.isPartial
                                                                                          ? 'bg-blue-500'
                                                                                          : 'bg-amber-500'
                                                                                }`}
                                                                            />
                                                                            <span>
                                                                                {
                                                                                    term.label
                                                                                }{' '}
                                                                                (
                                                                                {
                                                                                    term.percent
                                                                                }
                                                                                %)
                                                                            </span>
                                                                            <span className="font-mono font-normal text-slate-400">
                                                                                |{' '}
                                                                                {formatIndoDate(
                                                                                    term.dueDate,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        {idx <
                                                                            vendorSchedule.length -
                                                                                1 && (
                                                                            <span className="text-xs font-bold text-slate-300">
                                                                                &rarr;
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="shadow-2xs flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 transition-colors group-hover:text-blue-800">
                                                        <span>
                                                            {isExpanded
                                                                ? 'Sembunyikan Rincian'
                                                                : 'Rincian TOP'}
                                                        </span>
                                                        <svg
                                                            className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </button>

                                                {/* Collapsible Content */}
                                                {isExpanded && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 mt-3 space-y-2.5 border-t border-slate-200/80 pt-3 duration-200">
                                                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                                            <span>
                                                                Rincian
                                                                Pelaksanaan &
                                                                Jatuh Tempo
                                                                Pembayaran
                                                                Vendor
                                                            </span>
                                                            <span className="font-bold text-slate-700">
                                                                {
                                                                    vendorSchedule.length
                                                                }{' '}
                                                                Termin (
                                                                {vendorGrandTotal >
                                                                0
                                                                    ? Math.round(
                                                                          (totalVendorPaid /
                                                                              vendorGrandTotal) *
                                                                              100,
                                                                      )
                                                                    : 0}
                                                                % Realisasi)
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                                                            {vendorSchedule.map(
                                                                (term) => (
                                                                    <div
                                                                        key={
                                                                            term.id
                                                                        }
                                                                        className={`flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                                                                            term.isPaid
                                                                                ? 'border-emerald-200 bg-emerald-50/60'
                                                                                : term.isPartial
                                                                                  ? 'border-blue-200 bg-blue-50/60'
                                                                                  : 'shadow-2xs border-slate-200 bg-white'
                                                                        }`}
                                                                    >
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-xs font-bold text-slate-900">
                                                                                    {
                                                                                        term.label
                                                                                    }
                                                                                </span>
                                                                                <span
                                                                                    className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${
                                                                                        term.isPaid
                                                                                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                                                                                            : term.isPartial
                                                                                              ? 'border-blue-200 bg-blue-100 text-blue-800'
                                                                                              : 'border-amber-200 bg-amber-100 text-amber-800'
                                                                                    }`}
                                                                                >
                                                                                    {term.isPaid
                                                                                        ? 'Lunas'
                                                                                        : term.isPartial
                                                                                          ? 'Bayar Parsial'
                                                                                          : 'Belum Dibayar'}
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                                                <span>
                                                                                    Porsi:{' '}
                                                                                    <strong className="text-slate-700">
                                                                                        {
                                                                                            term.percent
                                                                                        }

                                                                                        %
                                                                                    </strong>
                                                                                </span>
                                                                                <span className="font-mono font-bold text-slate-800">
                                                                                    {fmt(
                                                                                        term.targetAmount,
                                                                                    )}
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                                                <svg
                                                                                    className="h-3.5 w-3.5 text-slate-400"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                    />
                                                                                </svg>
                                                                                <span>
                                                                                    Jatuh
                                                                                    Tempo:
                                                                                </span>
                                                                                <span className="font-mono font-semibold text-slate-700">
                                                                                    {formatIndoDate(
                                                                                        term.dueDate,
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                                                            <div className="text-[10px]">
                                                                                {term.isPaid ? (
                                                                                    <span className="font-bold text-emerald-700">
                                                                                        Lunas
                                                                                        (
                                                                                        {fmt(
                                                                                            term.targetAmount,
                                                                                        )}

                                                                                        )
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-mono font-bold text-rose-600">
                                                                                        Sisa:{' '}
                                                                                        {fmt(
                                                                                            term.remainingAmount,
                                                                                        )}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {!term.isPaid && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedVendorForPay(
                                                                                            {
                                                                                                vendorName:
                                                                                                    group.vendorName,
                                                                                                poNumber:
                                                                                                    term.poNumber ||
                                                                                                    firstPoNum,
                                                                                                poId:
                                                                                                    term.poId ||
                                                                                                    vendorPo?.id,
                                                                                                totalAmount:
                                                                                                    Math.round(
                                                                                                        vendorGrandTotal,
                                                                                                    ),
                                                                                                remainingAmount:
                                                                                                    Math.round(
                                                                                                        vendorRemaining,
                                                                                                    ),
                                                                                                schedule:
                                                                                                    vendorSchedule,
                                                                                                selectedTermId:
                                                                                                    term.id,
                                                                                            },
                                                                                        );
                                                                                        setVPayType(
                                                                                            term.remainingAmount >=
                                                                                                term.targetAmount
                                                                                                ? 'full'
                                                                                                : 'partial',
                                                                                        );
                                                                                        setVPayAmountInput(
                                                                                            Math.round(
                                                                                                term.remainingAmount,
                                                                                            ),
                                                                                        );
                                                                                        setVPayDateInput(
                                                                                            new Date()
                                                                                                .toISOString()
                                                                                                .split(
                                                                                                    'T',
                                                                                                )[0],
                                                                                        );
                                                                                        setVPayMethodInput(
                                                                                            'Transfer Bank BCA',
                                                                                        );
                                                                                        setVPayRefInput(
                                                                                            '',
                                                                                        );
                                                                                        setVPayNotesInput(
                                                                                            `Pembayaran ${term.label} PO ${term.poNumber || firstPoNum}`,
                                                                                        );
                                                                                    }}
                                                                                    className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:bg-emerald-700"
                                                                                >
                                                                                    Bayar
                                                                                    Termin
                                                                                    Ini
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                {/* Riwayat Pembayaran Vendor per Vendor Group */}
                                {vendorRecords.length > 0 && (
                                    <div className="space-y-2 border-t border-slate-200/80 bg-slate-100/60 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                Riwayat Pembayaran Keluar (PO{' '}
                                                {group.vendorName})
                                            </div>
                                            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                {vendorRecords.length} Transaksi
                                                Keluar
                                            </span>
                                        </div>

                                        <div className="divide-y divide-slate-200/60 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                                            {vendorRecords.map((rec) => (
                                                <div
                                                    key={rec.id}
                                                    className="flex items-center justify-between gap-3 p-3 text-xs transition-colors hover:bg-slate-50"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-xs font-bold text-rose-600">
                                                            ↑
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate font-bold text-slate-900">
                                                                Transfer ke{' '}
                                                                {rec.vendorName}{' '}
                                                                ({rec.poNumber})
                                                            </div>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                                <span>
                                                                    Tgl:{' '}
                                                                    <strong className="text-slate-600">
                                                                        {formatIndoDate(
                                                                            rec.paidAt,
                                                                        )}
                                                                    </strong>
                                                                </span>
                                                                <span>
                                                                    &bull;
                                                                </span>
                                                                <span>
                                                                    Metode:{' '}
                                                                    <strong className="text-slate-600">
                                                                        {
                                                                            rec.paymentMethod
                                                                        }
                                                                    </strong>
                                                                </span>
                                                                {rec.paymentRef && (
                                                                    <>
                                                                        <span>
                                                                            &bull;
                                                                        </span>
                                                                        <span>
                                                                            Ref:{' '}
                                                                            <strong className="font-mono text-slate-600">
                                                                                {
                                                                                    rec.paymentRef
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
                                                            <div className="font-mono text-xs font-black text-rose-600">
                                                                -{' '}
                                                                {fmt(
                                                                    rec.amount,
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] font-medium text-slate-400">
                                                                Pembayaran
                                                                Vendor
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updatedVendorPayments =
                                                                    (
                                                                        project.vendorPayments ||
                                                                        []
                                                                    ).filter(
                                                                        (vp) =>
                                                                            vp.id !==
                                                                            rec.id,
                                                                    );
                                                                onUpdateProject(
                                                                    {
                                                                        ...project,
                                                                        vendorPayments:
                                                                            updatedVendorPayments,
                                                                    },
                                                                );
                                                            }}
                                                            className="cursor-pointer p-1 text-xs font-bold text-slate-400 hover:text-rose-600"
                                                            title="Hapus / Batal Transaksi Pembayaran Vendor Ini"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Catat Pembayaran Vendor */}
            {selectedVendorForPay && (
                <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
                    <div className="animate-in fade-in zoom-in w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                                    Catat Pembayaran Keluar (Vendor)
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {selectedVendorForPay.vendorName} (
                                    {selectedVendorForPay.poNumber})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedVendorForPay(null)}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Summary Box */}
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Total Tagihan PO Vendor
                                </div>
                                <div className="font-mono text-sm font-black text-slate-900">
                                    {fmt(selectedVendorForPay.totalAmount)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Sisa Hutang
                                </div>
                                <div className="font-mono text-xs font-bold text-rose-600">
                                    {fmt(selectedVendorForPay.remainingAmount)}
                                </div>
                            </div>
                        </div>

                        {/* Jadwal Termin & Jatuh Tempo Selector */}
                        {selectedVendorForPay.schedule &&
                            selectedVendorForPay.schedule.length > 0 && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Pilih Termin Pembayaran & Jatuh Tempo
                                    </label>
                                    <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1">
                                        {selectedVendorForPay.schedule.map(
                                            (term) => {
                                                const isSelected =
                                                    selectedVendorForPay.selectedTermId ===
                                                    term.id;
                                                return (
                                                    <button
                                                        key={term.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedVendorForPay(
                                                                {
                                                                    ...selectedVendorForPay,
                                                                    selectedTermId:
                                                                        term.id,
                                                                    poId:
                                                                        term.poId ||
                                                                        selectedVendorForPay.poId,
                                                                    poNumber:
                                                                        term.poNumber ||
                                                                        selectedVendorForPay.poNumber,
                                                                },
                                                            );
                                                            setVPayType(
                                                                'partial',
                                                            );
                                                            setVPayAmountInput(
                                                                term.remainingAmount >
                                                                    0
                                                                    ? Math.round(
                                                                          term.remainingAmount,
                                                                      )
                                                                    : Math.round(
                                                                          term.targetAmount,
                                                                      ),
                                                            );
                                                            setVPayNotesInput(
                                                                `Pembayaran ${term.label} PO ${term.poNumber || selectedVendorForPay.poNumber}`,
                                                            );
                                                        }}
                                                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                                                            isSelected
                                                                ? 'border-rose-600 bg-rose-50 font-bold text-rose-900 ring-2 ring-rose-600/20'
                                                                : term.isPaid
                                                                  ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                                                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                                {term.poNumber && (
                                                                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-700">
                                                                        {
                                                                            term.poNumber
                                                                        }
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {term.label}{' '}
                                                                    (
                                                                    {
                                                                        term.percent
                                                                    }
                                                                    %)
                                                                </span>
                                                                {term.isPaid && (
                                                                    <span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-800">
                                                                        Lunas
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-0.5 text-[10px] text-slate-500">
                                                                Jatuh Tempo:{' '}
                                                                <strong className="font-mono text-slate-700">
                                                                    {formatIndoDate(
                                                                        term.dueDate,
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono text-xs font-bold text-slate-900">
                                                                {fmt(
                                                                    term.targetAmount,
                                                                )}
                                                            </div>
                                                            <div className="font-mono text-[10px] font-semibold text-rose-600">
                                                                {term.isPaid
                                                                    ? 'Rp 0'
                                                                    : `Sisa: ${fmt(term.remainingAmount)}`}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Opsi Jenis Pembayaran: Full vs Partial */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Opsi Nominal Pembayaran
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVPayType('full');
                                        setVPayAmountInput(
                                            selectedVendorForPay.remainingAmount >
                                                0
                                                ? selectedVendorForPay.remainingAmount
                                                : selectedVendorForPay.totalAmount,
                                        );
                                        setVPayNotesInput(
                                            `Pelunasan Total PO ${selectedVendorForPay.poNumber}`,
                                        );
                                    }}
                                    className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                        vPayType === 'full'
                                            ? 'border-rose-600 bg-rose-50 font-bold text-rose-900 ring-2 ring-rose-600/20'
                                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="text-xs font-bold">
                                        Pelunasan Total
                                    </div>
                                    <div className="mt-0.5 text-[10px] text-slate-500">
                                        Sisa sisa tagihan PO
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setVPayType('partial');
                                    }}
                                    className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                        vPayType === 'partial'
                                            ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="text-xs font-bold">
                                        Cicil / Nominal Termin
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-normal text-slate-500">
                                        Sebagian nominal
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Nominal Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                Nominal Dibayar (Rp)
                            </label>
                            <input
                                type="number"
                                value={vPayAmountInput || ''}
                                readOnly={vPayType === 'full'}
                                onChange={(e) =>
                                    setVPayAmountInput(
                                        parseFloat(e.target.value) || 0,
                                    )
                                }
                                placeholder="Masukkan nominal pembayaran..."
                                className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none ${
                                    vPayType === 'full'
                                        ? 'border-slate-300 bg-slate-100 text-slate-700'
                                        : 'border-blue-400 bg-white text-blue-950 focus:border-blue-600'
                                }`}
                            />
                        </div>

                        {/* Tanggal Pembayaran & Metode Pembayaran */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Tanggal Bayar
                                </label>
                                <div className="relative flex items-center">
                                    <div className="shadow-2xs flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                        <span>
                                            {formatIndoDate(vPayDateInput)}
                                        </span>
                                        <svg
                                            className="h-3.5 w-3.5 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={vPayDateInput}
                                        onChange={(e) =>
                                            setVPayDateInput(e.target.value)
                                        }
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Rekening / Sumber Dana Kas
                                </label>
                                <select
                                    value={vPayAccountId}
                                    onChange={(e) =>
                                        setVPayAccountId(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                                >
                                    {cashBankAccounts &&
                                    cashBankAccounts.length > 0 ? (
                                        cashBankAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.display_name ||
                                                    `${acc.code} - ${acc.name}`}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">
                                            Transfer Bank BCA (Default)
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Ref / Catatan */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                No. Ref / Bukti Transfer (Opsional)
                            </label>
                            <input
                                type="text"
                                value={vPayRefInput}
                                onChange={(e) =>
                                    setVPayRefInput(e.target.value)
                                }
                                placeholder="Contoh: TRX-99234 / BCA ke Vendor"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                            <button
                                type="button"
                                onClick={() => setSelectedVendorForPay(null)}
                                className="cursor-pointer px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const poId = selectedVendorForPay.poId;
                                    const termId =
                                        selectedVendorForPay.selectedTermId ||
                                        selectedVendorForPay.schedule.find(
                                            (t) => !t.isPaid,
                                        )?.id;

                                    const selectedAccount =
                                        cashBankAccounts.find(
                                            (a) =>
                                                String(a.id) ===
                                                String(vPayAccountId),
                                        );
                                    const derivedMethod = selectedAccount
                                        ? selectedAccount.name
                                        : 'Transfer Bank BCA';

                                    // Jika termin dan PO terdaftar di database, kirim via endpoint backend
                                    if (
                                        poId &&
                                        termId &&
                                        !termId.startsWith('vterm-')
                                    ) {
                                        router.post(
                                            `/projects/${projectId}/purchase-orders/${poId}/payment-terms/${termId}/settle`,
                                            {
                                                amount: vPayAmountInput,
                                                paid_at:
                                                    vPayDateInput ||
                                                    new Date()
                                                        .toISOString()
                                                        .split('T')[0],
                                                payment_method: derivedMethod,
                                                account_id:
                                                    vPayAccountId ||
                                                    (cashBankAccounts[0]?.id
                                                        ? String(
                                                              cashBankAccounts[0]
                                                                  .id,
                                                          )
                                                        : null),
                                                payment_ref:
                                                    vPayRefInput || null,
                                                notes: vPayNotesInput || null,
                                            },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setSelectedVendorForPay(
                                                        null,
                                                    );
                                                    router.reload();
                                                },
                                            },
                                        );
                                        return;
                                    }

                                    // Fallback simpan lokal jika belum ada DB record
                                    const newRecord: VendorPaymentRecord = {
                                        id: `vpay-${Date.now()}`,
                                        poNumber: selectedVendorForPay.poNumber,
                                        vendorName:
                                            selectedVendorForPay.vendorName,
                                        amount: vPayAmountInput,
                                        paidAt:
                                            vPayDateInput ||
                                            new Date().toISOString(),
                                        paymentMethod: derivedMethod,
                                        paymentRef: vPayRefInput || undefined,
                                        notes: vPayNotesInput || undefined,
                                    };

                                    const updatedVendorPayments = [
                                        ...(project.vendorPayments || []),
                                        newRecord,
                                    ];
                                    onUpdateProject({
                                        ...project,
                                        vendorPayments: updatedVendorPayments,
                                    });
                                    setSelectedVendorForPay(null);
                                }}
                                className="cursor-pointer rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-700"
                            >
                                Simpan Pembayaran Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Parameter PO */}
            {editingLoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex-shrink-0 border-b border-slate-100 bg-white px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Edit Parameter Purchase Order (PO)
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        PO #:{' '}
                                        <span className="font-mono font-bold text-slate-800">
                                            {editingLoc.poNumber}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingLoc(null)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-bold text-slate-800">
                                    {editingLoc.description}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    {editingLoc.area} &middot; {editingLoc.type}{' '}
                                    &middot; {editingLoc.size}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Vendor:{' '}
                                    <span className="font-bold text-slate-700">
                                        {editingLoc.vendorName}
                                    </span>
                                </div>
                            </div>

                            {/* 2-Column Grid Layout */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Left Column: Opsi Penerangan PO & Skema Card */}
                                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    <div className="space-y-4">
                                        {/* 1. Opsi Penerangan PO */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Penerangan PO
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPoLighting(
                                                            'Berlampu',
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                        poLighting ===
                                                        'Berlampu'
                                                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-4 w-4 flex-shrink-0 text-amber-500"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                                        />
                                                    </svg>
                                                    Berlampu (Default)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPoLighting(
                                                            'Tidak Berlampu',
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                        poLighting ===
                                                        'Tidak Berlampu'
                                                            ? 'shadow-2xs border-slate-800 bg-slate-800 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-4 w-4 flex-shrink-0 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                                        />
                                                    </svg>
                                                    Tidak Berlampu
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Pilih Skema Pembayaran Vendor */}
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Pilih Skema Pembayaran Vendor
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    {
                                                        id: 'full',
                                                        label: 'Lunas Sekaligus',
                                                        desc: 'Cash 100% setelah visual terpasang',
                                                    },
                                                    {
                                                        id: 'dp',
                                                        label: 'DP + Pelunasan',
                                                        desc: 'DP 50% & Pelunasan 50%',
                                                    },
                                                    {
                                                        id: 'termin',
                                                        label: 'Termin 3 Tahap',
                                                        desc: 'Milestone progres 30–40–30%',
                                                    },
                                                    {
                                                        id: 'installment',
                                                        label: 'Tempo / Net 30',
                                                        desc: 'Pelunasan 30 hari kalender',
                                                    },
                                                ].map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelectVendorScheme(
                                                                s.id as PaymentScheme,
                                                            )
                                                        }
                                                        className={`cursor-pointer rounded-2xl border p-2.5 text-left transition-all ${
                                                            vendorTermScheme ===
                                                            s.id
                                                                ? 'border-blue-600 bg-blue-50/90 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {s.label}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500">
                                                            {s.desc}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Catatan TOP PO */}
                                    <div className="space-y-1 pt-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Catatan Term of Payment (TOP) PO
                                        </label>
                                        <input
                                            type="text"
                                            value={poTopNotes}
                                            onChange={(e) =>
                                                setPoTopNotes(e.target.value)
                                            }
                                            placeholder="Ketik catatan Term of Payment (TOP)..."
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: RINCIAN TERMIN, PERSENTASE & JATUH TEMPO VENDOR */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    {(() => {
                                        const targetCost =
                                            editingLoc.vendorCost;
                                        const totalWithPpn = isPPN
                                            ? Math.round(targetCost * 1.11)
                                            : targetCost;
                                        const sumPct =
                                            vendorTermPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );

                                        return (
                                            <div className="flex flex-1 flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            Rincian Termin,
                                                            Persentase & Jatuh
                                                            Tempo
                                                        </label>
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                                                sumPct === 100
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    : 'animate-pulse border-rose-200 bg-rose-50 font-extrabold text-rose-700'
                                                            }`}
                                                        >
                                                            Total: {sumPct}% (
                                                            {fmt(totalWithPpn)})
                                                        </span>
                                                    </div>

                                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                                                        {vendorTermPercents.map(
                                                            (pct, idx) => {
                                                                const termAmt =
                                                                    Math.round(
                                                                        (totalWithPpn *
                                                                            (pct ||
                                                                                0)) /
                                                                            100,
                                                                    );
                                                                const termLabel =
                                                                    vendorTermPercents.length ===
                                                                    1
                                                                        ? 'Pelunasan Total Vendor'
                                                                        : idx ===
                                                                            0
                                                                          ? 'Termin 1 – Uang Muka (DP)'
                                                                          : idx ===
                                                                              vendorTermPercents.length -
                                                                                  1
                                                                            ? `Termin ${idx + 1} – Pelunasan`
                                                                            : `Termin ${idx + 1} – Progres`;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="font-bold text-slate-900">
                                                                                {
                                                                                    termLabel
                                                                                }
                                                                            </div>
                                                                            <div className="font-mono text-[10px] text-slate-500">
                                                                                {fmt(
                                                                                    termAmt,
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    Porsi:
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        pct ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const val =
                                                                                            parseFloat(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                            0;
                                                                                        const updated =
                                                                                            [
                                                                                                ...vendorTermPercents,
                                                                                            ];
                                                                                        updated[
                                                                                            idx
                                                                                        ] =
                                                                                            val;
                                                                                        setVendorTermPercents(
                                                                                            updated,
                                                                                        );
                                                                                    }}
                                                                                    className="w-12 rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-xs font-bold focus:border-blue-600 focus:outline-none"
                                                                                />
                                                                                <span className="text-xs font-bold text-slate-600">
                                                                                    %
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    Jatuh
                                                                                    Tempo:
                                                                                </span>
                                                                                <div className="relative flex items-center">
                                                                                    <div className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                                                                        <span>
                                                                                            {formatIndoDate(
                                                                                                vendorTermDates[
                                                                                                    idx
                                                                                                ] ||
                                                                                                    new Date()
                                                                                                        .toISOString()
                                                                                                        .split(
                                                                                                            'T',
                                                                                                        )[0],
                                                                                            )}
                                                                                        </span>
                                                                                        <svg
                                                                                            className="h-3.5 w-3.5 text-slate-400"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                            stroke="currentColor"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                            />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={
                                                                                            vendorTermDates[
                                                                                                idx
                                                                                            ] ||
                                                                                            new Date()
                                                                                                .toISOString()
                                                                                                .split(
                                                                                                    'T',
                                                                                                )[0]
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) => {
                                                                                            const updated =
                                                                                                [
                                                                                                    ...vendorTermDates,
                                                                                                ];
                                                                                            updated[
                                                                                                idx
                                                                                            ] =
                                                                                                e.target.value;
                                                                                            setVendorTermDates(
                                                                                                updated,
                                                                                            );
                                                                                        }}
                                                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 bg-white px-6 py-4">
                            <button
                                onClick={() => setEditingLoc(null)}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEditPO}
                                className="flex-1 cursor-pointer rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-700"
                            >
                                Simpan Perubahan PO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Terbitkan PO Per Titik */}
            {confirmingLoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex-shrink-0 border-b border-slate-100 bg-white px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Konfirmasi Penerbitan PO (Per Titik)
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Purchase Order khusus akan diterbitkan
                                        untuk titik ini
                                    </p>
                                </div>
                                <button
                                    onClick={() => setConfirmingLoc(null)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-bold text-slate-800">
                                    {confirmingLoc.description}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    {confirmingLoc.area} &middot;{' '}
                                    {confirmingLoc.type} &middot;{' '}
                                    {confirmingLoc.size}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Vendor:{' '}
                                    <span className="font-bold text-slate-700">
                                        {confirmingLoc.vendorName}
                                    </span>
                                </div>
                            </div>

                            {/* 2-Column Grid Layout */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Left Column: Opsi Penerangan PO & Skema Card */}
                                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    <div className="space-y-4">
                                        {/* 1. Opsi Penerangan PO */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Penerangan PO
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPoLighting(
                                                            'Berlampu',
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                        poLighting ===
                                                        'Berlampu'
                                                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-4 w-4 flex-shrink-0 text-amber-500"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                                        />
                                                    </svg>
                                                    Berlampu (Default)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPoLighting(
                                                            'Tidak Berlampu',
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                        poLighting ===
                                                        'Tidak Berlampu'
                                                            ? 'shadow-2xs border-slate-800 bg-slate-800 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-4 w-4 flex-shrink-0 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                                        />
                                                    </svg>
                                                    Tidak Berlampu
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Pilih Skema Pembayaran Vendor */}
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Pilih Skema Pembayaran Vendor
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    {
                                                        id: 'full',
                                                        label: 'Lunas Sekaligus',
                                                        desc: 'Cash 100% setelah visual terpasang',
                                                    },
                                                    {
                                                        id: 'dp',
                                                        label: 'DP + Pelunasan',
                                                        desc: 'DP 50% & Pelunasan 50%',
                                                    },
                                                    {
                                                        id: 'termin',
                                                        label: 'Termin 3 Tahap',
                                                        desc: 'Milestone progres 30–40–30%',
                                                    },
                                                    {
                                                        id: 'installment',
                                                        label: 'Tempo / Net 30',
                                                        desc: 'Pelunasan 30 hari kalender',
                                                    },
                                                ].map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelectVendorScheme(
                                                                s.id as PaymentScheme,
                                                            )
                                                        }
                                                        className={`cursor-pointer rounded-2xl border p-2.5 text-left transition-all ${
                                                            vendorTermScheme ===
                                                            s.id
                                                                ? 'border-blue-600 bg-blue-50/90 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {s.label}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500">
                                                            {s.desc}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Catatan TOP PO */}
                                    <div className="space-y-1 pt-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Catatan Term of Payment (TOP) PO
                                        </label>
                                        <input
                                            type="text"
                                            value={poTopNotes}
                                            onChange={(e) =>
                                                setPoTopNotes(e.target.value)
                                            }
                                            placeholder="Ketik catatan Term of Payment (TOP)..."
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: RINCIAN TERMIN, PERSENTASE & JATUH TEMPO VENDOR */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    {(() => {
                                        const targetCost =
                                            confirmingLoc.vendorCost;
                                        const totalWithPpn = isPPN
                                            ? Math.round(targetCost * 1.11)
                                            : targetCost;
                                        const sumPct =
                                            vendorTermPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );

                                        return (
                                            <div className="flex flex-1 flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            Rincian Termin,
                                                            Persentase & Jatuh
                                                            Tempo
                                                        </label>
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                                                sumPct === 100
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    : 'animate-pulse border-rose-200 bg-rose-50 font-extrabold text-rose-700'
                                                            }`}
                                                        >
                                                            Total: {sumPct}% (
                                                            {fmt(totalWithPpn)})
                                                        </span>
                                                    </div>

                                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                                                        {vendorTermPercents.map(
                                                            (pct, idx) => {
                                                                const termAmt =
                                                                    Math.round(
                                                                        (totalWithPpn *
                                                                            (pct ||
                                                                                0)) /
                                                                            100,
                                                                    );
                                                                const termLabel =
                                                                    vendorTermPercents.length ===
                                                                    1
                                                                        ? 'Pelunasan Total Vendor'
                                                                        : idx ===
                                                                            0
                                                                          ? 'Termin 1 – Uang Muka (DP)'
                                                                          : idx ===
                                                                              vendorTermPercents.length -
                                                                                  1
                                                                            ? `Termin ${idx + 1} – Pelunasan`
                                                                            : `Termin ${idx + 1} – Progres`;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="font-bold text-slate-900">
                                                                                {
                                                                                    termLabel
                                                                                }
                                                                            </div>
                                                                            <div className="font-mono text-[10px] text-slate-500">
                                                                                {fmt(
                                                                                    termAmt,
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    Porsi:
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        pct ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const val =
                                                                                            parseFloat(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                            0;
                                                                                        const updated =
                                                                                            [
                                                                                                ...vendorTermPercents,
                                                                                            ];
                                                                                        updated[
                                                                                            idx
                                                                                        ] =
                                                                                            val;
                                                                                        setVendorTermPercents(
                                                                                            updated,
                                                                                        );
                                                                                    }}
                                                                                    className="w-12 rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-xs font-bold focus:border-blue-600 focus:outline-none"
                                                                                />
                                                                                <span className="text-xs font-bold text-slate-600">
                                                                                    %
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    Jatuh
                                                                                    Tempo:
                                                                                </span>
                                                                                <div className="relative flex items-center">
                                                                                    <div className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                                                                        <span>
                                                                                            {formatIndoDate(
                                                                                                vendorTermDates[
                                                                                                    idx
                                                                                                ] ||
                                                                                                    new Date()
                                                                                                        .toISOString()
                                                                                                        .split(
                                                                                                            'T',
                                                                                                        )[0],
                                                                                            )}
                                                                                        </span>
                                                                                        <svg
                                                                                            className="h-3.5 w-3.5 text-slate-400"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                            stroke="currentColor"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                            />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={
                                                                                            vendorTermDates[
                                                                                                idx
                                                                                            ] ||
                                                                                            new Date()
                                                                                                .toISOString()
                                                                                                .split(
                                                                                                    'T',
                                                                                                )[0]
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) => {
                                                                                            const updated =
                                                                                                [
                                                                                                    ...vendorTermDates,
                                                                                                ];
                                                                                            updated[
                                                                                                idx
                                                                                            ] =
                                                                                                e.target.value;
                                                                                            setVendorTermDates(
                                                                                                updated,
                                                                                            );
                                                                                        }}
                                                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>DPP Biaya Vendor:</span>
                                    <span className="font-mono font-bold text-slate-800">
                                        {fmt(confirmingLoc.vendorCost)}
                                    </span>
                                </div>
                                {isPPN && (
                                    <div className="flex justify-between text-violet-700">
                                        <span>PPN 11%:</span>
                                        <span className="font-mono font-bold">
                                            {fmt(
                                                confirmingLoc.vendorCost * 0.11,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-blue-200/60 pt-2 font-bold text-slate-900">
                                    <span>Total Nilai PO Titik Ini:</span>
                                    <span className="font-mono text-sm text-blue-700">
                                        {fmt(
                                            isPPN
                                                ? confirmingLoc.vendorCost *
                                                      1.11
                                                : confirmingLoc.vendorCost,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 bg-white px-6 py-4">
                            <button
                                onClick={() => setConfirmingLoc(null)}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmPO}
                                className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                            >
                                Ya, Terbitkan PO Titik Ini
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Terbitkan PO Kolektif Per Vendor */}
            {confirmingVendorGroup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex-shrink-0 border-b border-slate-100 bg-white px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Terbitkan PO Kolektif Vendor
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {confirmingVendorGroup.vendorName}
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setConfirmingVendorGroup(null)
                                    }
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                                <p className="text-xs font-bold text-blue-900">
                                    Akan menerbitkan 1 nomor PO gabungan untuk{' '}
                                    {confirmingVendorGroup.unissuedItems.length}{' '}
                                    titik lokasi sekaligus:
                                </p>
                                <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                                    {confirmingVendorGroup.unissuedItems.map(
                                        (item, i) => (
                                            <li
                                                key={item.id}
                                                className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white p-2 text-[11px] text-slate-700"
                                            >
                                                <span className="font-semibold">
                                                    {i + 1}. {item.description}{' '}
                                                    ({item.area})
                                                </span>
                                                <span className="font-mono font-bold text-slate-900">
                                                    {fmt(item.vendorCost)}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>

                            {/* 2-Column Grid Layout */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Left Column: Opsi Penerangan PO & Skema Card */}
                                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    <div className="space-y-4">
                                        {/* 1. Opsi Penerangan PO */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Penerangan PO
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPoLighting(
                                                            'Berlampu',
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                        poLighting ===
                                                        'Berlampu'
                                                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-4 w-4 flex-shrink-0 text-amber-500"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                                        />
                                                    </svg>
                                                    Berlampu (Default)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPoLighting(
                                                            'Tidak Berlampu',
                                                        )
                                                    }
                                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                        poLighting ===
                                                        'Tidak Berlampu'
                                                            ? 'shadow-2xs border-slate-800 bg-slate-800 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <svg
                                                        className="h-4 w-4 flex-shrink-0 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                                        />
                                                    </svg>
                                                    Tidak Berlampu
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Pilih Skema Pembayaran Vendor */}
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Pilih Skema Pembayaran Vendor
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    {
                                                        id: 'full',
                                                        label: 'Lunas Sekaligus',
                                                        desc: 'Cash 100% setelah visual terpasang',
                                                    },
                                                    {
                                                        id: 'dp',
                                                        label: 'DP + Pelunasan',
                                                        desc: 'DP 50% & Pelunasan 50%',
                                                    },
                                                    {
                                                        id: 'termin',
                                                        label: 'Termin 3 Tahap',
                                                        desc: 'Milestone progres 30–40–30%',
                                                    },
                                                    {
                                                        id: 'installment',
                                                        label: 'Tempo / Net 30',
                                                        desc: 'Pelunasan 30 hari kalender',
                                                    },
                                                ].map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelectVendorScheme(
                                                                s.id as PaymentScheme,
                                                            )
                                                        }
                                                        className={`cursor-pointer rounded-2xl border p-2.5 text-left transition-all ${
                                                            vendorTermScheme ===
                                                            s.id
                                                                ? 'border-blue-600 bg-blue-50/90 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {s.label}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500">
                                                            {s.desc}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Catatan TOP PO */}
                                    <div className="space-y-1 pt-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Catatan Term of Payment (TOP) PO
                                        </label>
                                        <input
                                            type="text"
                                            value={poTopNotes}
                                            onChange={(e) =>
                                                setPoTopNotes(e.target.value)
                                            }
                                            placeholder="Ketik catatan Term of Payment (TOP)..."
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: RINCIAN TERMIN, PERSENTASE & JATUH TEMPO VENDOR */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    {(() => {
                                        const targetCost =
                                            confirmingVendorGroup.unissuedItems.reduce(
                                                (s, it) => s + it.vendorCost,
                                                0,
                                            );
                                        const totalWithPpn = isPPN
                                            ? Math.round(targetCost * 1.11)
                                            : targetCost;
                                        const sumPct =
                                            vendorTermPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );

                                        return (
                                            <div className="flex flex-1 flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            Rincian Termin,
                                                            Persentase & Jatuh
                                                            Tempo
                                                        </label>
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                                                sumPct === 100
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    : 'animate-pulse border-rose-200 bg-rose-50 font-extrabold text-rose-700'
                                                            }`}
                                                        >
                                                            Total: {sumPct}% (
                                                            {fmt(totalWithPpn)})
                                                        </span>
                                                    </div>

                                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                                                        {vendorTermPercents.map(
                                                            (pct, idx) => {
                                                                const termAmt =
                                                                    Math.round(
                                                                        (totalWithPpn *
                                                                            (pct ||
                                                                                0)) /
                                                                            100,
                                                                    );
                                                                const termLabel =
                                                                    vendorTermPercents.length ===
                                                                    1
                                                                        ? 'Pelunasan Total Vendor'
                                                                        : idx ===
                                                                            0
                                                                          ? 'Termin 1 – Uang Muka (DP)'
                                                                          : idx ===
                                                                              vendorTermPercents.length -
                                                                                  1
                                                                            ? `Termin ${idx + 1} – Pelunasan`
                                                                            : `Termin ${idx + 1} – Progres`;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="font-bold text-slate-900">
                                                                                {
                                                                                    termLabel
                                                                                }
                                                                            </div>
                                                                            <div className="font-mono text-[10px] text-slate-500">
                                                                                {fmt(
                                                                                    termAmt,
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    Porsi:
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        pct ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const val =
                                                                                            parseFloat(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                            0;
                                                                                        const updated =
                                                                                            [
                                                                                                ...vendorTermPercents,
                                                                                            ];
                                                                                        updated[
                                                                                            idx
                                                                                        ] =
                                                                                            val;
                                                                                        setVendorTermPercents(
                                                                                            updated,
                                                                                        );
                                                                                    }}
                                                                                    className="w-12 rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-xs font-bold focus:border-blue-600 focus:outline-none"
                                                                                />
                                                                                <span className="text-xs font-bold text-slate-600">
                                                                                    %
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    Jatuh
                                                                                    Tempo:
                                                                                </span>
                                                                                <div className="relative flex items-center">
                                                                                    <div className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                                                                        <span>
                                                                                            {formatIndoDate(
                                                                                                vendorTermDates[
                                                                                                    idx
                                                                                                ] ||
                                                                                                    new Date()
                                                                                                        .toISOString()
                                                                                                        .split(
                                                                                                            'T',
                                                                                                        )[0],
                                                                                            )}
                                                                                        </span>
                                                                                        <svg
                                                                                            className="h-3.5 w-3.5 text-slate-400"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                            stroke="currentColor"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                            />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={
                                                                                            vendorTermDates[
                                                                                                idx
                                                                                            ] ||
                                                                                            new Date()
                                                                                                .toISOString()
                                                                                                .split(
                                                                                                    'T',
                                                                                                )[0]
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) => {
                                                                                            const updated =
                                                                                                [
                                                                                                    ...vendorTermDates,
                                                                                                ];
                                                                                            updated[
                                                                                                idx
                                                                                            ] =
                                                                                                e.target.value;
                                                                                            setVendorTermDates(
                                                                                                updated,
                                                                                            );
                                                                                        }}
                                                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Calculation Summary */}
                            {(() => {
                                const sumDpp =
                                    confirmingVendorGroup.unissuedItems.reduce(
                                        (s, it) => s + it.vendorCost,
                                        0,
                                    );
                                const sumPpn = isPPN ? sumDpp * 0.11 : 0;
                                const sumTotal = sumDpp + sumPpn;
                                return (
                                    <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>
                                                Total DPP (
                                                {
                                                    confirmingVendorGroup
                                                        .unissuedItems.length
                                                }{' '}
                                                Titik):
                                            </span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {fmt(sumDpp)}
                                            </span>
                                        </div>
                                        {isPPN && (
                                            <div className="flex justify-between text-violet-700">
                                                <span>Total PPN (11%):</span>
                                                <span className="font-mono font-bold">
                                                    {fmt(sumPpn)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                                            <span>
                                                Total Nilai PO Vendor Ini:
                                            </span>
                                            <span className="font-mono text-sm text-blue-700">
                                                {fmt(sumTotal)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 bg-white px-6 py-4">
                            <button
                                onClick={() => setConfirmingVendorGroup(null)}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmVendorBulkPO}
                                className="flex-1 cursor-pointer rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                            >
                                Ya, Terbitkan PO Kolektif Vendor Ini
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
