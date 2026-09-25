import { Workbook } from 'exceljs';
import {
    CashflowReportData,
    formatDateIndo,
} from '../cashflowTypes';

/**
 * Number format standar akuntansi Indonesia:
 * Positif: Rp 1.000.000
 * Negatif: (Rp 1.000.000)
 * Nol: Rp 0 / -
 */
const CURRENCY_FORMAT = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
const NUMBER_FORMAT = '#,##0;(#,##0);"-"';

/**
 * Ekspor data Laporan Arus Kas ke format Microsoft Excel (.xlsx) murni
 * dengan 3 worksheet terstruktur, rapi, dan mudah diedit.
 */
export async function exportCashflowExcel(
    data: CashflowReportData,
    fiscalModeLabel: string,
    companyName: string = 'PT YOUSEE INDONESIA',
): Promise<void> {
    const workbook = new Workbook();
    workbook.creator = 'YouSee Finance System';
    workbook.lastModifiedBy = 'YouSee Finance System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const monthName = data.selectedMonth;
    const yearName = data.selectedYear;

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 1: BUKU KAS & BANK (CASH REGISTRY)
    // ─────────────────────────────────────────────────────────────────────────
    const ws1 = workbook.addWorksheet('Buku Kas & Bank', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
        properties: { tabColor: { argb: 'FF0EA5E9' } },
    });

    // 1. Header Informasi Dokumen
    ws1.mergeCells('A1:N1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = companyName.toUpperCase();
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getRow(1).height = 22;

    ws1.mergeCells('A2:N2');
    const subTitleCell = ws1.getCell('A2');
    subTitleCell.value = 'BUKU KAS & BANK — MUTASI PENERIMAAN DAN PENGELUARAN';
    subTitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } };
    subTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getRow(2).height = 18;

    ws1.mergeCells('A3:N3');
    const periodCell = ws1.getCell('A3');
    periodCell.value = `Periode: ${data.periodLabel || `${monthName}/${yearName}`} | Mode Fiskal: ${fiscalModeLabel.toUpperCase()} | Diunduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    periodCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    periodCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getRow(3).height = 16;

    // Row 4: Kosong
    ws1.getRow(4).height = 8;

    // 2. Row Header Tabel (Row 5)
    const headers1 = [
        'No',
        'Tanggal',
        'No. Referensi',
        'Kode Akun',
        'Akun Kas / Bank',
        'Kategori / Akun Lawan',
        'Rincian Keterangan / Memo',
        'Penerima / Partner',
        'Proyek Billboard',
        'Kategori PSAK',
        'Jenis Mutasi',
        'Kas Masuk (Debit)',
        'Kas Keluar (Kredit)',
        'Saldo Berjalan',
    ];

    const headerRow1 = ws1.getRow(5);
    headerRow1.values = headers1;
    headerRow1.height = 26;

    headerRow1.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' }, // Navy Slate
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF0F172A' } },
            left: { style: 'thin', color: { argb: 'FF1E293B' } },
            bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
            right: { style: 'thin', color: { argb: 'FF1E293B' } },
        };
    });

    // 3. Data Baris Transaksi
    const startDataRow = 6;
    data.entries.forEach((e, idx) => {
        const rowNum = startDataRow + idx;
        const row = ws1.getRow(rowNum);

        const isDebit = e.type === 'inflow';
        const debitVal = isDebit ? e.amount : 0;
        const creditVal = !isDebit ? e.amount : 0;

        const rowValues = [
            idx + 1,
            formatDateIndo(e.date),
            e.refNo || e.docNo || '-',
            e.accountCode || '-',
            e.accountName || '-',
            e.contraName || e.accountName || '-',
            e.description || '-',
            e.partnerName || '-',
            e.projectName || '-',
            e.isInternalTransfer ? 'Transfer Kas Internal' : e.category.toUpperCase(),
            e.type === 'inflow' ? 'KAS MASUK' : 'KAS KELUAR',
            debitVal,
            creditVal,
            e.runningBalance ?? 0,
        ];

        row.values = rowValues;
        row.height = 20;

        const isEven = idx % 2 === 0;
        const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Soft zebra striping

        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Calibri', size: 9.5 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rowBgColor },
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };

            // Formatting per kolom
            if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colNumber === 11) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                if (e.type === 'inflow') {
                    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF047857' } }; // Emerald
                } else {
                    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFBE123C' } }; // Rose
                }
            } else if (colNumber >= 12 && colNumber <= 14) {
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.numFmt = NUMBER_FORMAT;
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
        });
    });

    // 4. Baris Total (Summary Row)
    const endDataRow = startDataRow + data.entries.length - 1;
    const totalRowNum = endDataRow + 1;
    const totalRow = ws1.getRow(totalRowNum);
    totalRow.height = 24;

    ws1.mergeCells(`A${totalRowNum}:K${totalRowNum}`);
    const totalLabelCell = ws1.getCell(`A${totalRowNum}`);
    totalLabelCell.value = 'TOTAL MUTASI KAS & SALDO AKHIR';
    totalLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Debit Total Formula
    const debitTotalCell = ws1.getCell(`L${totalRowNum}`);
    debitTotalCell.value = data.entries.length > 0 ? { formula: `=SUM(L${startDataRow}:L${endDataRow})` } : 0;
    debitTotalCell.numFmt = NUMBER_FORMAT;
    debitTotalCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
    debitTotalCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Credit Total Formula
    const creditTotalCell = ws1.getCell(`M${totalRowNum}`);
    creditTotalCell.value = data.entries.length > 0 ? { formula: `=SUM(M${startDataRow}:M${endDataRow})` } : 0;
    creditTotalCell.numFmt = NUMBER_FORMAT;
    creditTotalCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFBE123C' } };
    creditTotalCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Ending Balance Cell
    const endingBalanceCell = ws1.getCell(`N${totalRowNum}`);
    endingBalanceCell.value = data.endingBalance;
    endingBalanceCell.numFmt = NUMBER_FORMAT;
    endingBalanceCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    endingBalanceCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Border and Fill for Total Row
    totalRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }, // Slate 100
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'double', color: { argb: 'FF0F172A' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
    });

    // Auto-filter
    ws1.autoFilter = `A5:N${totalRowNum}`;

    // Auto-fit column width
    ws1.columns = [
        { width: 6 },  // No
        { width: 14 }, // Tanggal
        { width: 18 }, // No. Ref
        { width: 12 }, // Kode Akun
        { width: 24 }, // Akun Kas
        { width: 24 }, // Lawan Akun
        { width: 36 }, // Keterangan
        { width: 24 }, // Partner
        { width: 24 }, // Proyek
        { width: 18 }, // Kategori PSAK
        { width: 14 }, // Jenis Mutasi
        { width: 18 }, // Kas Masuk
        { width: 18 }, // Kas Keluar
        { width: 20 }, // Saldo Berjalan
    ];


    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 2: LAPORAN ARUS KAS (PSAK 2)
    // ─────────────────────────────────────────────────────────────────────────
    const ws2 = workbook.addWorksheet('Arus Kas PSAK 2', {
        properties: { tabColor: { argb: 'FF10B981' } },
    });

    ws2.mergeCells('A1:B1');
    const psakTitle = ws2.getCell('A1');
    psakTitle.value = companyName.toUpperCase();
    psakTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
    ws2.getRow(1).height = 22;

    ws2.mergeCells('A2:B2');
    const psakSub = ws2.getCell('A2');
    psakSub.value = 'LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS) — PSAK 2';
    psakSub.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } };
    ws2.getRow(2).height = 18;

    ws2.mergeCells('A3:B3');
    const psakPeriod = ws2.getCell('A3');
    psakPeriod.value = `Periode: ${data.periodLabel || `${monthName}/${yearName}`} | Mode Fiskal: ${fiscalModeLabel.toUpperCase()}`;
    psakPeriod.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    ws2.getRow(3).height = 16;

    // Header Table
    const psakHeaderRow = ws2.getRow(5);
    psakHeaderRow.values = ['Komponen Arus Kas (PSAK 2 - Metode Langsung)', 'Nominal (Rp)'];
    psakHeaderRow.height = 24;
    psakHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    });
    ws2.getCell('B5').alignment = { vertical: 'middle', horizontal: 'right' };

    let psakCurRow = 6;
    const addPsakItem = (
        label: string,
        amount: number | null,
        isBold = false,
        isHeader = false,
        indent = 0,
        isSubtotal = false,
    ) => {
        const row = ws2.getRow(psakCurRow);
        row.height = isHeader ? 22 : 19;

        const cellA = ws2.getCell(`A${psakCurRow}`);
        const cellB = ws2.getCell(`B${psakCurRow}`);

        cellA.value = indent > 0 ? `${'   '.repeat(indent)}${label}` : label;
        cellA.font = {
            name: 'Calibri',
            size: isHeader ? 10.5 : 9.5,
            bold: isBold || isHeader,
            color: isHeader ? { argb: 'FF0F172A' } : undefined,
        };

        if (amount !== null) {
            cellB.value = amount;
            cellB.numFmt = NUMBER_FORMAT;
            cellB.font = {
                name: 'Calibri',
                size: 9.5,
                bold: isBold,
                color: isSubtotal && amount < 0 ? { argb: 'FFBE123C' } : undefined,
            };
            cellB.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
            cellB.value = '';
        }

        if (isHeader) {
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFC' },
                };
            });
        }

        if (isSubtotal) {
            cellA.border = { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } };
            cellB.border = { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } };
        }

        psakCurRow++;
    };

    const psak = data.psak;

    // 1. Aktivitas Operasi
    addPsakItem('1. ARUS KAS DARI AKTIVITAS OPERASI', null, true, true);
    addPsakItem('Penerimaan kas dari pelunasan invoice client', psak.operatingClientIn, false, false, 1);
    addPsakItem('Penerimaan kas operasional lainnya', psak.operatingOtherIn, false, false, 1);
    addPsakItem('Pembayaran kas kepada vendor media/reklame (PO)', -psak.operatingVendorOut, false, false, 1);
    addPsakItem('Pembayaran beban operasional langsung', -psak.operatingDirectExpenseOut, false, false, 1);
    addPsakItem('Pembayaran pajak penghasilan / PPN', -psak.operatingTaxOut, false, false, 1);
    addPsakItem('Arus Kas Bersih dari Aktivitas Operasi', psak.netOperating, true, false, 0, true);

    // Spacer
    psakCurRow++;

    // 2. Aktivitas Investasi
    addPsakItem('2. ARUS KAS DARI AKTIVITAS INVESTASI', null, true, true);
    addPsakItem('Penerimaan dari pelepasan / penjualan aset tetap', psak.investingAssetIn, false, false, 1);
    addPsakItem('Pengeluaran perolehan / pembelian aset tetap', -psak.investingAssetOut, false, false, 1);
    addPsakItem('Arus Kas Bersih dari Aktivitas Investasi', psak.netInvesting, true, false, 0, true);

    // Spacer
    psakCurRow++;

    // 3. Aktivitas Pendanaan
    addPsakItem('3. ARUS KAS DARI AKTIVITAS PENDANAAN', null, true, true);
    addPsakItem('Penerimaan dari setoran modal / pinjaman pemilik', psak.financingCapitalIn, false, false, 1);
    addPsakItem('Pengeluaran untuk prive / penarikan modal / bagi dividen', -psak.financingPriveOut, false, false, 1);
    addPsakItem('Arus Kas Bersih dari Aktivitas Pendanaan', psak.netFinancing, true, false, 0, true);

    // Spacer
    psakCurRow++;

    // 4. Rekonsiliasi Kenaikan Kas & Saldo
    addPsakItem('4. REKONSILIASI KAS DAN SETARA KAS', null, true, true);
    addPsakItem('Kenaikan / (Penurunan) Bersih Kas & Setara Kas', psak.netCashMovement, true, false, 1);
    addPsakItem('Saldo Awal Kas dan Setara Kas Periode Ini', psak.beginningBalance, false, false, 1);
    
    // Ending Balance Row
    const finalRow = ws2.getRow(psakCurRow);
    finalRow.height = 24;
    const finalA = ws2.getCell(`A${psakCurRow}`);
    const finalB = ws2.getCell(`B${psakCurRow}`);
    finalA.value = 'SALDO AKHIR KAS DAN SETARA KAS';
    finalA.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    finalB.value = psak.endingBalance;
    finalB.numFmt = NUMBER_FORMAT;
    finalB.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
    finalB.alignment = { horizontal: 'right', vertical: 'middle' };

    finalRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF0F172A' } },
            bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        };
    });

    ws2.columns = [
        { width: 55 }, // Keterangan
        { width: 25 }, // Nominal
    ];


    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 3: REKAPITULASI KAS & BANK
    // ─────────────────────────────────────────────────────────────────────────
    const ws3 = workbook.addWorksheet('Rekapitulasi Kas & Bank', {
        properties: { tabColor: { argb: 'FF8B5CF6' } },
    });

    ws3.mergeCells('A1:G1');
    const bankTitle = ws3.getCell('A1');
    bankTitle.value = companyName.toUpperCase();
    bankTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
    ws3.getRow(1).height = 22;

    ws3.mergeCells('A2:G2');
    const bankSub = ws3.getCell('A2');
    bankSub.value = 'REKAPITULASI SALDO REKENING KAS & BANK';
    bankSub.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } };
    ws3.getRow(2).height = 18;

    ws3.mergeCells('A3:G3');
    const bankPeriod = ws3.getCell('A3');
    bankPeriod.value = `Periode: ${data.periodLabel || `${monthName}/${yearName}`} | Mode Fiskal: ${fiscalModeLabel.toUpperCase()}`;
    bankPeriod.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    ws3.getRow(3).height = 16;

    // Header Table
    const bankHeaders = [
        'No',
        'Kode Akun',
        'Nama Akun Kas / Bank',
        'Saldo Awal (Rp)',
        'Mutasi Masuk (Rp)',
        'Mutasi Keluar (Rp)',
        'Saldo Akhir (Rp)',
    ];

    const bankHeaderRow = ws3.getRow(5);
    bankHeaderRow.values = bankHeaders;
    bankHeaderRow.height = 24;
    bankHeaderRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = {
            horizontal: colNumber === 1 || colNumber === 2 ? 'center' : colNumber >= 4 ? 'right' : 'left',
            vertical: 'middle',
        };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    });

    const bankStartRow = 6;
    (data.bankAccounts || []).forEach((acc, idx) => {
        const rowNum = bankStartRow + idx;
        const row = ws3.getRow(rowNum);
        row.values = [
            idx + 1,
            acc.code,
            acc.bankName,
            acc.beginningBalance,
            acc.inflowTotal,
            acc.outflowTotal,
            acc.currentBalance,
        ];
        row.height = 20;

        const isEven = idx % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Calibri', size: 9.5 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };

            if (colNumber === 1 || colNumber === 2) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colNumber >= 4) {
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.numFmt = NUMBER_FORMAT;
            } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
        });
    });

    // Baris Total Rekapitulasi Bank
    const bankEndRow = bankStartRow + (data.bankAccounts?.length || 0) - 1;
    const bankTotalRowNum = bankEndRow + 1;
    const bankTotalRow = ws3.getRow(bankTotalRowNum);
    bankTotalRow.height = 24;

    ws3.mergeCells(`A${bankTotalRowNum}:C${bankTotalRowNum}`);
    const bankTotalLabel = ws3.getCell(`A${bankTotalRowNum}`);
    bankTotalLabel.value = 'TOTAL KAS & BANK';
    bankTotalLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    bankTotalLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    // Total Saldo Awal
    const totalBegCell = ws3.getCell(`D${bankTotalRowNum}`);
    totalBegCell.value = data.bankAccounts?.length ? { formula: `=SUM(D${bankStartRow}:D${bankEndRow})` } : 0;
    totalBegCell.numFmt = NUMBER_FORMAT;
    totalBegCell.font = { name: 'Calibri', size: 10, bold: true };
    totalBegCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Total Inflow
    const totalInCell = ws3.getCell(`E${bankTotalRowNum}`);
    totalInCell.value = data.bankAccounts?.length ? { formula: `=SUM(E${bankStartRow}:E${bankEndRow})` } : 0;
    totalInCell.numFmt = NUMBER_FORMAT;
    totalInCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
    totalInCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Total Outflow
    const totalOutCell = ws3.getCell(`F${bankTotalRowNum}`);
    totalOutCell.value = data.bankAccounts?.length ? { formula: `=SUM(F${bankStartRow}:F${bankEndRow})` } : 0;
    totalOutCell.numFmt = NUMBER_FORMAT;
    totalOutCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFBE123C' } };
    totalOutCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Total Ending
    const totalEndCell = ws3.getCell(`G${bankTotalRowNum}`);
    totalEndCell.value = data.bankAccounts?.length ? { formula: `=SUM(G${bankStartRow}:G${bankEndRow})` } : 0;
    totalEndCell.numFmt = NUMBER_FORMAT;
    totalEndCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    totalEndCell.alignment = { horizontal: 'right', vertical: 'middle' };

    bankTotalRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'double', color: { argb: 'FF0F172A' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
    });

    ws3.columns = [
        { width: 6 },  // No
        { width: 14 }, // Kode
        { width: 30 }, // Nama Rekening
        { width: 20 }, // Saldo Awal
        { width: 20 }, // Mutasi Masuk
        { width: 20 }, // Mutasi Keluar
        { width: 22 }, // Saldo Akhir
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // GENERATE & TRIGGER BROWSER DOWNLOAD
    // ─────────────────────────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `Laporan_Arus_Kas_${monthName}_${yearName}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}
