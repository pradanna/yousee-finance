import { BankAccountBalance, fmt } from '../cashflowTypes';

interface CashflowBankAccountsTabProps {
    bankAccounts: BankAccountBalance[];
    totalEndingBalance: number;
}

export default function CashflowBankAccountsTab({
    bankAccounts,
    totalEndingBalance,
}: CashflowBankAccountsTabProps) {
    const getBankTheme = (code: string) => {
        switch (code) {
            case '1112': // BCA
                return {
                    bg: 'bg-blue-500',
                    border: 'border-blue-200',
                    lightBg: 'bg-blue-50/60',
                    text: 'text-blue-700',
                    badge: 'BCA',
                };
            case '1113': // Mandiri
                return {
                    bg: 'bg-amber-500',
                    border: 'border-amber-200',
                    lightBg: 'bg-amber-50/60',
                    text: 'text-amber-700',
                    badge: 'Mandiri',
                };
            case '1114': // BRI
                return {
                    bg: 'bg-cyan-500',
                    border: 'border-cyan-200',
                    lightBg: 'bg-cyan-50/60',
                    text: 'text-cyan-700',
                    badge: 'BRI',
                };
            default: // Kas Kecil
                return {
                    bg: 'bg-emerald-500',
                    border: 'border-emerald-200',
                    lightBg: 'bg-emerald-50/60',
                    text: 'text-emerald-700',
                    badge: 'Kas Tunai',
                };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Rekapitulasi Saldo & Likuiditas Kas & Bank
                    </h3>
                    <p className="text-xs text-slate-500">
                        Monitoring saldo real-time setiap rekening bank
                        operasional dan kas kecil YouSee Indonesia.
                    </p>
                </div>
            </div>

            {/* Grid Bank Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {bankAccounts.map((acc) => {
                    const theme = getBankTheme(acc.code);
                    const percentage =
                        totalEndingBalance > 0
                            ? Math.max(
                                  0,
                                  Math.round(
                                      (acc.currentBalance /
                                          totalEndingBalance) *
                                          100,
                                  ),
                              )
                            : 0;

                    return (
                        <div
                            key={acc.id}
                            className={`group relative overflow-hidden rounded-2xl border ${theme.border} shadow-xs bg-white p-5 transition-all duration-300 hover:shadow-md`}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                                <span
                                    className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${theme.lightBg} ${theme.text}`}
                                >
                                    {theme.badge} • {acc.code}
                                </span>
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.bg} shadow-xs text-xs font-black text-white`}
                                >
                                    {acc.code.slice(-1)}
                                </div>
                            </div>

                            {/* Bank Name & Number */}
                            <div className="mt-3">
                                <h4 className="truncate text-sm font-bold text-slate-900">
                                    {acc.bankName}
                                </h4>
                                <div className="mt-0.5 font-mono text-[11px] font-semibold text-slate-500">
                                    {acc.accountNumber}
                                </div>
                            </div>

                            {/* Balance Info */}
                            <div className="mt-4 border-t border-slate-100 pt-3">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Saldo Saat Ini
                                </span>
                                <div className="mt-0.5 text-lg font-black text-slate-900">
                                    {fmt(acc.currentBalance)}
                                </div>
                            </div>

                            {/* Breakdown Mutasi */}
                            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-[10px]">
                                <div>
                                    <span className="block font-medium text-slate-400">
                                        Total Masuk
                                    </span>
                                    <span className="font-bold text-emerald-600">
                                        +{fmt(acc.inflowTotal)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-medium text-slate-400">
                                        Total Keluar
                                    </span>
                                    <span className="font-bold text-rose-600">
                                        -{fmt(acc.outflowTotal)}
                                    </span>
                                </div>
                            </div>

                            {/* Liquidity Progress Bar */}
                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                    <span>Porsi Likuiditas</span>
                                    <span>{percentage}%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full ${theme.bg} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>

                            <div
                                className={`absolute inset-x-0 bottom-0 h-1 ${theme.bg}`}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Summary Table */}
            <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Tabel Rekonsiliasi Saldo per Rekening Kas & Bank
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-6 py-3.5">
                                    Kode & Nama Akun
                                </th>
                                <th className="px-6 py-3.5">Nomor Rekening</th>
                                <th className="px-6 py-3.5 text-right">
                                    Saldo Awal
                                </th>
                                <th className="px-6 py-3.5 text-right">
                                    Total Masuk (In)
                                </th>
                                <th className="px-6 py-3.5 text-right">
                                    Total Keluar (Out)
                                </th>
                                <th className="px-6 py-3.5 text-right">
                                    Saldo Akhir
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {bankAccounts.map((acc) => (
                                <tr
                                    key={acc.id}
                                    className="transition-colors hover:bg-slate-50/80"
                                >
                                    <td className="px-6 py-3.5">
                                        <span className="font-bold text-slate-900">
                                            {acc.code}
                                        </span>{' '}
                                        - {acc.bankName}
                                    </td>
                                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                                        {acc.accountNumber}
                                    </td>
                                    <td className="px-6 py-3.5 text-right text-slate-700">
                                        {fmt(acc.beginningBalance)}
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-bold text-emerald-600">
                                        +{fmt(acc.inflowTotal)}
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-bold text-rose-600">
                                        -{fmt(acc.outflowTotal)}
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-black text-slate-900">
                                        {fmt(acc.currentBalance)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-slate-900 bg-slate-100/90 font-black text-slate-900">
                                <td
                                    colSpan={2}
                                    className="px-6 py-3.5 uppercase"
                                >
                                    Total Posisi Kas & Bank Konsolidasi
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                    {fmt(
                                        bankAccounts.reduce(
                                            (s, a) => s + a.beginningBalance,
                                            0,
                                        ),
                                    )}
                                </td>
                                <td className="px-6 py-3.5 text-right text-emerald-700">
                                    +
                                    {fmt(
                                        bankAccounts.reduce(
                                            (s, a) => s + a.inflowTotal,
                                            0,
                                        ),
                                    )}
                                </td>
                                <td className="px-6 py-3.5 text-right text-rose-700">
                                    -
                                    {fmt(
                                        bankAccounts.reduce(
                                            (s, a) => s + a.outflowTotal,
                                            0,
                                        ),
                                    )}
                                </td>
                                <td className="px-6 py-3.5 text-right text-sm">
                                    {fmt(totalEndingBalance)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
