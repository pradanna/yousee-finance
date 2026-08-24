import { AuditLogItem } from '@/Components/UI/AuditLogModal';

export interface PpnKeluaranItem {
    id: string;
    docNo: string;
    nsfp: string; // Nomor Seri Faktur Pajak
    client: string;
    npwp: string;
    projectName?: string;
    projectCode?: string;
    date: string;
    dpp: number;
    ppn: number;
    total: number;
    efakturStatus: 'approved' | 'ready' | 'draft';
}

export interface PpnMasukanItem {
    id: string;
    docNo: string;
    nsfp: string;
    vendor: string;
    npwp: string;
    projectName?: string;
    projectCode?: string;
    date: string;
    dpp: number;
    ppn: number;
    total: number;
    creditableStatus: 'creditable' | 'non_creditable';
    efakturStatus: 'approved' | 'ready' | 'draft';
}

export interface TaxSettlementRecord {
    id?: string;
    month?: number;
    year?: number;
    taxPeriod: string; // e.g. "Masa 06-2026"
    ppnKeluaranTotal: number;
    ppnMasukanTotal: number;
    netAmount: number; // Positive = Kurang Bayar, Negative = Lebih Bayar
    status: 'paid' | 'unpaid' | 'compensated';
    ntpn?: string;
    paidDate?: string;
    bankName?: string;
    notes?: string;
}

export interface NsfpModalState {
    isOpen: boolean;
    item: PpnKeluaranItem | PpnMasukanItem;
    type: 'keluaran' | 'masukan';
}

export interface DetailModalState {
    item: PpnKeluaranItem | PpnMasukanItem;
    type: 'keluaran' | 'masukan';
}

export interface LockedPeriodRecord {
    month: number;
    year: number;
}

export interface PpnReportProps {
    initialPpnKeluaran?: PpnKeluaranItem[];
    initialPpnMasukan?: PpnMasukanItem[];
    initialTaxSettlements?: TaxSettlementRecord[];
    lockedPeriods?: LockedPeriodRecord[];
    auditLogs?: AuditLogItem[];
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
