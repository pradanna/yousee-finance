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
export function getWhatsAppUrl(phone?: string | null, message?: string): string | null {
    const waNumber = formatPhoneWhatsApp(phone);
    if (!waNumber || waNumber.length < 9) return null;

    const base = `https://wa.me/${waNumber}`;
    if (message) {
        return `${base}?text=${encodeURIComponent(message)}`;
    }
    return base;
}
