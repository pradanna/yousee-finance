import MonthPicker from '@/Components/Form/MonthPicker';
import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import AuditLogModal, { AuditLogItem } from '@/Components/UI/AuditLogModal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import html2pdf from 'html2pdf.js';
import React, { useMemo, useState } from 'react';
// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
type JournalCategory =
    | 'sales'
    | 'cash_in'
    | 'purchase'
    | 'cash_out'
    | 'adjustment';
type AccountCategory =
    | 'asset'
    | 'liability'
    | 'equity'
    | 'revenue'
    | 'cogs'
    | 'expense';

interface AccountCOA {
    id?: string;
    code: string;
    name: string;
    category: AccountCategory;
    normalBalance: 'debit' | 'credit';
    isSystemDefault?: boolean;
    isActive: boolean;
    description?: string | null;
}

interface JournalLine {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    memo?: string | null;
}

interface JournalEntryData {
    id: string;
    uuid?: string;
    date: string;
    docNo: string;
    refNo?: string;
    category: JournalCategory;
    description: string;
    postedBy: string;
    lines: JournalLine[];
    isReversed?: boolean;
    fiscal_mode?: string;
}

export interface JournalReportProps {
    initialJournals?: JournalEntryData[];
    initialCoaList?: AccountCOA[];
    auditLogs?: AuditLogItem[];
}

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

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

const ITEMS_PER_PAGE = 10;

// Default Master Chart of Accounts (COA)
const DEFAULT_COA_LIST: AccountCOA[] = [
    {
        code: '1110',
        name: 'Kas Tunai / Operasional',
        category: 'asset',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '1111',
        name: 'Bank Mandiri Solo Baru (138-00-2010633-7)',
        category: 'asset',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '1112',
        name: 'Bank BCA Operasional Utama',
        category: 'asset',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '1113',
        name: 'Bank BRI Giro Usaha',
        category: 'asset',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: false,
    },
    {
        code: '1120',
        name: 'Piutang Dagang Client',
        category: 'asset',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '1140',
        name: 'PPN Masukan (11%)',
        category: 'asset',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '2110',
        name: 'Hutang Dagang / Hutang Usaha',
        category: 'liability',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '2130',
        name: 'Hutang PPN Keluaran (11%)',
        category: 'liability',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '2140',
        name: 'Hutang PPh Pasal 23 / PPh 4(2)',
        category: 'liability',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: false,
    },
    {
        code: '3100',
        name: 'Modal Disetor Pemilik',
        category: 'equity',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '3200',
        name: 'Laba Ditahan (Retained Earnings)',
        category: 'equity',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '4110',
        name: 'Pendapatan Sewa Media Iklan (Billboard/Videotron)',
        category: 'revenue',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '4120',
        name: 'Pendapatan Produksi & Cetak Banner',
        category: 'revenue',
        normalBalance: 'credit',
        isActive: true,
        isSystemDefault: false,
    },
    {
        code: '5110',
        name: 'Beban HPP Sewa Billboard Vendor',
        category: 'cogs',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '5120',
        name: 'Beban HPP Produksi, Cetak & Pemasangan',
        category: 'cogs',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: false,
    },
    {
        code: '5210',
        name: 'Beban Operasional Listrik & Utilitas',
        category: 'expense',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
    {
        code: '5220',
        name: 'Beban Gaji & Honorarium Karyawan',
        category: 'expense',
        normalBalance: 'debit',
        isActive: true,
        isSystemDefault: true,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function JournalReport({
    initialJournals = [],
    initialCoaList = [],
    auditLogs = [],
}: JournalReportProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [coaList, setCoaList] = useState<AccountCOA[]>(() =>
        initialCoaList && initialCoaList.length > 0
            ? initialCoaList
            : DEFAULT_COA_LIST,
    );

    // Initial journal dataset from DB
    const [journals, setJournals] = useState<JournalEntryData[]>(
        () => initialJournals || [],
    );
    const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);

    // Filter states
    const now = new Date();
    const currentYearStr = now.getFullYear().toString();
    const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
    const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
    const [currentPage, setCurrentPage] = useState(1);

    // COA Filter states
    const [coaSearchQuery, setCoaSearchQuery] = useState('');
    const [coaCategoryFilter, setCoaCategoryFilter] = useState<string>('all');

    // Modal states
    const [voucherModal, setVoucherModal] = useState<{
        isOpen: boolean;
        item: JournalEntryData;
    } | null>(null);
    const [addJournalModal, setAddJournalModal] = useState(false);
    const [addCoaModal, setAddCoaModal] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // New Journal form state
    const [newDocNo, setNewDocNo] = useState('');
    const [newDate, setNewDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [newCategory, setNewCategory] =
        useState<JournalCategory>('adjustment');
    const [newDescription, setNewDescription] = useState('');
    const [newLines, setNewLines] = useState<JournalLine[]>([
        {
            accountCode: '5110',
            accountName: 'Beban HPP Sewa Billboard Vendor',
            debit: 0,
            credit: 0,
        },
        {
            accountCode: '1111',
            accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)',
            debit: 0,
            credit: 0,
        },
    ]);

    // New COA form state
    const [newCoaCode, setNewCoaCode] = useState('');
    const [newCoaName, setNewCoaName] = useState('');
    const [newCoaCategory, setNewCoaCategory] =
        useState<AccountCategory>('asset');
    const [newCoaNormal, setNewCoaNormal] = useState<'debit' | 'credit'>(
        'debit',
    );

    // Filtered COA List
    const filteredCoaList = useMemo(() => {
        return coaList.filter((acc) => {
            const matchesSearch =
                acc.code.toLowerCase().includes(coaSearchQuery.toLowerCase()) ||
                acc.name.toLowerCase().includes(coaSearchQuery.toLowerCase());
            const matchesCat =
                coaCategoryFilter === 'all' ||
                acc.category === coaCategoryFilter;
            return matchesSearch && matchesCat;
        });
    }, [coaList, coaSearchQuery, coaCategoryFilter]);

    // Compute Totals
    const filteredJournals = useMemo(() => {
        return journals
            .filter((j) => {
                const matchesSearch =
                    j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    j.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    j.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());

                const matchesCategory =
                    categoryFilter === 'all' || j.category === categoryFilter;

                let matchesAccount = true;
                if (accountFilter !== 'all') {
                    matchesAccount = j.lines.some(
                        (l) =>
                            l.accountCode === accountFilter ||
                            l.accountName
                                .toLowerCase()
                                .includes(accountFilter.toLowerCase()),
                    );
                }

                let matchesDate = true;
                if (selectedMonth !== 'all') {
                    matchesDate =
                        matchesDate &&
                        j.date.startsWith(`${selectedYear}-${selectedMonth}`);
                } else if (selectedYear !== 'all') {
                    matchesDate =
                        matchesDate && j.date.startsWith(`${selectedYear}-`);
                }

                if (startDateFilter) {
                    matchesDate =
                        matchesDate &&
                        new Date(j.date) >= new Date(startDateFilter);
                }
                if (endDateFilter) {
                    matchesDate =
                        matchesDate &&
                        new Date(j.date) <= new Date(endDateFilter);
                }

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesAccount &&
                    matchesDate
                );
            })
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
    }, [
        journals,
        searchQuery,
        categoryFilter,
        accountFilter,
        selectedMonth,
        selectedYear,
        startDateFilter,
        endDateFilter,
    ]);

    // Calculate totals across filtered dataset
    const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
        let deb = 0;
        let cred = 0;
        filteredJournals.forEach((j) => {
            j.lines.forEach((l) => {
                deb += l.debit;
                cred += l.credit;
            });
        });
        return {
            totalDebit: deb,
            totalCredit: cred,
            isBalanced: Math.abs(deb - cred) < 1,
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
                return (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                        Jurnal Penjualan
                    </span>
                );
            case 'cash_in':
                return (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        Penerimaan Kas
                    </span>
                );
            case 'purchase':
                return (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Jurnal Pembelian
                    </span>
                );
            case 'cash_out':
                return (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                        Pengeluaran Kas
                    </span>
                );
            case 'adjustment':
                return (
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                        Penyesuaian
                    </span>
                );
        }
    };

    const getCoaCategoryBadge = (cat: AccountCategory) => {
        switch (cat) {
            case 'asset':
                return (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Aktiva / Aset
                    </span>
                );
            case 'liability':
                return (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        Kewajiban / Hutang
                    </span>
                );
            case 'equity':
                return (
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        Ekuitas / Modal
                    </span>
                );
            case 'revenue':
                return (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Pendapatan
                    </span>
                );
            case 'cogs':
                return (
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                        HPP / COGS
                    </span>
                );
            case 'expense':
                return (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Beban Operasional
                    </span>
                );
        }
    };

    // Reversing Journal action
    const handleReverseJournal = (j: JournalEntryData) => {
        if (
            confirm(
                `Apakah Anda yakin ingin membuat Jurnal Pembalik (Reversing Entry) untuk jurnal #${j.id}?`,
            )
        ) {
            const reversedLines: JournalLine[] = j.lines.map((l) => ({
                accountCode: l.accountCode,
                accountName: l.accountName,
                debit: l.credit,
                credit: l.debit,
                memo: `Pembalik entri #${j.id}`,
            }));

            const newReversedEntry: JournalEntryData = {
                id: `JRN-REV-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date().toISOString().split('T')[0],
                docNo: `REV-${j.docNo}`,
                category: 'adjustment',
                description: `[JURNAL PEMBALIK] Pembatalan / Pembalik ${j.description}`,
                postedBy: 'Accounting (Indung Sukma)',
                lines: reversedLines,
                isReversed: true,
            };

            setJournals((prev) => [newReversedEntry, ...prev]);
            setSuccessAlert(
                `Jurnal Pembalik #${newReversedEntry.id} berhasil diterbitkan dan terposting secara otomatis.`,
            );
            setTimeout(() => setSuccessAlert(null), 5000);
        }
    };

    // Handle Adding New Manual Journal
    const handleAddJournalLine = () => {
        const firstCoa = coaList[0];
        setNewLines((prev) => [
            ...prev,
            {
                accountCode: firstCoa.code,
                accountName: firstCoa.name,
                debit: 0,
                credit: 0,
            },
        ]);
    };

    const handleRemoveJournalLine = (index: number) => {
        if (newLines.length <= 2) {
            alert(
                'Entri jurnal wajib memiliki minimal 2 baris (Debet & Kredit).',
            );
            return;
        }
        setNewLines((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleLineAccountSelect = (index: number, code: string) => {
        const selectedAcc = coaList.find((a) => a.code === code);
        if (selectedAcc) {
            setNewLines((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    accountCode: selectedAcc.code,
                    accountName: selectedAcc.name,
                };
                return updated;
            });
        }
    };

    const handleLineChange = (
        index: number,
        field: keyof JournalLine,
        value: any,
    ) => {
        setNewLines((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const newJournalDebitTotal = newLines.reduce(
        (s, l) => s + (parseFloat(String(l.debit)) || 0),
        0,
    );
    const newJournalCreditTotal = newLines.reduce(
        (s, l) => s + (parseFloat(String(l.credit)) || 0),
        0,
    );
    const isNewJournalBalanced =
        Math.abs(newJournalDebitTotal - newJournalCreditTotal) < 1 &&
        newJournalDebitTotal > 0;

    const handleSaveNewJournal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isNewJournalBalanced) {
            alert(
                'Gagal menyimpan! Total Debet dan Total Kredit harus berimbang (Debet = Kredit).',
            );
            return;
        }

        const createdEntry: JournalEntryData = {
            id: `JRN-2026-${Math.floor(100 + Math.random() * 900)}`,
            date: newDate,
            docNo: newDocNo || `MAN-${Math.floor(1000 + Math.random() * 9000)}`,
            category: newCategory,
            description: newDescription,
            postedBy: 'Accounting (Indung Sukma)',
            lines: newLines.map((l) => ({
                ...l,
                debit: parseFloat(String(l.debit)) || 0,
                credit: parseFloat(String(l.credit)) || 0,
            })),
        };

        setJournals((prev) => [createdEntry, ...prev]);
        setAddJournalModal(false);
        setSuccessAlert(
            `Sukses! Entri Jurnal #${createdEntry.id} berhasil ditambahkan ke Laporan Jurnal Umum.`,
        );
        setTimeout(() => setSuccessAlert(null), 5000);

        // Reset form
        setNewDocNo('');
        setNewDescription('');
        setNewLines([
            {
                accountCode: '5110',
                accountName: 'Beban HPP Sewa Billboard Vendor',
                debit: 0,
                credit: 0,
            },
            {
                accountCode: '1111',
                accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)',
                debit: 0,
                credit: 0,
            },
        ]);
    };

    // Save New COA Account
    const handleSaveNewCoa = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoaCode || !newCoaName) {
            alert('Kode Akun dan Nama Akun wajib diisi.');
            return;
        }
        if (coaList.some((a) => a.code === newCoaCode)) {
            alert(`Kode Akun ${newCoaCode} sudah digunakan.`);
            return;
        }

        const newAccount: AccountCOA = {
            code: newCoaCode,
            name: newCoaName,
            category: newCoaCategory,
            normalBalance: newCoaNormal,
            isActive: true,
            isSystemDefault: false,
        };

        setCoaList((prev) =>
            [...prev, newAccount].sort((a, b) => a.code.localeCompare(b.code)),
        );
        setAddCoaModal(false);
        setSuccessAlert(
            `Akun COA Baru (${newCoaCode} - ${newCoaName}) berhasil ditambahkan.`,
        );
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                ),
                onClick: () => setVoucherModal({ isOpen: true, item: j }),
            },
            {
                label: 'Buat Jurnal Pembalik',
                icon: (
                    <svg
                        className="h-4 w-4 text-amber-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                ),
                onClick: () => handleReverseJournal(j),
            },
        ];
    };

    // Execute Export Handler (Excel CSV & PDF)
    const handleExecuteExport = () => {
        const targetData = filteredJournals;

        if (targetData.length === 0) {
            alert(
                'Tidak ada data jurnal yang dapat diexport berdasarkan filter saat ini.',
            );
            return;
        }

        if (exportFormat === 'excel') {
            const headers = [
                'ID JURNAL',
                'TANGGAL',
                'NO DOKUMEN',
                'KATEGORI',
                'DESKRIPSI',
                'POSTED BY',
                'KODE AKUN',
                'NAMA AKUN',
                'DEBET (IDR)',
                'KREDIT (IDR)',
            ];

            const rows: string[][] = [];
            targetData.forEach((j) => {
                const categoryText =
                    j.category === 'sales'
                        ? 'Jurnal Penjualan'
                        : j.category === 'cash_in'
                          ? 'Penerimaan Kas'
                          : j.category === 'purchase'
                            ? 'Jurnal Pembelian'
                            : j.category === 'cash_out'
                              ? 'Pengeluaran Kas'
                              : 'Penyesuaian';

                j.lines.forEach((l) => {
                    rows.push([
                        `"${j.id}"`,
                        `"${j.date}"`,
                        `"${j.docNo}"`,
                        `"${categoryText}"`,
                        `"${j.description.replace(/"/g, '""')}"`,
                        `"${j.postedBy}"`,
                        `"${l.accountCode}"`,
                        `"${l.accountName.replace(/"/g, '""')}"`,
                        l.debit ? String(l.debit) : '0',
                        l.credit ? String(l.credit) : '0',
                    ]);
                });
            });

            const csvContent =
                '\uFEFF' +
                [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `Laporan_Jurnal_Umum_YouSee_${new Date().toISOString().split('T')[0]}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setExportModalOpen(false);
            setSuccessAlert(
                `Berhasil mengexport ${targetData.length} entri jurnal ke format Excel (.csv).`,
            );
            setTimeout(() => setSuccessAlert(null), 5000);
        } else {
            // Direct PDF Download via html2pdf.js (without opening preview tab)
            const monthNames = [
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
            const periodLabel =
                selectedMonth === 'all'
                    ? `Tahun ${selectedYear}`
                    : `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;

            let tableRowsHtml = '';
            targetData.forEach((j) => {
                j.lines.forEach((l, index) => {
                    tableRowsHtml += `
                        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
                            ${index === 0 ? `<td rowspan="${j.lines.length}" style="padding: 6px; vertical-align: top; font-weight: bold; border-right: 1px solid #e2e8f0;">${j.id}<br/><span style="font-size: 9px; color: #64748b;">${j.date}</span></td>` : ''}
                            ${index === 0 ? `<td rowspan="${j.lines.length}" style="padding: 6px; vertical-align: top; border-right: 1px solid #e2e8f0;"><strong>${j.docNo}</strong><br/><span style="font-size: 9px; color: #475569;">${j.description}</span></td>` : ''}
                            <td style="padding: 6px; font-family: monospace; font-weight: bold; text-align: center;">${l.accountCode}</td>
                            <td style="padding: 6px;">${l.accountName}</td>
                            <td style="padding: 6px; text-align: right; font-family: monospace; font-weight: bold; color: #047857;">${l.debit ? 'Rp ' + l.debit.toLocaleString('id-ID') : '-'}</td>
                            <td style="padding: 6px; text-align: right; font-family: monospace; font-weight: bold; color: #1d4ed8;">${l.credit ? 'Rp ' + l.credit.toLocaleString('id-ID') : '-'}</td>
                        </tr>
                    `;
                });
            });

            const element = document.createElement('div');
            element.style.padding = '20px';
            element.style.backgroundColor = '#ffffff';
            element.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
                    <div>
                        <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a;">PT. YOUSEE INDONESIA</h1>
                        <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Laporan Buku Jurnal Umum (General Ledger) · Periode: ${periodLabel} · Mode ${isPPN ? 'PPN 11%' : 'Non-PPN'}</div>
                    </div>
                    <div>
                        <span style="background: #0f172a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: bold;">REKAP RESMI AKUN</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div>
                        <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">TOTAL ENTRI JURNAL</span>
                        <span style="font-size: 14px; font-weight: bold; font-family: monospace; color: #0f172a;">${targetData.length} Transaksi</span>
                    </div>
                    <div>
                        <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">TOTAL DEBET</span>
                        <span style="font-size: 14px; font-weight: bold; font-family: monospace; color: #047857;">${fmt(totalDebit)}</span>
                    </div>
                    <div>
                        <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">TOTAL KREDIT</span>
                        <span style="font-size: 14px; font-weight: bold; font-family: monospace; color: #1d4ed8;">${fmt(totalCredit)}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569;">
                            <th style="width: 100px; padding: 8px; text-align: left;">ID & Tanggal</th>
                            <th style="padding: 8px; text-align: left;">No. Dokumen & Keterangan</th>
                            <th style="width: 70px; padding: 8px; text-align: center;">Kode</th>
                            <th style="padding: 8px; text-align: left;">Nama Akun COA</th>
                            <th style="width: 110px; padding: 8px; text-align: right;">Debet</th>
                            <th style="width: 110px; padding: 8px; text-align: right;">Kredit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            `;

            document.body.appendChild(element);

            const filename = `Laporan_Jurnal_Umum_YouSee_${selectedMonth === 'all' ? selectedYear : `${selectedYear}-${selectedMonth}`}.pdf`;
            const opt = {
                margin: 8,
                filename: filename,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'landscape' as const,
                },
            };

            // @ts-ignore
            html2pdf()
                .set(opt)
                .from(element)
                .save()
                .then(() => {
                    document.body.removeChild(element);
                    setExportModalOpen(false);
                    setSuccessAlert(
                        `Berhasil mengunduh Laporan Jurnal Umum (${filename})`,
                    );
                    setTimeout(() => setSuccessAlert(null), 5000);
                });
        }
    };

    // Print Single Voucher Handler
    const handlePrintSingleVoucher = (j: JournalEntryData) => {
        const element = document.createElement('div');
        element.style.padding = '24px';
        element.style.backgroundColor = '#ffffff';

        let rowsHtml = '';
        let totalDeb = 0;
        let totalCred = 0;
        j.lines.forEach((l) => {
            totalDeb += l.debit;
            totalCred += l.credit;
            rowsHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                    <td style="padding: 10px; font-family: monospace; font-weight: bold; text-align: center;">${l.accountCode}</td>
                    <td style="padding: 10px; font-weight: bold; color: #0f172a;">${l.accountName}</td>
                    <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold; color: #047857;">${l.debit ? 'Rp ' + l.debit.toLocaleString('id-ID') : '-'}</td>
                    <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold; color: #1d4ed8;">${l.credit ? 'Rp ' + l.credit.toLocaleString('id-ID') : '-'}</td>
                </tr>
            `;
        });

        element.innerHTML = `
            <div style="border: 2px solid #0f172a; border-radius: 12px; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
                    <div>
                        <h2 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a;">PT. YOUSEE INDONESIA</h2>
                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">BUKTI VOUCHER JURNAL UMUM</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: #0f172a;">${j.id}</div>
                        <div style="font-size: 11px; color: #64748b; font-family: monospace;">Ref: ${j.docNo}</div>
                    </div>
                </div>

                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #64748b; font-weight: 500;">Tanggal Transaksi:</span>
                        <span style="font-weight: bold; color: #0f172a;">${formatDateIndo(j.date)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #64748b; font-weight: 500;">Nomor Dokumen Acuan:</span>
                        <span style="font-weight: bold; font-family: monospace; color: #0f172a;">${j.docNo}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #64748b; font-weight: 500;">Keterangan / Deskripsi:</span>
                        <span style="font-weight: bold; color: #0f172a;">${j.description}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569;">
                            <th style="width: 80px; padding: 8px; text-align: center;">Kode Akun</th>
                            <th style="padding: 8px; text-align: left;">Nama Akun Keuangan</th>
                            <th style="width: 120px; padding: 8px; text-align: right;">Debet</th>
                            <th style="width: 120px; padding: 8px; text-align: right;">Kredit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1; font-size: 11px;">
                            <td colspan="2" style="padding: 10px; text-align: right; text-transform: uppercase;">Total Voucher:</td>
                            <td style="padding: 10px; text-align: right; font-family: monospace; color: #047857;">Rp ${totalDeb.toLocaleString('id-ID')}</td>
                            <td style="padding: 10px; text-align: right; font-family: monospace; color: #1d4ed8;">Rp ${totalCred.toLocaleString('id-ID')}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; font-size: 11px; margin-top: 40px;">
                    <div>
                        <div style="color: #64748b; font-weight: bold; margin-bottom: 40px;">Dibuat Oleh,</div>
                        <div style="font-weight: bold; color: #0f172a; text-decoration: underline;">${j.postedBy}</div>
                        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Staff Akuntansi</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-weight: bold; margin-bottom: 40px;">Diperiksa Oleh,</div>
                        <div style="font-weight: bold; color: #0f172a; text-decoration: underline;">Indung Sukma</div>
                        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Finance Manager</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-weight: bold; margin-bottom: 40px;">Disetujui Oleh,</div>
                        <div style="font-weight: bold; color: #0f172a; text-decoration: underline;">Pimpinan YouSee</div>
                        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Direktur Utama</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(element);
        const filename = `Voucher_Jurnal_${j.id}_${j.docNo}.pdf`;
        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait' as const,
            },
        };

        // @ts-ignore
        html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                document.body.removeChild(element);
                setVoucherModal(null);
                setSuccessAlert(`Voucher PDF #${j.id} berhasil diunduh.`);
                setTimeout(() => setSuccessAlert(null), 5000);
            });
    };

    // Action Items for COA
    const getCoaActionItems = (acc: AccountCOA): ActionMenuItem[] => {
        return [
            {
                label: acc.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
                icon: (
                    <svg
                        className="h-4 w-4 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                ),
                onClick: () => {
                    setCoaList((prev) =>
                        prev.map((a) =>
                            a.code === acc.code
                                ? { ...a, isActive: !a.isActive }
                                : a,
                        ),
                    );
                },
            },
        ];
    };

    return (
        <AppLayout
            activePage="journal"
            title="Laporan Jurnal Umum"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Accounting' },
                { label: 'Jurnal Umum' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Header Section */}
                <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-bold tracking-tight text-slate-900">
                                Laporan Jurnal Umum (General Ledger)
                            </h2>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isPPN ? 'border border-blue-200 bg-blue-100 text-blue-800' : 'border border-slate-200 bg-slate-100 text-slate-700'}`}
                            >
                                Mode {isPPN ? 'PPN 11%' : 'Non-PPN'}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Buku pembantu catatan transaksi ganda otomatis dan
                            jurnal penyesuaian akuntansi YouSee.
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsAuditLogModalOpen(true)}
                            title="Riwayat Jejak Audit & Log Aktivitas Jurnal Akuntansi"
                            className="shadow-xs inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>

                        <button
                            onClick={() => setExportModalOpen(true)}
                            className="shadow-2xs flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                        >
                            <svg
                                className="h-4 w-4 text-slate-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Export Jurnal</span>
                        </button>

                        <button
                            onClick={() => setAddJournalModal(true)}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800"
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            <span>Jurnal Penyesuaian</span>
                        </button>
                    </div>
                </div>

                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="animate-fade-in shadow-2xs flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition-all">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
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
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="text-xs font-bold leading-tight text-emerald-900">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Metric Summary Cards (4 Grid) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            TOTAL ENTRI JURNAL
                        </span>
                        <span className="block font-mono text-2xl font-bold text-slate-900">
                            {filteredJournals.length} Entri
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Termasuk transaksi otomatis & manual
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            TOTAL DEBET PERIODE INI
                        </span>
                        <span className="block font-mono text-2xl font-bold text-emerald-700">
                            {fmt(totalDebit)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Sisi debet seluruh akun neraca/laba rugi
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            TOTAL KREDIT PERIODE INI
                        </span>
                        <span className="block font-mono text-2xl font-bold text-blue-700">
                            {fmt(totalCredit)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Sisi kredit seluruh akun neraca/laba rugi
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                STATUS KESEIMBANGAN
                            </span>
                            <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isBalanced ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
                            >
                                {isBalanced ? '✓ Balanced' : '⚠ Imbalanced'}
                            </span>
                        </div>
                        <span
                            className={`block font-mono text-xl font-bold ${isBalanced ? 'text-emerald-700' : 'text-rose-600'}`}
                        >
                            {isBalanced
                                ? 'DEBET = KREDIT'
                                : 'SELISIH D/K DETEKSI'}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            {isBalanced
                                ? 'Seluruh jurnal berimbang sempurna'
                                : `Selisih: ${fmt(Math.abs(totalDebit - totalCredit))}`}
                        </span>
                    </div>
                </div>

                {/* Filter & Control Panel Bar */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-5">
                        {/* Search Input */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Pencarian Jurnal
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Cari No. Jurnal, No. Dokumen, atau Deskripsi..."
                                    className="shadow-2xs w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all focus:border-primary focus:outline-none"
                                />
                                <svg
                                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Filter Kategori */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Kategori Jurnal
                            </label>
                            <SelectInput
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                options={[
                                    {
                                        value: 'all',
                                        label: 'Semua Kategori',
                                    },
                                    {
                                        value: 'sales',
                                        label: 'Jurnal Penjualan',
                                    },
                                    {
                                        value: 'cash_in',
                                        label: 'Penerimaan Kas',
                                    },
                                    {
                                        value: 'purchase',
                                        label: 'Jurnal Pembelian',
                                    },
                                    {
                                        value: 'cash_out',
                                        label: 'Pengeluaran Kas',
                                    },
                                    {
                                        value: 'adjustment',
                                        label: 'Penyesuaian (Manual)',
                                    },
                                ]}
                            />
                        </div>

                        {/* Filter Akun COA */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Filter Kode Akun
                            </label>
                            <SelectInput
                                value={accountFilter}
                                onChange={(e) => {
                                    setAccountFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                options={[
                                    {
                                        value: 'all',
                                        label: 'Semua Akun (COA)',
                                    },
                                    ...coaList.map((a) => ({
                                        value: a.code,
                                        label: `${a.code} - ${a.name}`,
                                    })),
                                ]}
                            />
                        </div>

                        {/* Filter Periode Bulan & Tahun (MonthPicker) */}
                        <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Periode Bulan &amp; Tahun
                            </label>
                            <MonthPicker
                                value={
                                    selectedYear !== 'all' &&
                                    selectedMonth !== 'all'
                                        ? `${selectedYear}-${selectedMonth}`
                                        : 'all'
                                }
                                onChange={(_val, yr, mo) => {
                                    setSelectedYear(yr);
                                    setSelectedMonth(mo);
                                    setCurrentPage(1);
                                }}
                                allowAll={true}
                                allLabel="Semua Periode"
                                className="w-full [&>button]:w-full [&>button]:justify-between [&>button]:py-2.5"
                            />
                        </div>
                    </div>
                </div>

                {/* Double-Entry Journal Table */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="w-36 px-6 py-4">
                                        Tanggal / JRN ID
                                    </th>
                                    <th className="w-40 px-6 py-4">
                                        Dokumen Ref
                                    </th>
                                    <th className="px-6 py-4">
                                        Kode & Nama Akun (COA) / Keterangan
                                    </th>
                                    <th className="w-44 px-6 py-4 text-right">
                                        Debet (IDR)
                                    </th>
                                    <th className="w-44 px-6 py-4 text-right">
                                        Kredit (IDR)
                                    </th>
                                    <th className="w-24 px-6 py-4 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedJournals.map((j) => {
                                    const journalTotalDeb = j.lines.reduce(
                                        (s, l) => s + l.debit,
                                        0,
                                    );
                                    const journalTotalCred = j.lines.reduce(
                                        (s, l) => s + l.credit,
                                        0,
                                    );
                                    return (
                                        <React.Fragment key={j.id}>
                                            {/* Header Row per Journal Entry */}
                                            <tr className="border-t border-slate-200/60 bg-slate-50/60">
                                                <td className="whitespace-nowrap px-6 py-3">
                                                    <div className="font-bold text-slate-900">
                                                        {formatDateIndo(j.date)}
                                                    </div>
                                                    <div className="font-mono text-[10px] font-bold text-blue-600">
                                                        {j.id}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3">
                                                    <div className="font-mono font-bold text-slate-800">
                                                        {j.docNo}
                                                    </div>
                                                    {j.refNo && (
                                                        <div className="text-[10px] font-medium text-slate-400">
                                                            {j.refNo}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="mb-0.5 flex items-center gap-2">
                                                        <span className="font-bold text-slate-900">
                                                            {j.description}
                                                        </span>
                                                        {getCategoryBadge(
                                                            j.category,
                                                        )}
                                                        {j.isReversed && (
                                                            <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[9.5px] font-bold text-rose-800">
                                                                Reversing Entry
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        Diposting oleh:{' '}
                                                        {j.postedBy}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-xs font-bold text-slate-500">
                                                    {fmt(journalTotalDeb)}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-xs font-bold text-slate-500">
                                                    {fmt(journalTotalCred)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3 text-center">
                                                    <ActionDropdown
                                                        items={getJournalActionItems(
                                                            j,
                                                        )}
                                                    />
                                                </td>
                                            </tr>

                                            {/* Line Items for Double Entry */}
                                            {j.lines.map((line, lIdx) => {
                                                const isCreditLine =
                                                    line.credit > 0 &&
                                                    line.debit === 0;
                                                return (
                                                    <tr
                                                        key={lIdx}
                                                        className="transition-colors hover:bg-slate-50/40"
                                                    >
                                                        <td className="px-6 py-2.5"></td>
                                                        <td className="px-6 py-2.5"></td>
                                                        <td className="px-6 py-2.5">
                                                            <div
                                                                className={`flex items-center gap-3 ${isCreditLine ? 'pl-8 text-slate-600' : 'text-slate-800'}`}
                                                            >
                                                                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-slate-600">
                                                                    {
                                                                        line.accountCode
                                                                    }
                                                                </span>
                                                                <span
                                                                    className={
                                                                        isCreditLine
                                                                            ? 'font-semibold'
                                                                            : 'font-bold text-slate-900'
                                                                    }
                                                                >
                                                                    {
                                                                        line.accountName
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-2.5 text-right font-mono font-bold text-slate-900">
                                                            {line.debit > 0
                                                                ? fmt(
                                                                      line.debit,
                                                                  )
                                                                : '—'}
                                                        </td>
                                                        <td className="px-6 py-2.5 text-right font-mono font-bold text-slate-900">
                                                            {line.credit > 0
                                                                ? fmt(
                                                                      line.credit,
                                                                  )
                                                                : '—'}
                                                        </td>
                                                        <td className="px-6 py-2.5"></td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}

                                {filteredJournals.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center"
                                        >
                                            <EmptyState
                                                title="Belum Ada Jurnal"
                                                description="Tidak ditemukan entri jurnal umum yang sesuai dengan filter atau pencarian Anda."
                                            />
                                        </td>
                                    </tr>
                                )}

                                {/* Balanced Total Footer */}
                                {filteredJournals.length > 0 && (
                                    <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                                        <td
                                            colSpan={3}
                                            className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-700"
                                        >
                                            <div className="flex items-center justify-end gap-2">
                                                <span>
                                                    TOTAL ENTRI JURNAL PERIODE
                                                    INI:
                                                </span>
                                                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                                    ✓ BALANCED
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm font-bold text-emerald-700">
                                            {fmt(totalDebit)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm font-bold text-blue-700">
                                            {fmt(totalCredit)}
                                        </td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredJournals.length > 0 && (
                        <div className="border-t border-slate-100 p-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(
                                    filteredJournals.length / ITEMS_PER_PAGE,
                                )}
                                totalItems={filteredJournals.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: DETAIL VOUCHER JURNAL */}
            {voucherModal && voucherModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setVoucherModal(null)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Bukti Voucher Jurnal Umum
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    {voucherModal.item.id} ·{' '}
                                    {voucherModal.item.docNo}
                                </p>
                            </div>
                            <button
                                onClick={() => setVoucherModal(null)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-5 p-6 text-slate-800">
                            {/* Header Voucher Card */}
                            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-500">
                                        Tanggal Transaksi:
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {formatDateIndo(voucherModal.item.date)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-500">
                                        Nomor Dokumen Acuan:
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                        {voucherModal.item.docNo}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-500">
                                        Kategori Jurnal:
                                    </span>
                                    <div>
                                        {getCategoryBadge(
                                            voucherModal.item.category,
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                                    <span className="font-medium text-slate-500">
                                        Keterangan / Deskripsi:
                                    </span>
                                    <span className="max-w-[340px] text-right font-bold text-slate-900">
                                        {voucherModal.item.description}
                                    </span>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div className="overflow-hidden rounded-xl border border-slate-200/80">
                                <table className="w-full text-xs">
                                    <thead className="border-b border-slate-200 bg-slate-100 font-bold text-slate-700">
                                        <tr>
                                            <th className="px-4 py-2.5">
                                                Kode Akun
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Nama Akun
                                            </th>
                                            <th className="px-4 py-2.5 text-right">
                                                Debet
                                            </th>
                                            <th className="px-4 py-2.5 text-right">
                                                Kredit
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {voucherModal.item.lines.map(
                                            (l, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                                                        {l.accountCode}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-bold text-slate-800">
                                                        {l.accountName}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                                                        {l.debit > 0
                                                            ? fmt(l.debit)
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700">
                                                        {l.credit > 0
                                                            ? fmt(l.credit)
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                    <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="px-4 py-2.5 text-right text-[10px] uppercase"
                                            >
                                                Total Voucher
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-emerald-800">
                                                {fmt(
                                                    voucherModal.item.lines.reduce(
                                                        (s, l) => s + l.debit,
                                                        0,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-blue-800">
                                                {fmt(
                                                    voucherModal.item.lines.reduce(
                                                        (s, l) => s + l.credit,
                                                        0,
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Printable Signatures */}
                            <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs text-slate-500">
                                <div className="space-y-8 border-t border-slate-200 pt-2">
                                    <span>Dibuat Oleh</span>
                                    <div className="font-bold text-slate-900">
                                        {voucherModal.item.postedBy}
                                    </div>
                                </div>
                                <div className="space-y-8 border-t border-slate-200 pt-2">
                                    <span>Diperiksa Oleh</span>
                                    <div className="font-bold text-slate-900">
                                        Indung Sukma
                                    </div>
                                </div>
                                <div className="space-y-8 border-t border-slate-200 pt-2">
                                    <span>Disetujui (Direktur)</span>
                                    <div className="font-bold text-slate-900">
                                        Pimpinan YouSee
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    onClick={() => setVoucherModal(null)}
                                    className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={() =>
                                        handlePrintSingleVoucher(
                                            voucherModal.item,
                                        )
                                    }
                                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
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
                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                        />
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
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setAddJournalModal(false)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Buat Jurnal Penyesuaian Baru (Manual)
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    Input entri jurnal ganda (Debet & Kredit
                                    wajib berimbang)
                                </p>
                            </div>
                            <button
                                onClick={() => setAddJournalModal(false)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveNewJournal}
                            className="space-y-4 p-6 text-xs"
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Tanggal Transaksi
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={newDate}
                                        onChange={(e) =>
                                            setNewDate(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        No. Dokumen Acuan
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: ADJ-2026-002"
                                        value={newDocNo}
                                        onChange={(e) =>
                                            setNewDocNo(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Kategori Jurnal
                                    </label>
                                    <SelectInput
                                        value={newCategory}
                                        onChange={(e) =>
                                            setNewCategory(
                                                e.target
                                                    .value as JournalCategory,
                                            )
                                        }
                                        options={[
                                            {
                                                value: 'adjustment',
                                                label: 'Penyesuaian',
                                            },
                                            {
                                                value: 'sales',
                                                label: 'Jurnal Penjualan',
                                            },
                                            {
                                                value: 'purchase',
                                                label: 'Jurnal Pembelian',
                                            },
                                            {
                                                value: 'cash_in',
                                                label: 'Penerimaan Kas',
                                            },
                                            {
                                                value: 'cash_out',
                                                label: 'Pengeluaran Kas',
                                            },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Keterangan Jurnal
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Deskripsi transaksi penyesuaian..."
                                    value={newDescription}
                                    onChange={(e) =>
                                        setNewDescription(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            {/* Dynamic Lines */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Rincian Akun & Nominal (COA)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddJournalLine}
                                        className="flex cursor-pointer items-center gap-1 text-xs font-bold text-primary hover:text-primary-700"
                                    >
                                        + Tambah Baris Akun
                                    </button>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                                    {newLines.map((line, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-12 items-center gap-2"
                                        >
                                            <div className="col-span-7">
                                                <SelectInput
                                                    value={line.accountCode}
                                                    onChange={(e) =>
                                                        handleLineAccountSelect(
                                                            idx,
                                                            e.target.value,
                                                        )
                                                    }
                                                    options={coaList.map(
                                                        (a) => ({
                                                            value: a.code,
                                                            label: `${a.code} - ${a.name}`,
                                                        }),
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Debet"
                                                    min="0"
                                                    value={line.debit || ''}
                                                    onChange={(e) =>
                                                        handleLineChange(
                                                            idx,
                                                            'debit',
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-right font-mono text-xs font-bold text-emerald-700"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Kredit"
                                                    min="0"
                                                    value={line.credit || ''}
                                                    onChange={(e) =>
                                                        handleLineChange(
                                                            idx,
                                                            'credit',
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-right font-mono text-xs font-bold text-blue-700"
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveJournalLine(
                                                            idx,
                                                        )
                                                    }
                                                    className="cursor-pointer text-sm font-bold text-rose-500 hover:text-rose-700"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Balance Validator */}
                            <div
                                className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold ${
                                    isNewJournalBalanced
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                        : 'border-rose-200 bg-rose-50 text-rose-900'
                                }`}
                            >
                                <div>
                                    <span>Status Keseimbangan Form: </span>
                                    <span>
                                        {isNewJournalBalanced
                                            ? '✓ Berimbang (Balanced)'
                                            : '⚠ Tidak Berimbang (Imbalanced)'}
                                    </span>
                                </div>
                                <div className="space-x-3 font-mono">
                                    <span>D: {fmt(newJournalDebitTotal)}</span>
                                    <span>K: {fmt(newJournalCreditTotal)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setAddJournalModal(false)}
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!isNewJournalBalanced}
                                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold shadow-neon-primary transition-all ${
                                        isNewJournalBalanced
                                            ? 'cursor-pointer bg-primary text-white hover:bg-primary-700'
                                            : 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none'
                                    }`}
                                >
                                    Simpan Jurnal Penyesuaian
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EXPORT JURNAL (PDF & EXCEL) */}
            {exportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setExportModalOpen(false)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Export Laporan Jurnal Umum
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    Unduh rekap transaksi jurnal berimbang (PDF
                                    & Excel)
                                </p>
                            </div>
                            <button
                                onClick={() => setExportModalOpen(false)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-5 p-6 text-xs text-slate-800">
                            {/* Pilihan Format Export */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    1. Format Dokumen
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat('excel')}
                                        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
                                            exportFormat === 'excel'
                                                ? 'shadow-xs border-emerald-500 bg-emerald-50/60 font-bold text-emerald-900'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <svg
                                            className="h-6 w-6 text-emerald-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span className="font-bold">
                                            Excel (.csv)
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setExportFormat('pdf')}
                                        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
                                            exportFormat === 'pdf'
                                                ? 'shadow-xs border-rose-500 bg-rose-50/60 font-bold text-rose-900'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <svg
                                            className="h-6 w-6 text-rose-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span className="font-bold">
                                            PDF Dokumen
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Info Filter Aktif */}
                            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-blue-900">
                                <svg
                                    className="h-5 w-5 shrink-0 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="text-[11px] leading-tight">
                                    <span className="block font-bold">
                                        Mengikuti Filter Aktif
                                    </span>
                                    <span className="text-blue-700">
                                        Total{' '}
                                        <strong className="font-bold">
                                            {filteredJournals.length} entri
                                            jurnal
                                        </strong>{' '}
                                        akan diexport sesuai filter periode &
                                        kata kunci saat ini.
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setExportModalOpen(false)}
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecuteExport}
                                    className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:bg-primary-800"
                                >
                                    Unduh{' '}
                                    {exportFormat === 'excel'
                                        ? 'Excel (.csv)'
                                        : 'PDF'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Jejak Audit & Riwayat Jurnal Akuntansi */}
            <AuditLogModal
                show={isAuditLogModalOpen}
                onClose={() => setIsAuditLogModalOpen(false)}
                title="Jejak Audit & Log Aktivitas Jurnal Akuntansi"
                subtitle="Riwayat audit posting otomatis jurnal piutang, hutang, pengeluaran kas, pembalikan (reversal), dan penyesuaian akun COA"
                logs={auditLogs}
                eventOptions={[
                    { value: 'all', label: 'Semua Jenis Aktivitas' },
                    {
                        value: 'created',
                        label: '🟢 Posting Jurnal Baru (Created)',
                    },
                    {
                        value: 'reversal',
                        label: '🔄 Jurnal Pembalik (Reversed)',
                    },
                    {
                        value: 'updated',
                        label: '🟡 Perubahan Akun COA (Updated)',
                    },
                ]}
            />
        </AppLayout>
    );
}
