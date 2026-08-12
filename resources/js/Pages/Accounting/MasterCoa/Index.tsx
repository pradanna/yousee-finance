import { CoaTreeNode } from '@/Features/Accounting/Components/CoaTreeNode';
import {
    ChartOfAccount,
    CreateChartOfAccountForm,
    EnumOption,
    UpdateChartOfAccountForm,
} from '@/Features/Accounting/types';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

import { mockCoaTree, mockLeafAccounts } from '@/Features/Accounting/mockData';

interface Props {
    accounts?: ChartOfAccount[];
    leafAccounts?: ChartOfAccount[];
    accountTypes?: EnumOption[];
    normalBalances?: EnumOption[];
    fiscalModeContexts?: EnumOption[];
}

const TYPE_PREFIX: Record<string, string> = {
    asset: '1 - Aset',
    liability: '2 - Kewajiban',
    equity: '3 - Ekuitas',
    revenue: '4 - Pendapatan',
    expense: '5 - Beban',
};

const defaultTypes: EnumOption[] = [
    { value: 'asset', label: '1 - Aset' },
    { value: 'liability', label: '2 - Kewajiban' },
    { value: 'equity', label: '3 - Ekuitas' },
    { value: 'revenue', label: '4 - Pendapatan' },
    { value: 'expense', label: '5 - Beban' },
];

const defaultBalances: EnumOption[] = [
    { value: 'debit', label: 'Debet' },
    { value: 'credit', label: 'Kredit' },
];

const defaultContexts: EnumOption[] = [
    { value: 'all', label: 'Semua Mode' },
    { value: 'ppn_only', label: 'Hanya Mode PPN' },
    { value: 'non_ppn_only', label: 'Hanya Mode Non-PPN' },
];

type ModalMode =
    | { type: 'create'; parent: ChartOfAccount | null }
    | { type: 'edit'; account: ChartOfAccount }
    | null;

export default function MasterCoaIndex({
    accounts = mockCoaTree,
    leafAccounts = mockLeafAccounts,
    accountTypes = defaultTypes,
    normalBalances = defaultBalances,
    fiscalModeContexts = defaultContexts,
}: Props) {
    const [modal, setModal] = useState<ModalMode>(null);
    const [search, setSearch] = useState('');

    // ─── Create Form ──────────────────────────────────────────────────────────
    const createForm = useForm<CreateChartOfAccountForm>({
        parent_id: null,
        code: '',
        name: '',
        type: '',
        normal_balance: '',
        fiscal_mode_context: 'all',
    });

    // ─── Edit Form ────────────────────────────────────────────────────────────
    const editForm = useForm<UpdateChartOfAccountForm>({
        code: '',
        name: '',
        fiscal_mode_context: 'all',
    });

    // ─── Deactivate Form ──────────────────────────────────────────────────────
    const deactivateForm = useForm({});

    const openCreate = (parent: ChartOfAccount | null) => {
        createForm.reset();
        createForm.setData({
            parent_id: parent?.id ?? null,
            code: parent ? `${parent.code.slice(0, -2)}` : '',
            name: '',
            type: parent?.type ?? '',
            normal_balance: parent?.normal_balance ?? '',
            fiscal_mode_context: 'all',
        });
        setModal({ type: 'create', parent });
    };

    const openEdit = (account: ChartOfAccount) => {
        editForm.setData({
            code: account.code,
            name: account.name,
            fiscal_mode_context: account.fiscal_mode_context,
        });
        setModal({ type: 'edit', account });
    };

    const handleCreate = () => {
        createForm.post(route('accounting.coa.store'), {
            onSuccess: () => setModal(null),
        });
    };

    const handleUpdate = () => {
        if (modal?.type !== 'edit') return;
        editForm.put(route('accounting.coa.update', modal.account.id), {
            onSuccess: () => setModal(null),
        });
    };

    const handleDeactivate = (account: ChartOfAccount) => {
        if (
            !confirm(
                `Nonaktifkan akun [${account.code} - ${account.name}]? Akun yang sudah dinonaktifkan tidak dapat digunakan dalam jurnal.`,
            )
        )
            return;
        deactivateForm.delete(route('accounting.coa.destroy', account.id));
    };

    // ─── Filter root accounts by search ───────────────────────────────────────
    const filterTree = (
        nodes: ChartOfAccount[],
        q: string,
    ): ChartOfAccount[] => {
        if (!q) return nodes;
        return nodes.reduce<ChartOfAccount[]>((acc, node) => {
            const match = `${node.code} ${node.name}`
                .toLowerCase()
                .includes(q.toLowerCase());
            const filteredChildren = filterTree(node.children ?? [], q);
            if (match || filteredChildren.length > 0) {
                acc.push({ ...node, children: filteredChildren });
            }
            return acc;
        }, []);
    };

    const visibleAccounts = filterTree(accounts, search);

    return (
        <AppLayout
            title="Master COA"
            activePage="coa"
            breadcrumbs={[{ label: 'Akuntansi' }, { label: 'Master COA' }]}
        >
            <div className="w-full space-y-6 p-6">
                {/* ─── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Master Chart of Accounts
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Kelola struktur akun keuangan perusahaan
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode atau nama akun..."
                                className="focus:ring-primary/20 focus:border-primary/30 w-64 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-800 transition-all focus:outline-none focus:ring-2"
                            />
                            <svg
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                />
                            </svg>
                        </div>
                        <button
                            type="button"
                            onClick={() => openCreate(null)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800"
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
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            Tambah Akun Root
                        </button>
                    </div>
                </div>

                {/* ─── Legend ─────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tipe Akun:
                    </span>
                    {accountTypes.map((t) => (
                        <span
                            key={t.value}
                            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-bold leading-none transition-all ${t.value === 'asset' ? 'border-blue-200/80 bg-blue-50/80 text-blue-700 hover:bg-blue-100/80' : ''} ${t.value === 'liability' ? 'border-rose-200/80 bg-rose-50/80 text-rose-700 hover:bg-rose-100/80' : ''} ${t.value === 'equity' ? 'border-violet-200/80 bg-violet-50/80 text-violet-700 hover:bg-violet-100/80' : ''} ${t.value === 'revenue' ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/80' : ''} ${t.value === 'expense' ? 'border-amber-200/80 bg-amber-50/80 text-amber-700 hover:bg-amber-100/80' : ''} `}
                        >
                            {TYPE_PREFIX[t.value] ?? t.label}
                        </span>
                    ))}
                </div>

                {/* ─── COA Tree ────────────────────────────────────────────── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                            {/* Column headers */}
                            <div
                                className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/40 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                                style={{ paddingLeft: '1rem' }}
                            >
                                <span className="w-5 flex-shrink-0" />
                                <span className="w-1.5 flex-shrink-0" />
                                <span className="w-16 flex-shrink-0">Kode</span>
                                <span className="flex-1">Nama Akun</span>
                                <span className="hidden w-64 flex-shrink-0 pr-2 text-right sm:block">
                                    Tipe &amp; Saldo Normal
                                </span>
                                <span className="w-12 flex-shrink-0 text-center">
                                    Aksi
                                </span>
                            </div>

                            {/* Tree rows */}
                            {visibleAccounts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <svg
                                        className="mb-3 h-10 w-10 text-slate-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
                                        />
                                    </svg>
                                    <span className="text-sm font-medium">
                                        Belum ada akun COA
                                    </span>
                                    <span className="mt-1 text-xs">
                                        Tambah akun root untuk memulai
                                    </span>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {visibleAccounts.map((account) => (
                                        <CoaTreeNode
                                            key={account.id}
                                            account={account}
                                            onEdit={openEdit}
                                            onDeactivate={handleDeactivate}
                                            onAddChild={openCreate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Info bar ────────────────────────────────────────────── */}
                <p className="text-center text-xs text-slate-400">
                    Klik tombol titik tiga (⋮) pada baris akun untuk melihat opsi aksi. Akun induk (Header) tidak dapat digunakan langsung dalam jurnal.
                </p>
            </div>

            {/* ─── Create Modal ─────────────────────────────────────────────── */}
            {modal?.type === 'create' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Tambah Akun COA
                                </h2>
                                {modal.parent && (
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Induk:{' '}
                                        <span className="font-mono font-bold">
                                            {modal.parent.code}
                                        </span>{' '}
                                        — {modal.parent.name}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
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
                                        d="M6 18 18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Kode */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                        Kode Akun *
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.data.code}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'code',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="contoh: 1110"
                                        className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm transition-all focus:outline-none focus:ring-2"
                                    />
                                    {createForm.errors.code && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {createForm.errors.code}
                                        </p>
                                    )}
                                </div>

                                {/* Fiscal Mode Context */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                        Konteks Fiskal *
                                    </label>
                                    <select
                                        value={
                                            createForm.data.fiscal_mode_context
                                        }
                                        onChange={(e) =>
                                            createForm.setData(
                                                'fiscal_mode_context',
                                                e.target.value as
                                                    | 'all'
                                                    | 'ppn_only'
                                                    | 'non_ppn_only',
                                            )
                                        }
                                        className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                                    >
                                        {fiscalModeContexts.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Nama */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                    Nama Akun *
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="contoh: Kas Tunai"
                                    className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                                />
                                {createForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {createForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Tipe */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                        Tipe Akun *
                                    </label>
                                    <select
                                        value={createForm.data.type}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'type',
                                                e.target
                                                    .value as CreateChartOfAccountForm['type'],
                                            )
                                        }
                                        className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                                        disabled={!!modal.parent}
                                    >
                                        <option value="">Pilih tipe...</option>
                                        {accountTypes.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {TYPE_PREFIX[o.value] ?? o.label}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.type && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {createForm.errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Saldo Normal */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                        Saldo Normal *
                                    </label>
                                    <select
                                        value={createForm.data.normal_balance}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'normal_balance',
                                                e.target
                                                    .value as CreateChartOfAccountForm['normal_balance'],
                                            )
                                        }
                                        className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                                        disabled={!!modal.parent}
                                    >
                                        <option value="">
                                            Pilih saldo normal...
                                        </option>
                                        {normalBalances.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.normal_balance && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {createForm.errors.normal_balance}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {modal.parent && (
                                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-400">
                                    Tipe dan Saldo Normal diwarisi dari akun
                                    induk dan tidak dapat diubah.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={createForm.processing}
                                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                            >
                                {createForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Akun'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Edit Modal ───────────────────────────────────────────────── */}
            {modal?.type === 'edit' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h2 className="text-base font-bold text-slate-900">
                                Edit Akun COA
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
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
                                        d="M6 18 18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                        Kode Akun *
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.code}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'code',
                                                e.target.value,
                                            )
                                        }
                                        className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm transition-all focus:outline-none focus:ring-2"
                                    />
                                    {editForm.errors.code && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {editForm.errors.code}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                        Konteks Fiskal *
                                    </label>
                                    <select
                                        value={
                                            editForm.data.fiscal_mode_context
                                        }
                                        onChange={(e) =>
                                            editForm.setData(
                                                'fiscal_mode_context',
                                                e.target.value as
                                                    | 'all'
                                                    | 'ppn_only'
                                                    | 'non_ppn_only',
                                            )
                                        }
                                        className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                                    >
                                        {fiscalModeContexts.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700">
                                    Nama Akun *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    className="focus:ring-primary/20 focus:border-primary/30 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-400">
                                Tipe akun dan saldo normal bersifat permanen dan
                                tidak dapat diubah setelah akun dibuat.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={editForm.processing}
                                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                            >
                                {editForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
