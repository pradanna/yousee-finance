import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';
import MetricCard from '@/Components/MetricCard';
import StatusBadge from '@/Components/StatusBadge';

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
    const fiscalMode = useDemoFiscalMode();
    const [selectedMonth, setSelectedMonth] = useState('06');
    const [selectedYear, setSelectedYear] = useState('2026');

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

    const handlePayDebt = (debtId: string, amount: number, vendor: string) => {
        const isConfirmed = window.confirm(`Apakah Anda yakin ingin mencatat pembayaran hutang ke ${vendor} sebesar ${formatRupiah(amount)}?`);
        if (!isConfirmed) return;

        setUpcomingDebts(prev => prev.map(debt => {
            if (debt.id === debtId) {
                return { ...debt, status: 'paid' };
            }
            return debt;
        }));
        setPaidAdjustment(prev => prev + amount);
        setSuccessAlert(`Sukses! Pembayaran hutang (PO) ke ${vendor} sebesar ${formatRupiah(amount)} berhasil dicatat.`);
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    const handleReceivePayment = (receivableId: string, amount: number, client: string) => {
        const isConfirmed = window.confirm(`Apakah Anda yakin ingin mencatat penerimaan piutang dari ${client} sebesar ${formatRupiah(amount)}?`);
        if (!isConfirmed) return;

        setUpcomingReceivables(prev => prev.map(rec => {
            if (rec.id === receivableId) {
                return { ...rec, status: 'paid' };
            }
            return rec;
        }));
        setReceivedAdjustment(prev => prev + amount);
        setSuccessAlert(`Sukses! Penerimaan piutang dari ${client} sebesar ${formatRupiah(amount)} berhasil dicatat.`);
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
              taxOrDebtBadgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
              taxOrDebtValueColor: 'text-amber-600',
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
              taxOrDebtBadgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
              taxOrDebtValueColor: 'text-indigo-600',
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
        <DemoLayout
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PERIODE LAPORAN</span>
                        <h3 className="text-xs font-bold text-slate-700 tracking-tight mt-0.5">Filter Data Keuangan & Pajak</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-700 py-1.5 pl-3 pr-8 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-colors"
                            >
                                <option value="05">Mei</option>
                                <option value="06">Juni (Bulan Ini)</option>
                                <option value="07">Juli</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-700 py-1.5 pl-3 pr-8 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-colors"
                            >
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Saldo Kas & Bank"
                        value={metrics.totalSaldo}
                        badgeText="Total Saldo"
                        badgeColorClass="bg-slate-50 text-slate-500 border-slate-100"
                        icon={
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        }
                        iconColorClass="bg-blue-50/50 text-blue-600 border-blue-100"
                    />
                    <MetricCard
                        title="Total Pemasukan (Gross)"
                        value={metrics.totalPemasukan}
                        badgeText="↗ Pemasukan"
                        badgeColorClass="bg-emerald-50 text-emerald-700 border-emerald-100"
                        icon={
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7V15" />
                            </svg>
                        }
                        iconColorClass="bg-emerald-50/50 text-emerald-600 border-emerald-100"
                    />
                    <MetricCard
                        title="Total Pengeluaran (Gross)"
                        value={metrics.totalPengeluaran}
                        badgeText="↘ Pengeluaran"
                        badgeColorClass="bg-rose-50 text-rose-700 border-rose-100"
                        icon={
                            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10M17 17H9m8 0V9" />
                            </svg>
                        }
                        iconColorClass="bg-rose-50/50 text-rose-600 border-rose-100"
                    />
                    <MetricCard
                        title={metrics.taxOrDebtTitle}
                        value={metrics.taxOrDebt}
                        badgeText={metrics.taxOrDebtBadge}
                        badgeColorClass={metrics.taxOrDebtBadgeColor}
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6M9 15l6-6M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
                            </svg>
                        }
                        iconColorClass={`${fiscalMode === 'ppn' ? 'bg-amber-50/50 text-amber-600 border-amber-100' : 'bg-indigo-50/50 text-indigo-600 border-indigo-100'}`}
                        valueColorClass={metrics.taxOrDebtValueColor}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Monthly Cashflow Trend (SVG Chart) */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs lg:col-span-2 space-y-4">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Tren Cashflow Bulanan</h2>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Perbandingan Aliran Dana Masuk & Keluar</p>
                        </div>
                        <div className="h-64 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 500 215">
                                {/* Gridlines */}
                                <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="40" y1="180" x2="480" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                                {/* Y-Axis Labels */}
                                <text x="32" y="33" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="end">150M</text>
                                <text x="32" y="83" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="end">100M</text>
                                <text x="32" y="133" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="end">50M</text>
                                <text x="32" y="183" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="end">0</text>

                                {/* Legend */}
                                <g transform="translate(320, 10)">
                                    <rect x="0" y="0" width="12" height="12" rx="3" fill="#10B981" />
                                    <text x="18" y="10" fontSize="10" fontWeight="bold" fill="#64748b">Inflow</text>
                                    <rect x="70" y="0" width="12" height="12" rx="3" fill="#FB7185" />
                                    <text x="88" y="10" fontSize="10" fontWeight="bold" fill="#64748b">Outflow</text>
                                </g>

                                {/* Dynamic Data Bars */}
                                {chartData.map((data: ChartBar, index: number) => {
                                    const xOffset = 60 + index * 80;
                                    const inflowY = 180 - data.inflow.h;
                                    const outflowY = 180 - data.outflow.h;
                                    return (
                                        <g key={data.month}>
                                            {/* Inflow Bar */}
                                            <rect x={xOffset} y={inflowY} width="16" height={data.inflow.h} rx="4" fill="#10B981" />
                                            <text x={xOffset + 8} y={inflowY - 5} fontSize="8" fontWeight="bold" fill="#047857" textAnchor="middle">
                                                {data.inflow.val}
                                            </text>

                                            {/* Outflow Bar */}
                                            <rect x={xOffset + 20} y={outflowY} width="16" height={data.outflow.h} rx="4" fill="#FB7185" />
                                            <text x={xOffset + 28} y={outflowY - 5} fontSize="8" fontWeight="bold" fill="#BE123C" textAnchor="middle">
                                                {data.outflow.val}
                                            </text>

                                            {/* Month Name */}
                                            <text x={xOffset + 18} y="198" fontSize="10" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                                                {data.month}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Fiscal Ratio status */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs space-y-5 flex flex-col justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Status PPN Terpisah</h2>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Rasio Alokasi PPN dan Pajak</p>
                        </div>

                        {fiscalMode === 'ppn' ? (
                            <div className="space-y-4 flex-1 flex flex-col justify-center">
                                {/* PPN Keluaran Ratio */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            PPN Keluaran
                                        </span>
                                        <span className="font-mono font-bold text-slate-800">
                                            {metrics.ppnKeluaranNominal} <span className="text-[10px] text-slate-400 font-normal font-sans">({metrics.ppnKeluaranPercent})</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: metrics.ppnKeluaranPercent }}></div>
                                    </div>
                                </div>

                                {/* PPN Masukan Ratio */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            PPN Masukan
                                        </span>
                                        <span className="font-mono font-bold text-slate-800">
                                            {metrics.ppnMasukanNominal} <span className="text-[10px] text-slate-400 font-normal font-sans">({metrics.ppnMasukanPercent})</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: metrics.ppnMasukanPercent }}></div>
                                    </div>
                                </div>

                                {/* PPN Bersih Terhutang Box */}
                                <div className="mt-1 p-3 bg-amber-50/50 border border-amber-100/60 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">PPN Kurang Bayar</span>
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded-sm">Pelaporan</span>
                                    </div>
                                    <div className="text-base font-extrabold text-amber-700 font-mono">
                                        {metrics.taxOrDebt}
                                    </div>
                                    <p className="text-[9.5px] text-amber-600 font-medium leading-normal">
                                        Selisih nominal yang wajib disetor ke Kas Negara.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rasio PPN Dinonaktifkan</span>
                                <span className="text-[11px] text-slate-400 px-4">Ubah sidebar ke Mode PPN untuk melihat rasio alokasi pajak.</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase">
                            <span>Status Fiskal:</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                                fiscalMode === 'ppn' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {fiscalMode}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section: Hutang & Piutang Jatuh Tempo 1 Minggu */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Widget Piutang Jatuh Tempo (Akan Diterima) */}
                    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Piutang Jatuh Tempo ≤ 7 Hari</h2>
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            {getUpcomingReceivables().filter(r => r.status === 'unpaid').length} Antrean
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Penagihan Client Mendatang (Inflow)</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/10">
                                            <th className="px-4 py-3">No. Invoice / Client</th>
                                            <th className="px-4 py-3">Deskripsi Proyek</th>
                                            <th className="px-4 py-3">Jatuh Tempo</th>
                                            <th className="px-4 py-3 text-right">Nominal</th>
                                            <th className="px-4 py-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                        {getUpcomingReceivables().map((rec) => {
                                            const isPaid = rec.status === 'paid';
                                            const currentSimulatedDate = new Date(`${selectedYear}-${selectedMonth}-27`);
                                            const dueDate = new Date(rec.dueDate);
                                            const diffTime = dueDate.getTime() - currentSimulatedDate.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            return (
                                                <tr key={rec.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-mono font-bold text-slate-900 text-[11px]">{rec.actualId}</div>
                                                        <div className="font-bold text-slate-800 text-[10px] mt-0.5">{rec.client}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-semibold text-slate-500 max-w-[130px] truncate">{rec.project}</div>
                                                        <div className="text-[9px] text-slate-400 font-normal italic mt-0.5">{rec.notes}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <div className="font-semibold text-slate-700 text-[11px]">{formatDateIndo(rec.dueDate)}</div>
                                                        {!isPaid && (
                                                            <div className="text-[9px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                                                {diffDays} Hari Lagi
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        {formatRupiah(rec.actualAmount)}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                                        {isPaid ? (
                                                            <span className="text-[10px] font-bold text-emerald-600">Diterima</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleReceivePayment(rec.id, rec.actualAmount, rec.client)}
                                                                className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all"
                                                            >
                                                                Catat Terima
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Widget Hutang Jatuh Tempo (Akan Dibayar) */}
                    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Hutang Jatuh Tempo ≤ 7 Hari</h2>
                                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            {getUpcomingDebts().filter(d => d.status === 'unpaid').length} Antrean
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Kewajiban Pembayaran Vendor (Outflow)</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/10">
                                            <th className="px-4 py-3">No. PO / Vendor</th>
                                            <th className="px-4 py-3">Deskripsi Proyek</th>
                                            <th className="px-4 py-3">Jatuh Tempo</th>
                                            <th className="px-4 py-3 text-right">Nominal</th>
                                            <th className="px-4 py-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                        {getUpcomingDebts().map((debt) => {
                                            const isPaid = debt.status === 'paid';
                                            const currentSimulatedDate = new Date(`${selectedYear}-${selectedMonth}-27`);
                                            const dueDate = new Date(debt.dueDate);
                                            const diffTime = dueDate.getTime() - currentSimulatedDate.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            return (
                                                <tr key={debt.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-mono font-bold text-slate-900 text-[11px]">{debt.actualId}</div>
                                                        <div className="font-bold text-slate-800 text-[10px] mt-0.5">{debt.vendor}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-semibold text-slate-500 max-w-[130px] truncate">{debt.project}</div>
                                                        <div className="text-[9px] text-slate-400 font-normal italic mt-0.5">{debt.notes}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <div className="font-semibold text-slate-700 text-[11px]">{formatDateIndo(debt.dueDate)}</div>
                                                        {!isPaid && (
                                                            <div className="text-[9px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                                                {diffDays} Hari Lagi
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        {formatRupiah(debt.actualAmount)}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                                        {isPaid ? (
                                                            <span className="text-[10px] font-bold text-slate-400">Terbayar</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePayDebt(debt.id, debt.actualAmount, debt.vendor)}
                                                                className="px-2 py-1 rounded-lg text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all"
                                                            >
                                                                Catat Bayar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Recent Transactions List */}
                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Transaksi Terakhir</h2>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Daftar Jurnal Pembelian & Penjualan Terbaru</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">Lihat Semua</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Dokumen</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4">Client/Vendor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 whitespace-nowrap">{tx.date}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">{tx.doc}</td>
                                        <td className="px-6 py-4 text-slate-800 font-semibold">{tx.desc}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-600">{tx.client}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={tx.status as any} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{tx.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DemoLayout>
    );
}
