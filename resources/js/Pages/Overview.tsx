import React, { useState } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import MetricCard from '@/Components/Card/MetricCard';
import StatusBadge from '@/Components/UI/StatusBadge';
import MonthPicker from '@/Components/Form/MonthPicker';
import PaymentModal, { PaymentModalData } from '@/Components/UI/PaymentModal';
import CashflowChartCard from '@/Components/Card/CashflowChartCard';
import PpnStatusCard from '@/Components/Card/PpnStatusCard';
import UpcomingReceivablesWidget from '@/Components/Card/UpcomingReceivablesWidget';
import UpcomingDebtsWidget from '@/Components/Card/UpcomingDebtsWidget';
import RecentTransactionsCard from '@/Components/Card/RecentTransactionsCard';

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatRupiah = (num: number) => {
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const parseRupiah = (valStr: string) => {
    return parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
};

export default function Overview() {
    const fiscalMode = useFiscalMode();
    
    // Dynamic initial state based on current real date
    const now = new Date();
    const initialYear = now.getFullYear().toString();
    const initialMonth = (now.getMonth() + 1).toString().padStart(2, '0');

    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedYear, setSelectedYear] = useState(initialYear);

    // Dynamic states for upcoming debts
    const [upcomingDebts, setUpcomingDebts] = useState([
        {
            id: 'PO-PPN-003',
            idNonPpn: 'PO-NP-003',
            vendor: 'PT. Megah Billboard Jaya',
            project: 'Samsung S27 Launching',
            dueDate: '2026-07-04',
            amount: 4500000,
            amountNonPpn: 4050000,
            status: 'unpaid',
            notes: 'Pelunasan sewa spot Sudirman Tahap 2'
        },
        {
            id: 'PO-PPN-004',
            idNonPpn: 'PO-NP-004',
            vendor: 'CV. Media Ad Perkasa',
            project: 'Campaign Honda GIIAS 2026',
            dueDate: '2026-07-02',
            amount: 2500000,
            amountNonPpn: 2250000,
            status: 'unpaid',
            notes: 'Jasa printing MMT Baliho besar'
        }
    ]);

    // Dynamic states for upcoming receivables (piutang)
    const [upcomingReceivables, setUpcomingReceivables] = useState([
        {
            id: 'INV-PPN-004',
            idNonPpn: 'INV-NP-004',
            client: 'Traveloka Corp',
            project: 'Videotron Bandara Ahmad Yani',
            dueDate: '2026-07-03',
            amount: 7770000,
            amountNonPpn: 7000000,
            status: 'unpaid',
            notes: 'Pelunasan sewa videotron'
        },
        {
            id: 'INV-PPN-005',
            idNonPpn: 'INV-NP-005',
            client: 'PT. Gojek Tokopedia',
            project: 'Billboard Sudirman Yogyakarta',
            dueDate: '2026-07-01',
            amount: 5550000,
            amountNonPpn: 5000000,
            status: 'unpaid',
            notes: 'Termin 1 Pemasangan Baliho'
        }
    ]);

    const [paidAdjustment, setPaidAdjustment] = useState(0);
    const [receivedAdjustment, setReceivedAdjustment] = useState(0);
    const [successAlert, setSuccessAlert] = useState<string | null>(null);
    const [paymentModalState, setPaymentModalState] = useState<{
        show: boolean;
        data: PaymentModalData | null;
    }>({ show: false, data: null });

    const handlePayDebt = (debtId: string, amount: number, vendor: string) => {
        const debtObj = upcomingDebts.find(d => d.id === debtId);
        const titleDoc = debtObj ? (fiscalMode === 'ppn' ? debtObj.id : debtObj.idNonPpn) : 'Hutang / PO';
        setPaymentModalState({
            show: true,
            data: {
                id: debtId,
                title: titleDoc,
                partyName: vendor,
                amount: amount,
                type: 'pay',
            }
        });
    };

    const handleReceivePayment = (receivableId: string, amount: number, client: string) => {
        const recObj = upcomingReceivables.find(r => r.id === receivableId);
        const titleDoc = recObj ? (fiscalMode === 'ppn' ? recObj.id : recObj.idNonPpn) : 'Piutang / Invoice';
        setPaymentModalState({
            show: true,
            data: {
                id: receivableId,
                title: titleDoc,
                partyName: client,
                amount: amount,
                type: 'receive',
            }
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
            setUpcomingDebts(prev => prev.map(debt => debt.id === result.id ? { ...debt, status: 'paid' } : debt));
            setPaidAdjustment(prev => prev + result.amount);
            setSuccessAlert(`Sukses! Pembayaran hutang ke ${result.partyName} sebesar ${formatRupiah(result.amount)} via ${result.account} berhasil dicatat.`);
        } else {
            setUpcomingReceivables(prev => prev.map(rec => rec.id === result.id ? { ...rec, status: 'paid' } : rec));
            setReceivedAdjustment(prev => prev + result.amount);
            setSuccessAlert(`Sukses! Penerimaan piutang dari ${result.partyName} sebesar ${formatRupiah(result.amount)} masuk ke ${result.account} berhasil dicatat.`);
        }
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    const getUpcomingDebts = () => {
        return upcomingDebts.map(debt => {
            const dayOffset = debt.dueDate.split('-')[2];
            let nextMonth = parseInt(selectedMonth, 10) + 1;
            let nextYear = parseInt(selectedYear, 10);
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            }
            const monthStr = nextMonth.toString().padStart(2, '0');
            const yearStr = nextYear.toString();
            return {
                ...debt,
                dueDate: `${yearStr}-${monthStr}-${dayOffset}`,
                actualAmount: fiscalMode === 'ppn' ? debt.amount : debt.amountNonPpn,
                actualId: fiscalMode === 'ppn' ? debt.id : debt.idNonPpn
            };
        });
    };

    const getUpcomingReceivables = () => {
        return upcomingReceivables.map(rec => {
            const dayOffset = rec.dueDate.split('-')[2];
            let nextMonth = parseInt(selectedMonth, 10) + 1;
            let nextYear = parseInt(selectedYear, 10);
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            }
            const monthStr = nextMonth.toString().padStart(2, '0');
            const yearStr = nextYear.toString();
            return {
                ...rec,
                dueDate: `${yearStr}-${monthStr}-${dayOffset}`,
                actualAmount: fiscalMode === 'ppn' ? rec.amount : rec.amountNonPpn,
                actualId: fiscalMode === 'ppn' ? rec.id : rec.idNonPpn
            };
        });
    };

    // Data mapped by Month + Year
    const dataByPeriod = {
        '05-2026': {
            ppn: {
                totalSaldo: 'Rp 390.500.000',
                totalPemasukan: 'Rp 480.000.000',
                totalPengeluaran: 'Rp 110.000.000',
                taxOrDebt: 'Rp 38.500.000',
                ppnKeluaranNominal: 'Rp 72.000.000',
                ppnKeluaranPercent: '68.2%',
                ppnMasukanNominal: 'Rp 33.500.000',
                ppnMasukanPercent: '31.8%',
            },
            nonPpn: {
                totalSaldo: 'Rp 195.400.000',
                totalPemasukan: 'Rp 290.000.000',
                totalPengeluaran: 'Rp 105.000.000',
                taxOrDebt: 'Rp 28.000.000',
            }
        },
        '06-2026': {
            ppn: {
                totalSaldo: 'Rp 430.715.000',
                totalPemasukan: 'Rp 552.950.000',
                totalPengeluaran: 'Rp 122.235.000',
                taxOrDebt: 'Rp 43.065.000',
                ppnKeluaranNominal: 'Rp 86.001.000',
                ppnKeluaranPercent: '66.7%',
                ppnMasukanNominal: 'Rp 42.936.000',
                ppnMasukanPercent: '33.3%',
            },
            nonPpn: {
                totalSaldo: 'Rp 230.800.000',
                totalPemasukan: 'Rp 350.000.000',
                totalPengeluaran: 'Rp 119.200.000',
                taxOrDebt: 'Rp 32.500.000',
            }
        },
        '07-2026': {
            ppn: {
                totalSaldo: 'Rp 460.900.000',
                totalPemasukan: 'Rp 580.000.000',
                totalPengeluaran: 'Rp 140.000.000',
                taxOrDebt: 'Rp 48.400.000',
                ppnKeluaranNominal: 'Rp 91.200.000',
                ppnKeluaranPercent: '68.0%',
                ppnMasukanNominal: 'Rp 42.800.000',
                ppnMasukanPercent: '32.0%',
            },
            nonPpn: {
                totalSaldo: 'Rp 262.500.000',
                totalPemasukan: 'Rp 385.000.000',
                totalPengeluaran: 'Rp 135.000.000',
                taxOrDebt: 'Rp 36.800.000',
            }
        }
    };

    const periodKey = `${selectedMonth}-${selectedYear}`;
    const periodData = dataByPeriod[periodKey as keyof typeof dataByPeriod] || dataByPeriod['06-2026'];

    const baseSaldo = parseRupiah(fiscalMode === 'ppn' ? periodData.ppn.totalSaldo : periodData.nonPpn.totalSaldo);
    const basePemasukan = parseRupiah(fiscalMode === 'ppn' ? periodData.ppn.totalPemasukan : periodData.nonPpn.totalPemasukan);
    const basePengeluaran = parseRupiah(fiscalMode === 'ppn' ? periodData.ppn.totalPengeluaran : periodData.nonPpn.totalPengeluaran);
    const baseTaxOrDebt = parseRupiah(fiscalMode === 'ppn' ? periodData.ppn.taxOrDebt : periodData.nonPpn.taxOrDebt);

    const dynamicSaldo = baseSaldo - paidAdjustment + receivedAdjustment;
    const dynamicPemasukan = basePemasukan + receivedAdjustment;
    const dynamicPengeluaran = basePengeluaran + paidAdjustment;
    const dynamicTaxOrDebt = fiscalMode === 'ppn' ? baseTaxOrDebt : (baseTaxOrDebt + paidAdjustment - receivedAdjustment);

    const metrics = fiscalMode === 'ppn'
        ? {
              totalSaldo: formatRupiah(dynamicSaldo),
              totalPemasukan: formatRupiah(basePemasukan),
              totalPengeluaran: formatRupiah(dynamicPengeluaran),
              taxOrDebt: formatRupiah(dynamicTaxOrDebt),
              taxOrDebtTitle: 'PPN Bersih Terhutang',
              taxOrDebtBadge: 'Kurang Bayar',
              taxOrDebtCardBg: 'bg-amber-50/60 border-amber-200/60 shadow-xs hover:border-amber-300/80',
              taxOrDebtBadgeColor: 'bg-white/80 text-amber-800 border-amber-200/60',
              taxOrDebtIconBg: 'bg-white text-amber-600 border-amber-100 shadow-2xs',
              taxOrDebtValueColor: 'text-amber-950',
              ppnKeluaranNominal: periodData.ppn.ppnKeluaranNominal,
              ppnKeluaranPercent: periodData.ppn.ppnKeluaranPercent,
              ppnMasukanNominal: periodData.ppn.ppnMasukanNominal,
              ppnMasukanPercent: periodData.ppn.ppnMasukanPercent,
          }
        : {
              totalSaldo: formatRupiah(dynamicSaldo),
              totalPemasukan: formatRupiah(basePemasukan),
              totalPengeluaran: formatRupiah(dynamicPengeluaran),
              taxOrDebt: formatRupiah(dynamicTaxOrDebt),
              taxOrDebtTitle: 'Sisa Hutang & Piutang',
              taxOrDebtBadge: 'Sisa Hutang & Piutang',
              taxOrDebtCardBg: 'bg-indigo-50/60 border-indigo-200/60 shadow-xs hover:border-indigo-300/80',
              taxOrDebtBadgeColor: 'bg-white/80 text-indigo-800 border-indigo-200/60',
              taxOrDebtIconBg: 'bg-white text-indigo-600 border-indigo-100 shadow-2xs',
              taxOrDebtValueColor: 'text-indigo-950',
          };

    const rawTransactions = fiscalMode === 'ppn'
        ? [
              { dateOffset: 25, doc: 'INV-PPN-001', desc: 'Sewa Billboard Bunderan HI (4x8m) - 1 Bulan', client: 'PT. Gojek Tokopedia', amount: 'IDR 11.100.000', status: 'paid' },
              { dateOffset: 24, doc: 'PO-PPN-001', desc: 'Sewa Lahan Billboard Sudirman', client: 'PT. Megah Billboard Jaya', amount: 'IDR 3.330.000', status: 'received' },
              { dateOffset: 22, doc: 'INV-PPN-002', desc: 'Sewa Videotron Led Gatot Subroto - 2 Minggu', client: 'Traveloka Corp', amount: 'IDR 5.550.000', status: 'issued' },
              { dateOffset: 20, doc: 'PO-PPN-002', desc: 'Jasa Konstruksi & Pasang Besi Billboard', client: 'PT. Promosi Outdoor Kreasindo', amount: 'IDR 8.880.000', status: 'received' },
          ]
        : [
              { dateOffset: 25, doc: 'INV-NP-001', desc: 'Sewa Space Billboard Jl. Kemang Raya - 1 Bulan', client: 'Shopee Indonesia', amount: 'IDR 10.000.000', status: 'paid' },
              { dateOffset: 24, doc: 'PO-NP-001', desc: 'Jasa Konstruksi Billboard Kayu', client: 'CV. Media Ad Perkasa', amount: 'IDR 1.200.000', status: 'received' },
              { dateOffset: 22, doc: 'INV-NP-002', desc: 'Pemasangan Banner Billboard Mini - 10 Titik', client: 'PT. Citra Digital', amount: 'IDR 5.000.000', status: 'issued' },
              { dateOffset: 20, doc: 'PO-NP-002', desc: 'Cetak Banner MMT Baliho Super (6x12m)', client: 'PT. Promosi Outdoor Kreasindo', amount: 'IDR 2.000.000', status: 'received' },
          ];

    const transactions = rawTransactions.map(tx => ({
        ...tx,
        date: `${selectedYear}-${selectedMonth}-${tx.dateOffset.toString().padStart(2, '0')}`
    }));

    const chartDataByMonth = {
        '05': fiscalMode === 'ppn'
            ? [
                  { month: 'Des', inflow: { val: 'Rp 85jt', h: 85 }, outflow: { val: 'Rp 55jt', h: 55 } },
                  { month: 'Jan', inflow: { val: 'Rp 90jt', h: 90 }, outflow: { val: 'Rp 60jt', h: 60 } },
                  { month: 'Feb', inflow: { val: 'Rp 110jt', h: 110 }, outflow: { val: 'Rp 70jt', h: 70 } },
                  { month: 'Mar', inflow: { val: 'Rp 140jt', h: 140 }, outflow: { val: 'Rp 80jt', h: 80 } },
                  { month: 'Apr', inflow: { val: 'Rp 100jt', h: 100 }, outflow: { val: 'Rp 50jt', h: 50 } },
              ]
            : [
                  { month: 'Des', inflow: { val: 'Rp 76jt', h: 76 }, outflow: { val: 'Rp 49jt', h: 49 } },
                  { month: 'Jan', inflow: { val: 'Rp 81jt', h: 81 }, outflow: { val: 'Rp 54jt', h: 54 } },
                  { month: 'Feb', inflow: { val: 'Rp 99jt', h: 99 }, outflow: { val: 'Rp 63jt', h: 63 } },
                  { month: 'Mar', inflow: { val: 'Rp 126jt', h: 126 }, outflow: { val: 'Rp 72jt', h: 72 } },
                  { month: 'Apr', inflow: { val: 'Rp 90jt', h: 90 }, outflow: { val: 'Rp 45jt', h: 45 } },
              ],
        '06': fiscalMode === 'ppn'
            ? [
                  { month: 'Jan', inflow: { val: 'Rp 90jt', h: 90 }, outflow: { val: 'Rp 60jt', h: 60 } },
                  { month: 'Feb', inflow: { val: 'Rp 110jt', h: 110 }, outflow: { val: 'Rp 70jt', h: 70 } },
                  { month: 'Mar', inflow: { val: 'Rp 140jt', h: 140 }, outflow: { val: 'Rp 80jt', h: 80 } },
                  { month: 'Apr', inflow: { val: 'Rp 100jt', h: 100 }, outflow: { val: 'Rp 50jt', h: 50 } },
                  { month: 'Mei', inflow: { val: 'Rp 135jt', h: 135 }, outflow: { val: 'Rp 90jt', h: 90 } },
              ]
            : [
                  { month: 'Jan', inflow: { val: 'Rp 81jt', h: 81 }, outflow: { val: 'Rp 54jt', h: 54 } },
                  { month: 'Feb', inflow: { val: 'Rp 99jt', h: 99 }, outflow: { val: 'Rp 63jt', h: 63 } },
                  { month: 'Mar', inflow: { val: 'Rp 126jt', h: 126 }, outflow: { val: 'Rp 72jt', h: 72 } },
                  { month: 'Apr', inflow: { val: 'Rp 90jt', h: 90 }, outflow: { val: 'Rp 45jt', h: 45 } },
                  { month: 'Mei', inflow: { val: 'Rp 121jt', h: 121 }, outflow: { val: 'Rp 81jt', h: 81 } },
              ],
        '07': fiscalMode === 'ppn'
            ? [
                  { month: 'Feb', inflow: { val: 'Rp 110jt', h: 110 }, outflow: { val: 'Rp 70jt', h: 70 } },
                  { month: 'Mar', inflow: { val: 'Rp 140jt', h: 140 }, outflow: { val: 'Rp 80jt', h: 80 } },
                  { month: 'Apr', inflow: { val: 'Rp 100jt', h: 100 }, outflow: { val: 'Rp 50jt', h: 50 } },
                  { month: 'Mei', inflow: { val: 'Rp 135jt', h: 135 }, outflow: { val: 'Rp 90jt', h: 90 } },
                  { month: 'Jun', inflow: { val: 'Rp 150jt', h: 150 }, outflow: { val: 'Rp 95jt', h: 95 } },
              ]
            : [
                  { month: 'Feb', inflow: { val: 'Rp 99jt', h: 99 }, outflow: { val: 'Rp 63jt', h: 63 } },
                  { month: 'Mar', inflow: { val: 'Rp 126jt', h: 126 }, outflow: { val: 'Rp 72jt', h: 72 } },
                  { month: 'Apr', inflow: { val: 'Rp 90jt', h: 90 }, outflow: { val: 'Rp 45jt', h: 45 } },
                  { month: 'Mei', inflow: { val: 'Rp 121jt', h: 121 }, outflow: { val: 'Rp 81jt', h: 81 } },
                  { month: 'Jun', inflow: { val: 'Rp 135jt', h: 135 }, outflow: { val: 'Rp 85jt', h: 85 } },
              ],
    };

    interface ChartBar {
        month: string;
        inflow: { val: string; h: number };
        outflow: { val: string; h: number };
    }

    const chartData = (chartDataByMonth[selectedMonth as keyof typeof chartDataByMonth] || chartDataByMonth['06']) as ChartBar[];

    return (
        <AppLayout
            activePage="overview"
            title="Dashboard Overview"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Overview' }]}
        >
            <div className="space-y-8">
                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 transition-all animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="text-xs font-bold text-emerald-800 leading-tight">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Header Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PERIODE LAPORAN</span>
                        <h3 className="text-xs font-bold text-slate-700 tracking-tight mt-0.5">Filter Data Keuangan & Pajak</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <MonthPicker
                            value={`${selectedYear}-${selectedMonth}`}
                            onChange={(_val, year, month) => {
                                setSelectedYear(year);
                                setSelectedMonth(month);
                            }}
                        />
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Saldo Kas & Bank"
                        value={metrics.totalSaldo}
                        badgeText="Total Saldo"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs hover:border-blue-300/80"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title="Total Pemasukan (Gross)"
                        value={metrics.totalPemasukan}
                        badgeText="Pemasukan"
                        cardBgClass="bg-emerald-50/60 border-emerald-200/60 shadow-xs hover:border-emerald-300/80"
                        badgeColorClass="bg-white/90 text-emerald-800 border-emerald-200/60"
                        icon={
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7V15" />
                            </svg>
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />
                    <MetricCard
                        title="Total Pengeluaran (Gross)"
                        value={metrics.totalPengeluaran}
                        badgeText="Pengeluaran"
                        cardBgClass="bg-rose-50/60 border-rose-200/60 shadow-xs hover:border-rose-300/80"
                        badgeColorClass="bg-white/90 text-rose-800 border-rose-200/60"
                        icon={
                            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10M17 17H9m8 0V9" />
                            </svg>
                        }
                        iconColorClass="bg-white text-rose-600 border-rose-100 shadow-2xs"
                        valueColorClass="text-rose-950"
                    />
                    <MetricCard
                        title={metrics.taxOrDebtTitle}
                        value={metrics.taxOrDebt}
                        badgeText={metrics.taxOrDebtBadge}
                        cardBgClass={metrics.taxOrDebtCardBg}
                        badgeColorClass={metrics.taxOrDebtBadgeColor}
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6M9 15l6-6M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
                            </svg>
                        }
                        iconColorClass={metrics.taxOrDebtIconBg}
                        valueColorClass={metrics.taxOrDebtValueColor}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <CashflowChartCard chartData={chartData} />
                    <PpnStatusCard
                        fiscalMode={fiscalMode}
                        ppnKeluaranNominal={metrics.ppnKeluaranNominal}
                        ppnKeluaranPercent={metrics.ppnKeluaranPercent}
                        ppnMasukanNominal={metrics.ppnMasukanNominal}
                        ppnMasukanPercent={metrics.ppnMasukanPercent}
                        taxOrDebt={metrics.taxOrDebt}
                    />
                </div>

                {/* Section: Hutang & Piutang Jatuh Tempo 1 Minggu */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UpcomingReceivablesWidget
                        receivables={getUpcomingReceivables()}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onReceivePayment={handleReceivePayment}
                        formatDateIndo={formatDateIndo}
                        formatRupiah={formatRupiah}
                    />
                    <UpcomingDebtsWidget
                        debts={getUpcomingDebts()}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onPayDebt={handlePayDebt}
                        formatDateIndo={formatDateIndo}
                        formatRupiah={formatRupiah}
                    />
                </div>

                {/* Recent Transactions List */}
                <RecentTransactionsCard transactions={transactions} />
            </div>

            {/* Payment & Receipt Modal */}
            <PaymentModal
                show={paymentModalState.show}
                onClose={() => setPaymentModalState({ show: false, data: null })}
                data={paymentModalState.data}
                onSubmit={handlePaymentModalSubmit}
            />
        </AppLayout>
    );
}
