import CashflowChartCard from '@/Components/Card/CashflowChartCard';
import MetricCard from '@/Components/Card/MetricCard';
import PpnStatusCard from '@/Components/Card/PpnStatusCard';
import RecentTransactionsCard from '@/Components/Card/RecentTransactionsCard';
import UpcomingDebtsWidget, {
    DebtItem,
} from '@/Components/Card/UpcomingDebtsWidget';
import UpcomingReceivablesWidget, {
    ReceivableItem,
} from '@/Components/Card/UpcomingReceivablesWidget';
import MonthPicker from '@/Components/Form/MonthPicker';
import PaymentModal, { PaymentModalData } from '@/Components/UI/PaymentModal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatRupiah = (num: number) => {
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

interface MetricData {
    totalSaldo: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    taxOrDebt: number;
    ppnKeluaranNominal?: number;
    ppnKeluaranPercent?: string;
    ppnMasukanNominal?: number;
    ppnMasukanPercent?: string;
}

interface ChartBar {
    month: string;
    inflow: { val: string; h: number };
    outflow: { val: string; h: number };
}

interface UpcomingReceivableItem {
    id: string;
    invoiceNumber: string;
    client: string;
    project: string;
    dueDate: string;
    amount: number;
    status: string;
    fiscalMode: 'ppn' | 'non-ppn';
    notes?: string;
}

interface UpcomingDebtItem {
    id: string;
    poNumber: string;
    vendor: string;
    project: string;
    dueDate: string;
    amount: number;
    status: string;
    fiscalMode: 'ppn' | 'non-ppn';
    notes?: string;
}

interface RecentTransactionItem {
    id: string;
    type: 'invoice' | 'purchase_order';
    doc: string;
    desc: string;
    client: string;
    amount: number;
    date: string;
    status: string;
    fiscalMode: 'ppn' | 'non-ppn';
}

interface OverviewProps {
    filters: {
        month: string;
        year: string;
    };
    metrics: {
        ppn: MetricData;
        nonPpn: MetricData;
    };
    chartData: {
        ppn: ChartBar[];
        nonPpn: ChartBar[];
    };
    upcomingReceivables: UpcomingReceivableItem[];
    upcomingDebts: UpcomingDebtItem[];
    recentTransactions: RecentTransactionItem[];
}

export default function Overview({
    filters,
    metrics,
    chartData,
    upcomingReceivables,
    upcomingDebts,
    recentTransactions,
}: OverviewProps) {
    const fiscalMode = useFiscalMode();

    const [selectedMonth, setSelectedMonth] = useState(
        filters?.month ||
            (new Date().getMonth() + 1).toString().padStart(2, '0'),
    );
    const [selectedYear, setSelectedYear] = useState(
        filters?.year || new Date().getFullYear().toString(),
    );

    useEffect(() => {
        if (filters?.month) setSelectedMonth(filters.month);
        if (filters?.year) setSelectedYear(filters.year);
    }, [filters?.month, filters?.year]);

    const [debtsList, setDebtsList] = useState(upcomingDebts || []);
    const [receivablesList, setReceivablesList] = useState(
        upcomingReceivables || [],
    );
    const [paidAdjustment, setPaidAdjustment] = useState(0);
    const [receivedAdjustment, setReceivedAdjustment] = useState(0);
    const [successAlert, setSuccessAlert] = useState<string | null>(null);
    const [paymentModalState, setPaymentModalState] = useState<{
        show: boolean;
        data: PaymentModalData | null;
    }>({ show: false, data: null });

    useEffect(() => {
        setDebtsList(upcomingDebts || []);
        setReceivablesList(upcomingReceivables || []);
        setPaidAdjustment(0);
        setReceivedAdjustment(0);
    }, [upcomingDebts, upcomingReceivables]);

    const handleMonthChange = (
        _val: string,
        year: string,
        month: string,
    ) => {
        setSelectedYear(year);
        setSelectedMonth(month);
        router.get(
            route('overview'),
            { month, year },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePayDebt = (debtId: string, amount: number, vendor: string) => {
        const debtObj = debtsList.find((d) => d.id === debtId);
        const titleDoc = debtObj?.poNumber || 'Hutang / PO';
        setPaymentModalState({
            show: true,
            data: {
                id: debtId,
                title: titleDoc,
                partyName: vendor,
                amount: amount,
                type: 'pay',
            },
        });
    };

    const handleReceivePayment = (
        receivableId: string,
        amount: number,
        client: string,
    ) => {
        const recObj = receivablesList.find((r) => r.id === receivableId);
        const titleDoc = recObj?.invoiceNumber || 'Piutang / Invoice';
        setPaymentModalState({
            show: true,
            data: {
                id: receivableId,
                title: titleDoc,
                partyName: client,
                amount: amount,
                type: 'receive',
            },
        });
    };

    const handlePaymentModalSubmit = (result: {
        id: string;
        account: string;
        amount: number;
        date: string;
        method: string;
        reference: string;
        type: 'receive' | 'pay';
        partyName: string;
    }) => {
        if (result.type === 'pay') {
            setDebtsList((prev) =>
                prev.map((debt) =>
                    debt.id === result.id ? { ...debt, status: 'paid' } : debt,
                ),
            );
            setPaidAdjustment((prev) => prev + result.amount);
            setSuccessAlert(
                `Sukses! Pembayaran hutang ke ${result.partyName} sebesar ${formatRupiah(result.amount)} via ${result.account} berhasil dicatat.`,
            );
        } else {
            setReceivablesList((prev) =>
                prev.map((rec) =>
                    rec.id === result.id ? { ...rec, status: 'paid' } : rec,
                ),
            );
            setReceivedAdjustment((prev) => prev + result.amount);
            setSuccessAlert(
                `Sukses! Penerimaan piutang dari ${result.partyName} sebesar ${formatRupiah(result.amount)} masuk ke ${result.account} berhasil dicatat.`,
            );
        }
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Calculate current metrics based on active fiscal mode
    const currentModeMetric =
        fiscalMode === 'ppn'
            ? metrics?.ppn || {
                  totalSaldo: 0,
                  totalPemasukan: 0,
                  totalPengeluaran: 0,
                  taxOrDebt: 0,
                  ppnKeluaranNominal: 0,
                  ppnKeluaranPercent: '0%',
                  ppnMasukanNominal: 0,
                  ppnMasukanPercent: '0%',
              }
            : metrics?.nonPpn || {
                  totalSaldo: 0,
                  totalPemasukan: 0,
                  totalPengeluaran: 0,
                  taxOrDebt: 0,
              };

    const baseSaldo = currentModeMetric.totalSaldo;
    const basePemasukan = currentModeMetric.totalPemasukan;
    const basePengeluaran = currentModeMetric.totalPengeluaran;
    const baseTaxOrDebt = currentModeMetric.taxOrDebt;

    const dynamicSaldo = baseSaldo - paidAdjustment + receivedAdjustment;
    const dynamicPengeluaran = basePengeluaran + paidAdjustment;
    const dynamicTaxOrDebt =
        fiscalMode === 'ppn'
            ? baseTaxOrDebt
            : baseTaxOrDebt + paidAdjustment - receivedAdjustment;

    const displayMetrics =
        fiscalMode === 'ppn'
            ? {
                  totalSaldo: formatRupiah(dynamicSaldo),
                  totalPemasukan: formatRupiah(basePemasukan),
                  totalPengeluaran: formatRupiah(dynamicPengeluaran),
                  taxOrDebt: formatRupiah(dynamicTaxOrDebt),
                  taxOrDebtTitle: 'PPN Bersih Terhutang',
                  taxOrDebtBadge:
                      dynamicTaxOrDebt >= 0 ? 'Kurang Bayar' : 'Lebih Bayar',
                  taxOrDebtCardBg:
                      'bg-amber-50/60 border-amber-200/60 shadow-xs hover:border-amber-300/80',
                  taxOrDebtBadgeColor:
                      'bg-white/80 text-amber-800 border-amber-200/60',
                  taxOrDebtIconBg:
                      'bg-white text-amber-600 border-amber-100 shadow-2xs',
                  taxOrDebtValueColor: 'text-amber-950',
                  ppnKeluaranNominal: formatRupiah(
                      currentModeMetric.ppnKeluaranNominal || 0,
                  ),
                  ppnKeluaranPercent:
                      currentModeMetric.ppnKeluaranPercent || '0%',
                  ppnMasukanNominal: formatRupiah(
                      currentModeMetric.ppnMasukanNominal || 0,
                  ),
                  ppnMasukanPercent:
                      currentModeMetric.ppnMasukanPercent || '0%',
              }
            : {
                  totalSaldo: formatRupiah(dynamicSaldo),
                  totalPemasukan: formatRupiah(basePemasukan),
                  totalPengeluaran: formatRupiah(dynamicPengeluaran),
                  taxOrDebt: formatRupiah(dynamicTaxOrDebt),
                  taxOrDebtTitle: 'Sisa Hutang & Piutang',
                  taxOrDebtBadge: 'Sisa Hutang & Piutang',
                  taxOrDebtCardBg:
                      'bg-indigo-50/60 border-indigo-200/60 shadow-xs hover:border-indigo-300/80',
                  taxOrDebtBadgeColor:
                      'bg-white/80 text-indigo-800 border-indigo-200/60',
                  taxOrDebtIconBg:
                      'bg-white text-indigo-600 border-indigo-100 shadow-2xs',
                  taxOrDebtValueColor: 'text-indigo-950',
                  ppnKeluaranNominal: 'Rp 0',
                  ppnKeluaranPercent: '0%',
                  ppnMasukanNominal: 'Rp 0',
                  ppnMasukanPercent: '0%',
              };

    // Filter upcoming items by active fiscal mode
    const displayedDebts: DebtItem[] = debtsList
        .filter((debt) => debt.fiscalMode === fiscalMode)
        .map((debt) => ({
            id: debt.id,
            actualId: debt.poNumber,
            vendor: debt.vendor,
            project: debt.project,
            notes: debt.notes,
            dueDate: debt.dueDate,
            actualAmount: debt.amount,
            status: debt.status,
        }));

    const displayedReceivables: ReceivableItem[] = receivablesList
        .filter((rec) => rec.fiscalMode === fiscalMode)
        .map((rec) => ({
            id: rec.id,
            actualId: rec.invoiceNumber,
            client: rec.client,
            project: rec.project,
            notes: rec.notes,
            dueDate: rec.dueDate,
            actualAmount: rec.amount,
            status: rec.status,
        }));

    // Transactions list
    const displayedTransactions = (recentTransactions || [])
        .filter((t) => t.fiscalMode === fiscalMode)
        .map((tx) => ({
            date: tx.date,
            doc: tx.doc,
            desc: tx.desc,
            client: tx.client,
            status: tx.status,
            amount: formatRupiah(tx.amount),
        }));

    const currentChartData =
        fiscalMode === 'ppn'
            ? chartData?.ppn || []
            : chartData?.nonPpn || [];

    return (
        <AppLayout
            activePage="overview"
            title="Dashboard Overview"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Overview' }]}
        >
            <div className="space-y-8">
                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition-all">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                            <svg
                                className="h-5 w-5"
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
                        </div>
                        <div className="text-xs font-bold leading-tight text-emerald-800">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Header Filter Bar */}
                <div className="shadow-xs flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                            PERIODE LAPORAN
                        </span>
                        <h3 className="mt-0.5 text-xs font-bold tracking-tight text-slate-700">
                            Filter Data Keuangan & Pajak
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <MonthPicker
                            value={`${selectedYear}-${selectedMonth}`}
                            onChange={handleMonthChange}
                        />
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Saldo Kas & Bank"
                        value={displayMetrics.totalSaldo}
                        badgeText="Total Saldo"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs hover:border-blue-300/80"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title="Total Pemasukan (Gross)"
                        value={displayMetrics.totalPemasukan}
                        badgeText="Pemasukan"
                        cardBgClass="bg-emerald-50/60 border-emerald-200/60 shadow-xs hover:border-emerald-300/80"
                        badgeColorClass="bg-white/90 text-emerald-800 border-emerald-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 17L17 7M17 7H9M17 7V15"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />
                    <MetricCard
                        title="Total Pengeluaran (Gross)"
                        value={displayMetrics.totalPengeluaran}
                        badgeText="Pengeluaran"
                        cardBgClass="bg-rose-50/60 border-rose-200/60 shadow-xs hover:border-rose-300/80"
                        badgeColorClass="bg-white/90 text-rose-800 border-rose-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-rose-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 7l10 10M17 17H9m8 0V9"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-rose-600 border-rose-100 shadow-2xs"
                        valueColorClass="text-rose-950"
                    />
                    <MetricCard
                        title={displayMetrics.taxOrDebtTitle}
                        value={displayMetrics.taxOrDebt}
                        badgeText={displayMetrics.taxOrDebtBadge}
                        cardBgClass={displayMetrics.taxOrDebtCardBg}
                        badgeColorClass={displayMetrics.taxOrDebtBadgeColor}
                        icon={
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
                                    d="M9 9l6 6M9 15l6-6M9 9h.01M15 9h.01M9 15h.01M15 15h.01"
                                />
                            </svg>
                        }
                        iconColorClass={displayMetrics.taxOrDebtIconBg}
                        valueColorClass={displayMetrics.taxOrDebtValueColor}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <CashflowChartCard chartData={currentChartData} />
                    <PpnStatusCard
                        fiscalMode={fiscalMode}
                        ppnKeluaranNominal={displayMetrics.ppnKeluaranNominal}
                        ppnKeluaranPercent={displayMetrics.ppnKeluaranPercent}
                        ppnMasukanNominal={displayMetrics.ppnMasukanNominal}
                        ppnMasukanPercent={displayMetrics.ppnMasukanPercent}
                        taxOrDebt={displayMetrics.taxOrDebt}
                    />
                </div>

                {/* Section: Hutang & Piutang Jatuh Tempo 1 Minggu */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <UpcomingReceivablesWidget
                        receivables={displayedReceivables}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onReceivePayment={handleReceivePayment}
                        formatDateIndo={formatDateIndo}
                        formatRupiah={formatRupiah}
                    />
                    <UpcomingDebtsWidget
                        debts={displayedDebts}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onPayDebt={handlePayDebt}
                        formatDateIndo={formatDateIndo}
                        formatRupiah={formatRupiah}
                    />
                </div>

                {/* Recent Transactions List */}
                <RecentTransactionsCard transactions={displayedTransactions} />
            </div>

            {/* Payment & Receipt Modal */}
            <PaymentModal
                show={paymentModalState.show}
                onClose={() =>
                    setPaymentModalState({ show: false, data: null })
                }
                data={paymentModalState.data}
                onSubmit={handlePaymentModalSubmit}
            />
        </AppLayout>
    );
}
