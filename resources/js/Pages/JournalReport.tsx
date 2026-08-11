import React, { useState, useMemo } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import SelectInput from '@/Components/Form/SelectInput';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
type JournalCategory = 'sales' | 'cash_in' | 'purchase' | 'cash_out' | 'adjustment';
type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface AccountCOA {
    code: string;
    name: string;
    category: AccountCategory;
    normalBalance: 'debit' | 'credit';
    isSystemDefault?: boolean;
    isActive: boolean;
}

interface JournalLine {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    memo?: string;
}

interface JournalEntryData {
    id: string;
    date: string;
    docNo: string;
    refNo?: string;
    category: JournalCategory;
    description: string;
    postedBy: string;
    lines: JournalLine[];
    isReversed?: boolean;
}

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

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

const ITEMS_PER_PAGE = 10;

// Default Master Chart of Accounts (COA)
const DEFAULT_COA_LIST: AccountCOA[] = [
    { code: '1110', name: 'Kas Tunai / Operasional', category: 'asset', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '1111', name: 'Bank Mandiri Solo Baru (138-00-2010633-7)', category: 'asset', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '1112', name: 'Bank BCA Operasional Utama', category: 'asset', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '1113', name: 'Bank BRI Giro Usaha', category: 'asset', normalBalance: 'debit', isActive: true, isSystemDefault: false },
    { code: '1120', name: 'Piutang Dagang Client', category: 'asset', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '1140', name: 'PPN Masukan (11%)', category: 'asset', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '2110', name: 'Hutang Dagang Vendor Billboard', category: 'liability', normalBalance: 'credit', isActive: true, isSystemDefault: true },
    { code: '2130', name: 'Hutang PPN Keluaran (11%)', category: 'liability', normalBalance: 'credit', isActive: true, isSystemDefault: true },
    { code: '2140', name: 'Hutang PPh Pasal 23 / PPh 4(2)', category: 'liability', normalBalance: 'credit', isActive: true, isSystemDefault: false },
    { code: '3100', name: 'Modal Disetor Pemilik', category: 'equity', normalBalance: 'credit', isActive: true, isSystemDefault: true },
    { code: '3200', name: 'Laba Ditahan (Retained Earnings)', category: 'equity', normalBalance: 'credit', isActive: true, isSystemDefault: true },
    { code: '4110', name: 'Pendapatan Sewa Media Iklan (Billboard/Videotron)', category: 'revenue', normalBalance: 'credit', isActive: true, isSystemDefault: true },
    { code: '4120', name: 'Pendapatan Produksi & Cetak Banner', category: 'revenue', normalBalance: 'credit', isActive: true, isSystemDefault: false },
    { code: '5110', name: 'Beban HPP Sewa Billboard Vendor', category: 'expense', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '5120', name: 'Beban HPP Produksi, Cetak & Pemasangan', category: 'expense', normalBalance: 'debit', isActive: true, isSystemDefault: false },
    { code: '5210', name: 'Beban Operasional Listrik & Utilitas', category: 'expense', normalBalance: 'debit', isActive: true, isSystemDefault: true },
    { code: '5220', name: 'Beban Gaji & Honorarium Karyawan', category: 'expense', normalBalance: 'debit', isActive: true, isSystemDefault: true }
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function JournalReport() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [activeMainTab, setActiveMainTab] = useState<'journal' | 'coa'>('journal');
    const [coaList, setCoaList] = useState<AccountCOA[]>(DEFAULT_COA_LIST);

    // Mock initial journal dataset
    const [journals, setJournals] = useState<JournalEntryData[]>([
        {
            id: 'JRN-2026-001',
            date: '2026-06-25',
            docNo: isPPN ? 'INV-PPN-001' : 'INV-NP-001',
            category: 'sales',
            description: `Jurnal Pengakuan Piutang Invoice #${isPPN ? 'INV-PPN-001' : 'INV-NP-001'} - PT. Gojek Tokopedia`,
            postedBy: 'Sistem Otomatis (Sales Module)',
            lines: isPPN
                ? [
                      { accountCode: '1120', accountName: 'Piutang Dagang Client', debit: 11100000, credit: 0 },
                      { accountCode: '4110', accountName: 'Pendapatan Sewa Media Iklan (Billboard/Videotron)', debit: 0, credit: 10000000 },
                      { accountCode: '2130', accountName: 'Hutang PPN Keluaran (11%)', debit: 0, credit: 1100000 }
                  ]
                : [
                      { accountCode: '1120', accountName: 'Piutang Dagang Client', debit: 10000000, credit: 0 },
                      { accountCode: '4110', accountName: 'Pendapatan Sewa Media Iklan (Billboard/Videotron)', debit: 0, credit: 10000000 }
                  ]
        },
        {
            id: 'JRN-2026-002',
            date: '2026-06-25',
            docNo: 'KW-2026-0812',
            refNo: 'BCA-TRX-99120',
            category: 'cash_in',
            description: `Jurnal Penerimaan Kas Pelunasan Invoice #${isPPN ? 'INV-PPN-001' : 'INV-NP-001'} - PT. Gojek Tokopedia`,
            postedBy: 'Finance / Kasir (Sukma Setiawan)',
            lines: [
                { accountCode: '1112', accountName: 'Bank BCA Operasional Utama', debit: isPPN ? 11100000 : 10000000, credit: 0 },
                { accountCode: '1120', accountName: 'Piutang Dagang Client', debit: 0, credit: isPPN ? 11100000 : 10000000 }
            ]
        },
        {
            id: 'JRN-2026-003',
            date: '2026-06-24',
            docNo: isPPN ? 'PO-PPN-001' : 'PO-NP-001',
            category: 'purchase',
            description: `Jurnal Kewajiban PO Vendor #${isPPN ? 'PO-PPN-001' : 'PO-NP-001'} - PT. Megah Billboard Jaya`,
            postedBy: 'Sistem Otomatis (Procurement Module)',
            lines: isPPN
                ? [
                      { accountCode: '5110', accountName: 'Beban HPP Sewa Billboard Vendor', debit: 3000000, credit: 0 },
                      { accountCode: '1140', accountName: 'PPN Masukan (11%)', debit: 330000, credit: 0 },
                      { accountCode: '2110', accountName: 'Hutang Dagang Vendor Billboard', debit: 0, credit: 3330000 }
                  ]
                : [
                      { accountCode: '5110', accountName: 'Beban HPP Sewa Billboard Vendor', debit: 3000000, credit: 0 },
                      { accountCode: '2110', accountName: 'Hutang Dagang Vendor Billboard', debit: 0, credit: 3000000 }
                  ]
        },
        {
            id: 'JRN-2026-004',
            date: '2026-06-24',
            docNo: 'OUT-PAY-0041',
            refNo: 'MANDIRI-OUT-8812',
            category: 'cash_out',
            description: `Jurnal Pengeluaran Kas Pembayaran PO #${isPPN ? 'PO-PPN-001' : 'PO-NP-001'} - PT. Megah Billboard Jaya`,
            postedBy: 'Finance / Kasir (Sukma Setiawan)',
            lines: [
                { accountCode: '2110', accountName: 'Hutang Dagang Vendor Billboard', debit: isPPN ? 3330000 : 3000000, credit: 0 },
                { accountCode: '1111', accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)', debit: 0, credit: isPPN ? 3330000 : 3000000 }
            ]
        },
        {
            id: 'JRN-2026-005',
            date: '2026-06-22',
            docNo: isPPN ? 'INV-PPN-002' : 'INV-NP-002',
            category: 'sales',
            description: `Jurnal Piutang DP Invoice #${isPPN ? 'INV-PPN-002' : 'INV-NP-002'} - Traveloka Corp`,
            postedBy: 'Sistem Otomatis (Sales Module)',
            lines: isPPN
                ? [
                      { accountCode: '1120', accountName: 'Piutang Dagang Client', debit: 5550000, credit: 0 },
                      { accountCode: '4110', accountName: 'Pendapatan Sewa Media Iklan (Billboard/Videotron)', debit: 0, credit: 5000000 },
                      { accountCode: '2130', accountName: 'Hutang PPN Keluaran (11%)', debit: 0, credit: 550000 }
                  ]
                : [
                      { accountCode: '1120', accountName: 'Piutang Dagang Client', debit: 5000000, credit: 0 },
                      { accountCode: '4110', accountName: 'Pendapatan Sewa Media Iklan (Billboard/Videotron)', debit: 0, credit: 5000000 }
                  ]
        },
        {
            id: 'JRN-2026-006',
            date: '2026-06-20',
            docNo: 'ADJ-2026-001',
            category: 'adjustment',
            description: 'Jurnal Penyesuaian Beban Listrik Videotron Simpang Lima Bulan Juni',
            postedBy: 'Accounting (Indung Sukma)',
            lines: [
                { accountCode: '5210', accountName: 'Beban Operasional Listrik & Utilitas', debit: 1500000, credit: 0 },
                { accountCode: '1110', accountName: 'Kas Tunai / Operasional', debit: 0, credit: 1500000 }
            ]
        }
    ]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // COA Filter states
    const [coaSearchQuery, setCoaSearchQuery] = useState('');
    const [coaCategoryFilter, setCoaCategoryFilter] = useState<string>('all');

    // Modal states
    const [voucherModal, setVoucherModal] = useState<{ isOpen: boolean; item: JournalEntryData } | null>(null);
    const [addJournalModal, setAddJournalModal] = useState(false);
    const [addCoaModal, setAddCoaModal] = useState(false);
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // New Journal form state
    const [newDocNo, setNewDocNo] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newCategory, setNewCategory] = useState<JournalCategory>('adjustment');
    const [newDescription, setNewDescription] = useState('');
    const [newLines, setNewLines] = useState<JournalLine[]>([
        { accountCode: '5110', accountName: 'Beban HPP Sewa Billboard Vendor', debit: 0, credit: 0 },
        { accountCode: '1111', accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)', debit: 0, credit: 0 }
    ]);

    // New COA form state
    const [newCoaCode, setNewCoaCode] = useState('');
    const [newCoaName, setNewCoaName] = useState('');
    const [newCoaCategory, setNewCoaCategory] = useState<AccountCategory>('asset');
    const [newCoaNormal, setNewCoaNormal] = useState<'debit' | 'credit'>('debit');

    // Filtered COA List
    const filteredCoaList = useMemo(() => {
        return coaList.filter(acc => {
            const matchesSearch = acc.code.toLowerCase().includes(coaSearchQuery.toLowerCase()) ||
                acc.name.toLowerCase().includes(coaSearchQuery.toLowerCase());
            const matchesCat = coaCategoryFilter === 'all' || acc.category === coaCategoryFilter;
            return matchesSearch && matchesCat;
        });
    }, [coaList, coaSearchQuery, coaCategoryFilter]);

    // Compute Totals
    const filteredJournals = useMemo(() => {
        return journals.filter(j => {
            const matchesSearch = j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = categoryFilter === 'all' || j.category === categoryFilter;

            let matchesAccount = true;
            if (accountFilter !== 'all') {
                matchesAccount = j.lines.some(l => l.accountCode === accountFilter || l.accountName.toLowerCase().includes(accountFilter.toLowerCase()));
            }

            let matchesDate = true;
            if (startDateFilter) {
                matchesDate = matchesDate && new Date(j.date) >= new Date(startDateFilter);
            }
            if (endDateFilter) {
                matchesDate = matchesDate && new Date(j.date) <= new Date(endDateFilter);
            }

            return matchesSearch && matchesCategory && matchesAccount && matchesDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [journals, searchQuery, categoryFilter, accountFilter, startDateFilter, endDateFilter]);

    // Calculate totals across filtered dataset
    const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
        let deb = 0;
        let cred = 0;
        filteredJournals.forEach(j => {
            j.lines.forEach(l => {
                deb += l.debit;
                cred += l.credit;
            });
        });
        return {
            totalDebit: deb,
            totalCredit: cred,
            isBalanced: Math.abs(deb - cred) < 1
        };
    }, [filteredJournals]);

    // Paginated dataset
    const paginatedJournals = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredJournals.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredJournals, currentPage]);

    // Category Label & Badge Helper
    const getCategoryBadge = (cat: JournalCategory) => {
        switch (cat) {
            case 'sales':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Jurnal Penjualan</span>;
            case 'cash_in':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Penerimaan Kas</span>;
            case 'purchase':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Jurnal Pembelian</span>;
            case 'cash_out':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Pengeluaran Kas</span>;
            case 'adjustment':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Penyesuaian</span>;
        }
    };

    const getCoaCategoryBadge = (cat: AccountCategory) => {
        switch (cat) {
            case 'asset':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Aktiva / Aset</span>;
            case 'liability':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Kewajiban / Hutang</span>;
            case 'equity':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Ekuitas / Modal</span>;
            case 'revenue':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pendapatan</span>;
            case 'expense':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Beban Operasional</span>;
        }
    };

    // Reversing Journal action
    const handleReverseJournal = (j: JournalEntryData) => {
        if (confirm(`Apakah Anda yakin ingin membuat Jurnal Pembalik (Reversing Entry) untuk jurnal #${j.id}?`)) {
            const reversedLines: JournalLine[] = j.lines.map(l => ({
                accountCode: l.accountCode,
                accountName: l.accountName,
                debit: l.credit,
                credit: l.debit,
                memo: `Pembalik entri #${j.id}`
            }));

            const newReversedEntry: JournalEntryData = {
                id: `JRN-REV-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date().toISOString().split('T')[0],
                docNo: `REV-${j.docNo}`,
                category: 'adjustment',
                description: `[JURNAL PEMBALIK] Pembatalan / Pembalik ${j.description}`,
                postedBy: 'Accounting (Indung Sukma)',
                lines: reversedLines,
                isReversed: true
            };

            setJournals(prev => [newReversedEntry, ...prev]);
            setSuccessAlert(`Jurnal Pembalik #${newReversedEntry.id} berhasil diterbitkan dan terposting secara otomatis.`);
            setTimeout(() => setSuccessAlert(null), 5000);
        }
    };

    // Handle Adding New Manual Journal
    const handleAddJournalLine = () => {
        const firstCoa = coaList[0];
        setNewLines(prev => [...prev, { accountCode: firstCoa.code, accountName: firstCoa.name, debit: 0, credit: 0 }]);
    };

    const handleRemoveJournalLine = (index: number) => {
        if (newLines.length <= 2) {
            alert('Entri jurnal wajib memiliki minimal 2 baris (Debet & Kredit).');
            return;
        }
        setNewLines(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleLineAccountSelect = (index: number, code: string) => {
        const selectedAcc = coaList.find(a => a.code === code);
        if (selectedAcc) {
            setNewLines(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], accountCode: selectedAcc.code, accountName: selectedAcc.name };
                return updated;
            });
        }
    };

    const handleLineChange = (index: number, field: keyof JournalLine, value: any) => {
        setNewLines(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const newJournalDebitTotal = newLines.reduce((s, l) => s + (parseFloat(String(l.debit)) || 0), 0);
    const newJournalCreditTotal = newLines.reduce((s, l) => s + (parseFloat(String(l.credit)) || 0), 0);
    const isNewJournalBalanced = Math.abs(newJournalDebitTotal - newJournalCreditTotal) < 1 && newJournalDebitTotal > 0;

    const handleSaveNewJournal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isNewJournalBalanced) {
            alert('Gagal menyimpan! Total Debet dan Total Kredit harus berimbang (Debet = Kredit).');
            return;
        }

        const createdEntry: JournalEntryData = {
            id: `JRN-2026-${Math.floor(100 + Math.random() * 900)}`,
            date: newDate,
            docNo: newDocNo || `MAN-${Math.floor(1000 + Math.random() * 9000)}`,
            category: newCategory,
            description: newDescription,
            postedBy: 'Accounting (Indung Sukma)',
            lines: newLines.map(l => ({
                ...l,
                debit: parseFloat(String(l.debit)) || 0,
                credit: parseFloat(String(l.credit)) || 0
            }))
        };

        setJournals(prev => [createdEntry, ...prev]);
        setAddJournalModal(false);
        setSuccessAlert(`Sukses! Entri Jurnal #${createdEntry.id} berhasil ditambahkan ke Laporan Jurnal Umum.`);
        setTimeout(() => setSuccessAlert(null), 5000);

        // Reset form
        setNewDocNo('');
        setNewDescription('');
        setNewLines([
            { accountCode: '5110', accountName: 'Beban HPP Sewa Billboard Vendor', debit: 0, credit: 0 },
            { accountCode: '1111', accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)', debit: 0, credit: 0 }
        ]);
    };

    // Save New COA Account
    const handleSaveNewCoa = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoaCode || !newCoaName) {
            alert('Kode Akun dan Nama Akun wajib diisi.');
            return;
        }
        if (coaList.some(a => a.code === newCoaCode)) {
            alert(`Kode Akun ${newCoaCode} sudah digunakan.`);
            return;
        }

        const newAccount: AccountCOA = {
            code: newCoaCode,
            name: newCoaName,
            category: newCoaCategory,
            normalBalance: newCoaNormal,
            isActive: true,
            isSystemDefault: false
        };

        setCoaList(prev => [...prev, newAccount].sort((a, b) => a.code.localeCompare(b.code)));
        setAddCoaModal(false);
        setSuccessAlert(`Akun COA Baru (${newCoaCode} - ${newCoaName}) berhasil ditambahkan.`);
        setTimeout(() => setSuccessAlert(null), 5000);

        setNewCoaCode('');
        setNewCoaName('');
    };

    // Action Items for Journals
    const getJournalActionItems = (j: JournalEntryData): ActionMenuItem[] => {
        return [
            {
                label: 'Cetak / Detail Voucher PDF',
                icon: (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                ),
                onClick: () => setVoucherModal({ isOpen: true, item: j })
            },
            {
                label: 'Buat Jurnal Pembalik',
                icon: (
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ),
                onClick: () => handleReverseJournal(j)
            }
        ];
    };

    // Action Items for COA
    const getCoaActionItems = (acc: AccountCOA): ActionMenuItem[] => {
        return [
            {
                label: acc.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
                icon: (
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                ),
                onClick: () => {
                    setCoaList(prev => prev.map(a => a.code === acc.code ? { ...a, isActive: !a.isActive } : a));
                }
            }
        ];
    };

    return (
        <AppLayout
            activePage="journal"
            title="Laporan Jurnal Umum & Bagan Akun"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Accounting' }, { label: 'Jurnal Umum' }]}
        >
            <div className="w-full space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Laporan Jurnal Umum & Pemetaan Akun (COA)</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isPPN ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                                Mode {isPPN ? "PPN 11%" : "Non-PPN"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Buku pembantu catatan transaksi ganda otomatis, pengelolaan Bagan Akun (Chart of Accounts), serta jurnal penyesuaian akuntansi YouSee.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {activeMainTab === 'journal' ? (
                            <>
                                <button
                                    onClick={() => alert("Mengunduh Rekap Laporan Jurnal Umum (PDF / Excel)...")}
                                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                                >
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Export Jurnal</span>
                                </button>

                                <button
                                    onClick={() => setAddJournalModal(true)}
                                    className="bg-primary hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-neon-primary hover:shadow-neon-primary-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>+ Jurnal Penyesuaian</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setAddCoaModal(true)}
                                className="bg-primary hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-neon-primary hover:shadow-neon-primary-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>+ Akun COA Baru</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 transition-all animate-fade-in shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="text-xs font-bold text-emerald-900 leading-tight">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Tab Navigation Toolbar (Buku Jurnal vs Master COA) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/80 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveMainTab('journal')}
                            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeMainTab === 'journal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Buku Jurnal Umum (General Ledger)</span>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {journals.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveMainTab('coa')}
                            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeMainTab === 'coa' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>Bagan Akun (Chart of Accounts - COA)</span>
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {coaList.length}
                            </span>
                        </button>
                    </div>

                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {activeMainTab === 'journal' ? 'Laporan Transaksi Jurnal Berimbang' : 'Pengaturan Kode & Nama Akun Keuangan'}
                    </div>
                </div>

                {activeMainTab === 'journal' ? (
                    <>
                        {/* Metric Summary Cards (4 Grid) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL ENTRI JURNAL</span>
                                <span className="text-2xl font-bold text-slate-900 font-mono block">{filteredJournals.length} Entri</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Termasuk transaksi otomatis & manual</span>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL DEBET PERIODE INI</span>
                                <span className="text-2xl font-bold text-emerald-700 font-mono block">{fmt(totalDebit)}</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Sisi debet seluruh akun neraca/laba rugi</span>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL KREDIT PERIODE INI</span>
                                <span className="text-2xl font-bold text-blue-700 font-mono block">{fmt(totalCredit)}</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Sisi kredit seluruh akun neraca/laba rugi</span>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS KESEIMBANGAN</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isBalanced ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                        {isBalanced ? "✓ Balanced" : "⚠ Imbalanced"}
                                    </span>
                                </div>
                                <span className={`text-xl font-bold font-mono block ${isBalanced ? "text-emerald-700" : "text-rose-600"}`}>
                                    {isBalanced ? "DEBET = KREDIT" : "SELISIH D/K DETEKSI"}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium block">
                                    {isBalanced ? "Seluruh jurnal berimbang sempurna" : `Selisih: ${fmt(Math.abs(totalDebit - totalCredit))}`}
                                </span>
                            </div>
                        </div>

                        {/* Filter & Control Panel Bar */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:items-end">
                                
                                {/* Search Input */}
                                <div className="space-y-1 lg:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Jurnal</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                            placeholder="Cari No. Jurnal, No. Dokumen, atau Deskripsi..."
                                            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary transition-all placeholder-slate-400 shadow-2xs"
                                        />
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Filter Kategori */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Jurnal</label>
                                    <SelectInput
                                        value={categoryFilter}
                                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                                        options={[
                                            { value: 'all', label: 'Semua Kategori' },
                                            { value: 'sales', label: 'Jurnal Penjualan' },
                                            { value: 'cash_in', label: 'Penerimaan Kas' },
                                            { value: 'purchase', label: 'Jurnal Pembelian' },
                                            { value: 'cash_out', label: 'Pengeluaran Kas' },
                                            { value: 'adjustment', label: 'Penyesuaian (Manual)' },
                                        ]}
                                    />
                                </div>

                                {/* Filter Akun COA */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Kode Akun</label>
                                    <SelectInput
                                        value={accountFilter}
                                        onChange={(e) => { setAccountFilter(e.target.value); setCurrentPage(1); }}
                                        options={[
                                            { value: 'all', label: 'Semua Akun (COA)' },
                                            ...coaList.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))
                                        ]}
                                    />
                                </div>

                                {/* Rentang Tanggal */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        value={startDateFilter}
                                        onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-primary transition-all shadow-2xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Double-Entry Journal Table */}
                        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                            <th className="py-4 px-6 w-36">Tanggal / JRN ID</th>
                                            <th className="py-4 px-6 w-40">Dokumen Ref</th>
                                            <th className="py-4 px-6">Kode & Nama Akun (COA) / Keterangan</th>
                                            <th className="py-4 px-6 text-right w-44">Debet (IDR)</th>
                                            <th className="py-4 px-6 text-right w-44">Kredit (IDR)</th>
                                            <th className="py-4 px-6 text-center w-24">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedJournals.map((j) => {
                                            const journalTotalDeb = j.lines.reduce((s, l) => s + l.debit, 0);
                                            const journalTotalCred = j.lines.reduce((s, l) => s + l.credit, 0);
                                            return (
                                                <React.Fragment key={j.id}>
                                                    {/* Header Row per Journal Entry */}
                                                    <tr className="bg-slate-50/60 border-t border-slate-200/60">
                                                        <td className="py-3 px-6 whitespace-nowrap">
                                                            <div className="font-bold text-slate-900">{formatDateIndo(j.date)}</div>
                                                            <div className="text-[10px] font-mono font-bold text-blue-600">{j.id}</div>
                                                        </td>
                                                        <td className="py-3 px-6 whitespace-nowrap">
                                                            <div className="font-mono font-bold text-slate-800">{j.docNo}</div>
                                                            {j.refNo && <div className="text-[10px] text-slate-400 font-medium">{j.refNo}</div>}
                                                        </td>
                                                        <td className="py-3 px-6">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="font-bold text-slate-900">{j.description}</span>
                                                                {getCategoryBadge(j.category)}
                                                                {j.isReversed && <span className="bg-rose-100 text-rose-800 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-rose-200">Reversing Entry</span>}
                                                            </div>
                                                            <div className="text-[10.5px] text-slate-400 font-medium">Diposting oleh: {j.postedBy}</div>
                                                        </td>
                                                        <td className="py-3 px-6 text-right font-mono font-bold text-slate-500 text-xs">
                                                            {fmt(journalTotalDeb)}
                                                        </td>
                                                        <td className="py-3 px-6 text-right font-mono font-bold text-slate-500 text-xs">
                                                            {fmt(journalTotalCred)}
                                                        </td>
                                                        <td className="py-3 px-6 text-center whitespace-nowrap">
                                                            <ActionDropdown items={getJournalActionItems(j)} />
                                                        </td>
                                                    </tr>

                                                    {/* Line Items for Double Entry */}
                                                    {j.lines.map((line, lIdx) => {
                                                        const isCreditLine = line.credit > 0 && line.debit === 0;
                                                        return (
                                                            <tr key={lIdx} className="hover:bg-slate-50/40 transition-colors">
                                                                <td className="py-2.5 px-6"></td>
                                                                <td className="py-2.5 px-6"></td>
                                                                <td className="py-2.5 px-6">
                                                                    <div className={`flex items-center gap-3 ${isCreditLine ? "pl-8 text-slate-600" : "text-slate-800"}`}>
                                                                        <span className="font-mono font-bold text-[10.5px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                                                                            {line.accountCode}
                                                                        </span>
                                                                        <span className={isCreditLine ? "font-semibold" : "font-bold text-slate-900"}>
                                                                            {line.accountName}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900">
                                                                    {line.debit > 0 ? fmt(line.debit) : "—"}
                                                                </td>
                                                                <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900">
                                                                    {line.credit > 0 ? fmt(line.credit) : "—"}
                                                                </td>
                                                                <td className="py-2.5 px-6"></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}

                                        {filteredJournals.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center">
                                                    <EmptyState title="Belum Ada Jurnal" message="Tidak ditemukan entri jurnal umum yang sesuai dengan filter atau pencarian Anda." />
                                                </td>
                                            </tr>
                                        )}

                                        {/* Balanced Total Footer */}
                                        {filteredJournals.length > 0 && (
                                            <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                                                <td colSpan={3} className="py-4 px-6 text-right uppercase tracking-wider text-xs font-bold text-slate-700">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>TOTAL ENTRI JURNAL PERIODE INI:</span>
                                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-200">
                                                            ✓ BALANCED
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono text-sm font-bold text-emerald-700">
                                                    {fmt(totalDebit)}
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono text-sm font-bold text-blue-700">
                                                    {fmt(totalCredit)}
                                                </td>
                                                <td className="py-4 px-6"></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredJournals.length > 0 && (
                                <div className="p-4 border-t border-slate-100">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(filteredJournals.length / ITEMS_PER_PAGE)}
                                        totalItems={filteredJournals.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* TAB MASTER CHART OF ACCOUNTS (COA) */
                    <div className="space-y-6">
                        {/* Filter Bar COA */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:items-end">
                                <div className="space-y-1 lg:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Akun COA</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={coaSearchQuery}
                                            onChange={(e) => setCoaSearchQuery(e.target.value)}
                                            placeholder="Cari Kode Akun atau Nama Akun..."
                                            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary transition-all placeholder-slate-400 shadow-2xs"
                                        />
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Tipe Akun</label>
                                    <SelectInput
                                        value={coaCategoryFilter}
                                        onChange={(e) => setCoaCategoryFilter(e.target.value)}
                                        options={[
                                            { value: 'all', label: 'Semua Tipe Akun' },
                                            { value: 'asset', label: 'Aktiva / Aset (1000)' },
                                            { value: 'liability', label: 'Kewajiban / Hutang (2000)' },
                                            { value: 'equity', label: 'Ekuitas / Modal (3000)' },
                                            { value: 'revenue', label: 'Pendapatan (4000)' },
                                            { value: 'expense', label: 'Beban Operasional (5000)' },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COA Table */}
                        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                            <th className="py-4 px-6 w-32">Kode Akun</th>
                                            <th className="py-4 px-6">Nama Akun COA</th>
                                            <th className="py-4 px-6">Kategori / Tipe Akun</th>
                                            <th className="py-4 px-6 text-center">Saldo Normal</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                            <th className="py-4 px-6 text-center w-24">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredCoaList.map((acc) => (
                                            <tr key={acc.code} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6 font-mono font-bold text-slate-900">{acc.code}</td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800">{acc.name}</div>
                                                    {acc.isSystemDefault && <span className="text-[9.5px] font-bold text-slate-400 italic">Default Akun Sistem</span>}
                                                </td>
                                                <td className="py-4 px-6">{getCoaCategoryBadge(acc.category)}</td>
                                                <td className="py-4 px-6 text-center font-semibold text-slate-700 uppercase">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${acc.normalBalance === 'debit' ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>
                                                        {acc.normalBalance}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${acc.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${acc.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                        {acc.isActive ? "Aktif" : "Non-Aktif"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <ActionDropdown items={getCoaActionItems(acc)} />
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredCoaList.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center">
                                                    <EmptyState title="Belum Ada Akun COA" message="Tidak ditemukan akun COA yang sesuai dengan pencarian." />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: DETAIL VOUCHER JURNAL */}
            {voucherModal && voucherModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setVoucherModal(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Bukti Voucher Jurnal Umum</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{voucherModal.item.id} · {voucherModal.item.docNo}</p>
                            </div>
                            <button onClick={() => setVoucherModal(null)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <div className="p-6 space-y-5 text-slate-800">
                            {/* Header Voucher Card */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Tanggal Transaksi:</span>
                                    <span className="font-bold text-slate-900">{formatDateIndo(voucherModal.item.date)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Nomor Dokumen Acuan:</span>
                                    <span className="font-mono font-bold text-slate-900">{voucherModal.item.docNo}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Kategori Jurnal:</span>
                                    <div>{getCategoryBadge(voucherModal.item.category)}</div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Keterangan / Deskripsi:</span>
                                    <span className="font-bold text-slate-900 max-w-[340px] text-right">{voucherModal.item.description}</span>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-4">Kode Akun</th>
                                            <th className="py-2.5 px-4">Nama Akun</th>
                                            <th className="py-2.5 px-4 text-right">Debet</th>
                                            <th className="py-2.5 px-4 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {voucherModal.item.lines.map((l, idx) => (
                                            <tr key={idx}>
                                                <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{l.accountCode}</td>
                                                <td className="py-2.5 px-4 font-bold text-slate-800">{l.accountName}</td>
                                                <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">{l.debit > 0 ? fmt(l.debit) : '—'}</td>
                                                <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">{l.credit > 0 ? fmt(l.credit) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                        <tr>
                                            <td colSpan={2} className="py-2.5 px-4 text-right uppercase text-[10px]">Total Voucher</td>
                                            <td className="py-2.5 px-4 text-right font-mono text-emerald-800">
                                                {fmt(voucherModal.item.lines.reduce((s, l) => s + l.debit, 0))}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-blue-800">
                                                {fmt(voucherModal.item.lines.reduce((s, l) => s + l.credit, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Printable Signatures */}
                            <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs text-slate-500">
                                <div className="space-y-8 border-t border-slate-200 pt-2">
                                    <span>Dibuat Oleh</span>
                                    <div className="font-bold text-slate-900">{voucherModal.item.postedBy}</div>
                                </div>
                                <div className="space-y-8 border-t border-slate-200 pt-2">
                                    <span>Diperiksa Oleh</span>
                                    <div className="font-bold text-slate-900">Indung Sukma</div>
                                </div>
                                <div className="space-y-8 border-t border-slate-200 pt-2">
                                    <span>Disetujui (Direktur)</span>
                                    <div className="font-bold text-slate-900">Pimpinan YouSee</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setVoucherModal(null)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={() => alert(`Mencetak PDF Voucher Jurnal #${voucherModal.item.id}...`)}
                                    className="bg-primary hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    <span>Cetak Voucher PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: TAMBAH JURNAL PENYESUAIAN MANUAL */}
            {addJournalModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setAddJournalModal(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Buat Jurnal Penyesuaian Baru (Manual)</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Input entri jurnal ganda (Debet & Kredit wajib berimbang)</p>
                            </div>
                            <button onClick={() => setAddJournalModal(false)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSaveNewJournal} className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        required
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">No. Dokumen Acuan</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: ADJ-2026-002"
                                        value={newDocNo}
                                        onChange={(e) => setNewDocNo(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Kategori Jurnal</label>
                                    <SelectInput
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as JournalCategory)}
                                        options={[
                                            { value: 'adjustment', label: 'Penyesuaian' },
                                            { value: 'sales', label: 'Jurnal Penjualan' },
                                            { value: 'purchase', label: 'Jurnal Pembelian' },
                                            { value: 'cash_in', label: 'Penerimaan Kas' },
                                            { value: 'cash_out', label: 'Pengeluaran Kas' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Keterangan Jurnal</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Deskripsi transaksi penyesuaian..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            {/* Dynamic Lines */}
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Rincian Akun & Nominal (COA)</label>
                                    <button
                                        type="button"
                                        onClick={handleAddJournalLine}
                                        className="text-primary hover:text-primary-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        + Tambah Baris Akun
                                    </button>
                                </div>

                                <div className="space-y-2 border border-slate-200/80 rounded-2xl p-3 bg-slate-50/50">
                                    {newLines.map((line, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-7">
                                                <SelectInput
                                                    value={line.accountCode}
                                                    onChange={(e) => handleLineAccountSelect(idx, e.target.value)}
                                                    options={coaList.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Debet"
                                                    min="0"
                                                    value={line.debit || ''}
                                                    onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-emerald-700 text-right"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Kredit"
                                                    min="0"
                                                    value={line.credit || ''}
                                                    onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-blue-700 text-right"
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveJournalLine(idx)}
                                                    className="text-rose-500 hover:text-rose-700 font-bold text-sm cursor-pointer"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Balance Validator */}
                            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                                isNewJournalBalanced ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                            }`}>
                                <div>
                                    <span>Status Keseimbangan Form: </span>
                                    <span>{isNewJournalBalanced ? "✓ Berimbang (Balanced)" : "⚠ Tidak Berimbang (Imbalanced)"}</span>
                                </div>
                                <div className="font-mono space-x-3">
                                    <span>D: {fmt(newJournalDebitTotal)}</span>
                                    <span>K: {fmt(newJournalCreditTotal)}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddJournalModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!isNewJournalBalanced}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all ${
                                        isNewJournalBalanced
                                            ? "bg-primary hover:bg-primary-700 text-white cursor-pointer"
                                            : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                    }`}
                                >
                                    Simpan Jurnal Penyesuaian
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: TAMBAH AKUN COA BARU */}
            {addCoaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setAddCoaModal(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Tambah Akun COA Baru</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Pengaturan bagan akun keuangan YouSee</p>
                            </div>
                            <button onClick={() => setAddCoaModal(false)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSaveNewCoa} className="p-6 space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Kode Akun COA</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: 1114 / 5230"
                                    value={newCoaCode}
                                    onChange={(e) => setNewCoaCode(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Nama Akun Keuangan</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nama Akun Lengkap..."
                                    value={newCoaName}
                                    onChange={(e) => setNewCoaName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Kategori Akun</label>
                                    <SelectInput
                                        value={newCoaCategory}
                                        onChange={(e) => setNewCoaCategory(e.target.value as AccountCategory)}
                                        options={[
                                            { value: 'asset', label: 'Aktiva / Aset (1000)' },
                                            { value: 'liability', label: 'Kewajiban / Hutang (2000)' },
                                            { value: 'equity', label: 'Ekuitas / Modal (3000)' },
                                            { value: 'revenue', label: 'Pendapatan (4000)' },
                                            { value: 'expense', label: 'Beban (5000)' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Saldo Normal</label>
                                    <SelectInput
                                        value={newCoaNormal}
                                        onChange={(e) => setNewCoaNormal(e.target.value as 'debit' | 'credit')}
                                        options={[
                                            { value: 'debit', label: 'Debet (D)' },
                                            { value: 'credit', label: 'Kredit (K)' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddCoaModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
                                >
                                    Simpan Akun COA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
