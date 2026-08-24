export type CashflowType = 'inflow' | 'outflow';
export type ActivityCategory =
    | 'operating'
    | 'investing'
    | 'financing'
    | 'transfer';

export interface CashflowEntry {
    id: string;
    uuid: string;
    journalId: string;
    date: string;
    refNo: string;
    docNo: string;
    accountCode: string;
    accountName: string;
    contraCode: string;
    contraName: string;
    description: string;
    partnerName: string;
    projectName?: string | null;
    projectCode?: string | null;
    type: CashflowType;
    category: ActivityCategory;
    amount: number;
    runningBalance?: number;
    isInternalTransfer: boolean;
}

export interface BankAccountBalance {
    id: string;
    code: string;
    bankName: string;
    accountNumber: string;
    holderName: string;
    beginningBalance: number;
    inflowTotal: number;
    outflowTotal: number;
    currentBalance: number;
}

export interface PsakCashflowSummary {
    operatingClientIn: number;
    operatingOtherIn: number;
    totalOperatingIn: number;
    operatingVendorOut: number;
    operatingDirectExpenseOut: number;
    operatingTaxOut: number;
    totalOperatingOut: number;
    netOperating: number;
    investingAssetIn: number;
    investingAssetOut: number;
    netInvesting: number;
    financingCapitalIn: number;
    financingPriveOut: number;
    netFinancing: number;
    netCashMovement: number;
    beginningBalance: number;
    endingBalance: number;
}

export interface CashflowReportData {
    entries: CashflowEntry[];
    bankAccounts: BankAccountBalance[];
    beginningBalance: number;
    totalInflow: number;
    totalOutflow: number;
    endingBalance: number;
    psak: PsakCashflowSummary;
    periodLabel: string;
    selectedMonth: string;
    selectedYear: string;
    startDate: string;
    endDate: string;
    fiscalMode: string;
}

export interface LockedPeriodRecord {
    month: number;
    year: number;
    fiscalMode: string;
    closedAt: string | null;
}

export interface ProjectOption {
    id: string;
    code: string;
    name: string;
}

export interface AuditLogItem {
    id: string;
    event: string;
    description: string;
    userName: string;
    createdAt: string;
}

export interface CashflowReportProps {
    initialCashflowData: CashflowReportData;
    lockedPeriods?: LockedPeriodRecord[];
    projects?: ProjectOption[];
    auditLogs?: AuditLogItem[];
    currentFiscalMode?: string;
}

export const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

export const formatDateIndo = (dateStr: string) => {
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
