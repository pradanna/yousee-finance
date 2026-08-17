import { CoaSelectInput } from '@/Features/Accounting/Components/CoaSelectInput';
import { AccountingSetting, ChartOfAccount } from '@/Features/Accounting/types';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';

import {
    mockAccountingSettings,
    mockLeafAccounts,
} from '@/Features/Accounting/mockData';

interface Props {
    settings?: AccountingSetting[];
    leafAccounts?: ChartOfAccount[];
}

const SETTING_LABELS: Record<
    string,
    { label: string; description: string; ppnOnly?: boolean }
> = {
    default_cash: {
        label: 'Kas Tunai Default',
        description:
            'Akun kas tunai operasional untuk penerimaan/pengeluaran kas.',
    },
    default_bank: {
        label: 'Bank Operasional Default',
        description: 'Akun bank utama (misal BCA) untuk transaksi transfer.',
    },
    default_receivable: {
        label: 'Piutang Dagang Client Default',
        description: 'Akun yang didebet saat Invoice diterbitkan ke Client.',
    },
    default_payable: {
        label: 'Hutang Dagang Vendor Default',
        description: 'Akun yang dikredit saat Purchase Order (PO) dibuat.',
    },
    default_sales_revenue: {
        label: 'Pendapatan Sewa Reklame Default',
        description: 'Akun pendapatan yang dikredit saat Invoice diterbitkan.',
    },
    default_project_expense: {
        label: 'Beban HPP Billboard Default',
        description: 'Akun beban sewa vendor yang didebet saat PO diterbitkan.',
    },
    default_vat_input: {
        label: 'PPN Masukan Default (11%)',
        description: 'Akun PPN Masukan saat PO diterbitkan pada Mode PPN.',
        ppnOnly: true,
    },
    default_vat_output: {
        label: 'PPN Keluaran Default (11%)',
        description:
            'Akun PPN Keluaran saat Invoice diterbitkan pada Mode PPN.',
        ppnOnly: true,
    },
    default_income_tax: {
        label: 'Hutang PPh Pemotongan Default',
        description:
            'Akun yang dikredit untuk pencatatan pemotongan pajak PPh.',
    },
    opening_balance_equity: {
        label: 'Opening Balance Equity',
        description: 'Akun modal penyeimbang untuk setup saldo awal migrasi.',
    },
};

export default function AccountingSettingsIndex({
    settings = mockAccountingSettings,
    leafAccounts = mockLeafAccounts,
}: Props) {
    const form = useForm<{
        settings: { key: string; chart_of_account_id: string | null }[];
    }>({
        settings: settings.map((s) => ({
            key: s.key,
            chart_of_account_id: s.chart_of_account_id
                ? String(s.chart_of_account_id)
                : null,
        })),
    });

    const handleAccountChange = (key: string, id: string | number | null) => {
        form.setData(
            'settings',
            form.data.settings.map((s) =>
                s.key === key
                    ? {
                          ...s,
                          chart_of_account_id: id !== null ? String(id) : null,
                      }
                    : s,
            ),
        );
    };

    const getAccountId = (key: string) =>
        form.data.settings.find((s) => s.key === key)?.chart_of_account_id ??
        null;

    const handleSubmit = () => {
        form.put(route('accounting.settings.update'));
    };

    return (
        <AppLayout
            title="Pengaturan Akuntansi"
            activePage="accounting-settings"
            breadcrumbs={[{ label: 'Akuntansi' }, { label: 'Pengaturan Akun' }]}
        >
            <div className="w-full max-w-3xl space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Pengaturan Akuntansi Global
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Tentukan akun COA default yang digunakan sistem secara
                        otomatis saat membentuk jurnal.
                    </p>
                </div>

                {/* Settings Card */}
                <div className="shadow-xs divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
                    {settings.map((setting) => {
                        const meta = SETTING_LABELS[setting.key];
                        if (!meta) return null;

                        return (
                            <div key={setting.key} className="px-6 py-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800">
                                                {meta.label}
                                            </span>
                                            {meta.ppnOnly && (
                                                <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold leading-none text-indigo-700">
                                                    PPN Mode Only
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {meta.description}
                                        </p>
                                    </div>
                                    <div className="w-full flex-shrink-0 sm:w-72">
                                        <CoaSelectInput
                                            value={getAccountId(setting.key)}
                                            onChange={(id) =>
                                                handleAccountChange(
                                                    setting.key,
                                                    id,
                                                )
                                            }
                                            options={leafAccounts}
                                            placeholder="Pilih akun COA..."
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                    </svg>
                    <p className="text-xs text-blue-700">
                        Perubahan pengaturan ini hanya berlaku untuk transaksi{' '}
                        <strong>baru</strong>. Jurnal yang sudah terbentuk pada
                        periode yang sudah di-closing tidak akan berubah.
                    </p>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={form.processing}
                        className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800 disabled:opacity-60"
                    >
                        {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
