/**
 * Standard Indonesian NPWP Formatter
 * Format 15-digit: 01.234.567.8-901.000
 * Format 16-digit: 01.234.567.8-901.0000
 */
export function formatNpwp(value: string): string {
    if (!value) return '';

    // Strip all non-digit characters and limit to 16 digits
    const digits = value.replace(/\D/g, '').slice(0, 16);
    if (!digits) return '';

    let formatted = '';

    // Segment 1: 2 digits (##)
    if (digits.length > 0) {
        formatted += digits.substring(0, Math.min(2, digits.length));
    }

    // Segment 2: 3 digits (.###)
    if (digits.length > 2) {
        formatted += '.' + digits.substring(2, Math.min(5, digits.length));
    }

    // Segment 3: 3 digits (.###)
    if (digits.length > 5) {
        formatted += '.' + digits.substring(5, Math.min(8, digits.length));
    }

    // Segment 4: 1 digit (.#)
    if (digits.length > 8) {
        formatted += '.' + digits.substring(8, Math.min(9, digits.length));
    }

    // Segment 5: 3 digits (-###)
    if (digits.length > 9) {
        formatted += '-' + digits.substring(9, Math.min(12, digits.length));
    }

    // Segment 6: 3 or 4 digits (.### or .####)
    if (digits.length > 12) {
        formatted += '.' + digits.substring(12, digits.length);
    }

    return formatted;
}

/**
 * Format number to Indonesian Rupiah currency string
 */
export function formatRupiah(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `IDR ${Math.round(num).toLocaleString('id-ID')}`;
}

/**
 * Converts Indonesian phone number to international WhatsApp format (e.g. 0812... -> 62812...)
 */
export function formatPhoneWhatsApp(phone?: string | null): string {
    if (!phone) return '';

    // Remove all non-numeric characters except leading +
    let cleaned = phone.replace(/[^0-9+]/g, '');

    // Remove leading '+'
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }

    // If starts with '0', replace with '62'
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        // If someone typed 812... without 0
        cleaned = '62' + cleaned;
    }

    return cleaned;
}

/**
 * Generates direct WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(
    phone?: string | null,
    message?: string,
): string | null {
    const waNumber = formatPhoneWhatsApp(phone);
    if (!waNumber || waNumber.length < 9) return null;

    const base = `https://wa.me/${waNumber}`;
    if (message) {
        return `${base}?text=${encodeURIComponent(message)}`;
    }
    return base;
}

const INDO_MONTHS_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

const INDO_MONTHS_FULL = [
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

/**
 * Format date string (YYYY-MM-DD or ISO) to Indonesian date (e.g., "12 Maret 2026" or "12 Mar 2026")
 */
export function formatIndoDate(
    dateStr?: string | null,
    shortMonth = false,
): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = shortMonth
        ? INDO_MONTHS_SHORT[date.getMonth()]
        : INDO_MONTHS_FULL[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

/**
 * Format campaign date range to standard Indonesian period string
 * e.g., "01 Jan 2026 - 31 Mar 2026" or "01 - 31 Januari 2026"
 */
export function formatIndoPeriod(
    startStr?: string | null,
    endStr?: string | null,
): { label: string; duration: string } {
    if (!startStr && !endStr) return { label: '-', duration: '' };
    if (!startStr) return { label: formatIndoDate(endStr), duration: '' };
    if (!endStr) return { label: formatIndoDate(startStr), duration: '' };

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return { label: `${startStr} - ${endStr}`, duration: '' };
    }

    const startDay = String(start.getDate()).padStart(2, '0');
    const startMonth = INDO_MONTHS_SHORT[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = String(end.getDate()).padStart(2, '0');
    const endMonth = INDO_MONTHS_SHORT[end.getMonth()];
    const endYear = end.getFullYear();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;

    let label = '';
    if (startYear === endYear && start.getMonth() === end.getMonth()) {
        label = `${startDay} - ${endDay} ${INDO_MONTHS_FULL[start.getMonth()]} ${startYear}`;
    } else if (startYear === endYear) {
        label = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
    } else {
        label = `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }

    const duration =
        months > 1 ? `${months} Bulan (${diffDays} Hari)` : `${diffDays} Hari`;

    return { label, duration };
}

/**
 * Alias for formatIndoPeriod to provide consistent API across all menus
 */
export const formatPeriod = formatIndoPeriod;

/**
 * Calculate campaign runtime / airtime progress (Masa Tayang)
 */
export function calcPeriodProgress(
    startDate?: string | null,
    endDate?: string | null,
    status?: string | null,
): {
    percent: number;
    daysPassed: number;
    totalDays: number;
    daysLeft: number;
    label: string;
    state: 'upcoming' | 'running' | 'completed' | 'invalid';
    barClass: string;
    textClass: string;
    badgeBg: string;
} {
    if (status === 'Completed' || status === 'completed') {
        return {
            percent: 100,
            daysPassed: 0,
            totalDays: 0,
            daysLeft: 0,
            label: 'Masa Tayang Selesai',
            state: 'completed',
            barClass: 'bg-emerald-500',
            textClass: 'text-emerald-700 font-bold',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }

    if (!startDate || !endDate) {
        return {
            percent: 0,
            daysPassed: 0,
            totalDays: 0,
            daysLeft: 0,
            label: 'Belum Ada Jadwal',
            state: 'invalid',
            barClass: 'bg-slate-200',
            textClass: 'text-slate-400 font-medium',
            badgeBg: 'bg-slate-50 text-slate-500 border-slate-200',
        };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return {
            percent: 0,
            daysPassed: 0,
            totalDays: 0,
            daysLeft: 0,
            label: 'Periode Tidak Valid',
            state: 'invalid',
            barClass: 'bg-slate-200',
            textClass: 'text-slate-400 font-medium',
            badgeBg: 'bg-slate-50 text-slate-500 border-slate-200',
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const totalDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Belum mulai (Upcoming)
    if (today < start) {
        const daysToStart = Math.ceil(
            (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
            percent: 0,
            daysPassed: 0,
            totalDays,
            daysLeft: totalDays,
            label: `Mulai dalam ${daysToStart} hari`,
            state: 'upcoming',
            barClass: 'bg-amber-400',
            textClass: 'text-amber-700 font-bold',
            badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }

    // Sudah lewat masa tayang (Expired/Completed)
    if (today > end) {
        return {
            percent: 100,
            daysPassed: totalDays,
            totalDays,
            daysLeft: 0,
            label: 'Masa Tayang Lewat',
            state: 'completed',
            barClass: 'bg-slate-500',
            textClass: 'text-slate-700 font-bold',
            badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }

    // Sedang berjalan (Running)
    const daysPassed =
        Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
    const daysLeft = Math.max(
        0,
        Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const percent = Math.min(100, Math.round((daysPassed / totalDays) * 100));

    return {
        percent,
        daysPassed,
        totalDays,
        daysLeft,
        label: `Hari ke-${daysPassed} dari ${totalDays} hari (Sisa ${daysLeft} hari)`,
        state: 'running',
        barClass: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500',
        textClass: 'text-blue-700 font-bold',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    };
}
