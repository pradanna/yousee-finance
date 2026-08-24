import { useState } from 'react';
import { fmt, PsakCashflowSummary } from '../cashflowTypes';

interface CashflowPsakTabProps {
    psak: PsakCashflowSummary;
    periodLabel: string;
}

export default function CashflowPsakTab({
    psak,
    periodLabel,
}: CashflowPsakTabProps) {
    const [method, setMethod] = useState<'direct' | 'indirect'>('direct');

    return (
        <div className="space-y-6">
            {/* Method Toggle & Header */}
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Laporan Arus Kas Formal Terstruktur (PSAK 2)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Periode: <strong>{periodLabel}</strong> • Standar
                        Akuntansi Keuangan Indonesia
                    </p>
                </div>

                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <button
                        onClick={() => setMethod('direct')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            method === 'direct'
                                ? 'shadow-xs bg-white text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Metode Langsung (Direct)
                    </button>
                    <button
                        onClick={() => setMethod('indirect')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            method === 'indirect'
                                ? 'shadow-xs bg-white text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Metode Rekonsiliasi (Indirect)
                    </button>
                </div>
            </div>

            {/* Formal PSAK Table Statement */}
            <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                    <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            PT. YouSee Indonesia
                        </span>
                        <h4 className="text-base font-black text-slate-900">
                            LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS)
                        </h4>
                        <span className="text-xs font-semibold text-slate-600">
                            Untuk Periode yang Berakhir pada {periodLabel}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="pb-3">
                                    Arus Kas dari Aktivitas
                                </th>
                                <th className="pb-3 text-right">
                                    Jumlah Nominal (IDR)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {/* 1. AKTIVITAS OPERASI */}
                            <tr className="bg-slate-50/50 font-bold text-slate-900">
                                <td colSpan={2} className="py-2.5">
                                    1. ARUS KAS DARI AKTIVITAS OPERASI
                                </td>
                            </tr>
                            {method === 'direct' ? (
                                <>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Penerimaan kas dari pelanggan
                                            (Pelunasan Piutang Invoice)
                                        </td>
                                        <td className="py-2 text-right font-semibold text-slate-800">
                                            {fmt(psak.operatingClientIn)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Penerimaan operasional lainnya &
                                            bunga bank
                                        </td>
                                        <td className="py-2 text-right font-semibold text-slate-800">
                                            {fmt(psak.operatingOtherIn)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Pembayaran kas kepada pemasok /
                                            vendor (Pelunasan PO)
                                        </td>
                                        <td className="py-2 text-right font-semibold text-rose-600">
                                            ({fmt(psak.operatingVendorOut)})
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Pembayaran beban operasional
                                            langsung & kantor
                                        </td>
                                        <td className="py-2 text-right font-semibold text-rose-600">
                                            (
                                            {fmt(
                                                psak.operatingDirectExpenseOut,
                                            )}
                                            )
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Penyetoran pajak ke Kas Negara (PPN
                                            / PPh / NTPN)
                                        </td>
                                        <td className="py-2 text-right font-semibold text-rose-600">
                                            ({fmt(psak.operatingTaxOut)})
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Laba Operasional Bersih Sebelum
                                            Pajak
                                        </td>
                                        <td className="py-2 text-right font-semibold text-slate-800">
                                            {fmt(
                                                psak.netOperating +
                                                    psak.operatingTaxOut,
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">
                                            Penyesuaian: Pajak Penghasilan &
                                            Setoran Pajak Riil
                                        </td>
                                        <td className="py-2 text-right font-semibold text-rose-600">
                                            ({fmt(psak.operatingTaxOut)})
                                        </td>
                                    </tr>
                                </>
                            )}
                            <tr className="bg-blue-50/30 font-bold">
                                <td className="py-2.5 pl-6 text-blue-900">
                                    Arus Kas Bersih yang Diperoleh dari
                                    Aktivitas Operasi
                                </td>
                                <td
                                    className={`py-2.5 text-right font-black ${
                                        psak.netOperating >= 0
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                    }`}
                                >
                                    {fmt(psak.netOperating)}
                                </td>
                            </tr>

                            {/* 2. AKTIVITAS INVESTASI */}
                            <tr className="bg-slate-50/50 font-bold text-slate-900">
                                <td colSpan={2} className="py-2.5 pt-4">
                                    2. ARUS KAS DARI AKTIVITAS INVESTASI
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 pl-4">
                                    Hasil penjualan peralatan / aset tetap
                                </td>
                                <td className="py-2 text-right font-semibold text-slate-800">
                                    {fmt(psak.investingAssetIn)}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 pl-4">
                                    Pembelian aset tetap / belanja konstruksi
                                    billboard baru
                                </td>
                                <td className="py-2 text-right font-semibold text-rose-600">
                                    ({fmt(psak.investingAssetOut)})
                                </td>
                            </tr>
                            <tr className="bg-purple-50/30 font-bold">
                                <td className="py-2.5 pl-6 text-purple-900">
                                    Arus Kas Bersih yang Digunakan untuk
                                    Aktivitas Investasi
                                </td>
                                <td
                                    className={`py-2.5 text-right font-black ${
                                        psak.netInvesting >= 0
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                    }`}
                                >
                                    {fmt(psak.netInvesting)}
                                </td>
                            </tr>

                            {/* 3. AKTIVITAS PENDANAAN */}
                            <tr className="bg-slate-50/50 font-bold text-slate-900">
                                <td colSpan={2} className="py-2.5 pt-4">
                                    3. ARUS KAS DARI AKTIVITAS PENDANAAN
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 pl-4">
                                    Penerimaan dari setoran modal pemilik /
                                    investor
                                </td>
                                <td className="py-2 text-right font-semibold text-slate-800">
                                    {fmt(psak.financingCapitalIn)}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 pl-4">
                                    Pembayaran penarikan modal / prive / dividen
                                </td>
                                <td className="py-2 text-right font-semibold text-rose-600">
                                    ({fmt(psak.financingPriveOut)})
                                </td>
                            </tr>
                            <tr className="bg-emerald-50/30 font-bold">
                                <td className="py-2.5 pl-6 text-emerald-900">
                                    Arus Kas Bersih yang Diperoleh dari
                                    Aktivitas Pendanaan
                                </td>
                                <td
                                    className={`py-2.5 text-right font-black ${
                                        psak.netFinancing >= 0
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                    }`}
                                >
                                    {fmt(psak.netFinancing)}
                                </td>
                            </tr>

                            {/* GRAND TOTAL SUMMARY */}
                            <tr className="border-t-2 border-slate-900 bg-slate-100/80 font-black text-slate-900">
                                <td className="py-3 uppercase">
                                    Kenaikan / (Penurunan) Bersih Kas dan Setara
                                    Kas
                                </td>
                                <td
                                    className={`py-3 text-right text-sm ${
                                        psak.netCashMovement >= 0
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                    }`}
                                >
                                    {fmt(psak.netCashMovement)}
                                </td>
                            </tr>
                            <tr className="font-bold text-slate-700">
                                <td className="py-2.5 pl-4">
                                    Saldo Kas dan Setara Kas pada Awal Periode
                                </td>
                                <td className="py-2.5 text-right">
                                    {fmt(psak.beginningBalance)}
                                </td>
                            </tr>
                            <tr className="border-b-2 border-t border-slate-900 bg-slate-900 font-black text-white">
                                <td className="py-3 pl-4 uppercase">
                                    Saldo Kas dan Setara Kas pada Akhir Periode
                                </td>
                                <td className="py-3 text-right text-sm">
                                    {fmt(psak.endingBalance)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
