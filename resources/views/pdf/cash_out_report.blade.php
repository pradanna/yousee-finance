<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekap Pengeluaran Kas - {{ $periodLabel }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 9px;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
        }

        .brand-logo-text {
            font-size: 18px;
            font-weight: 800;
            color: #0284c7;
        }

        .brand-logo-dot {
            color: #e11d48;
        }

        .company-title {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
        }

        .company-address {
            font-size: 8px;
            color: #475569;
            line-height: 1.25;
        }

        .doc-title {
            font-size: 14px;
            font-weight: 800;
            color: #0284c7;
            text-align: right;
            margin: 0;
        }

        .doc-subtitle {
            font-size: 8.5px;
            color: #64748b;
            text-align: right;
            margin-top: 2px;
        }

        .filter-badge {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 8.5px;
            margin-bottom: 10px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 12px;
        }

        .data-table th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8px;
            padding: 6px 5px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }

        .data-table td {
            padding: 5px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
            font-size: 8.5px;
        }

        .data-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }

        .font-mono {
            font-family: 'Courier New', Courier, monospace;
        }

        .total-row {
            background-color: #f1f5f9 !important;
            font-weight: bold;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .signature-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }

        .signature-box {
            border-bottom: 1px solid #0f172a;
            height: 55px;
            margin-bottom: 4px;
        }

        .signature-title {
            font-size: 8.5px;
            font-weight: 700;
            color: #334155;
        }

        .signature-name {
            font-size: 8.5px;
            font-weight: 700;
            color: #0f172a;
        }
    </style>
</head>
<body>

    <!-- Header Perusahaan -->
    <table class="header-table">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                <div class="brand-logo-text">Yousee<span class="brand-logo-dot">.</span></div>
                <div class="company-title">PT. YOUTAP SINERGI INDONESIA</div>
                <div class="company-address">
                    Advertising, Billboard Construction & Media Placement<br>
                    Jl. Karang Anyar No. 55, Semarang, Jawa Tengah
                </div>
            </td>
            <td style="width: 45%; vertical-align: top; text-align: right;">
                <h1 class="doc-title">REKAP PENGELUARAN KAS</h1>
                <div class="doc-subtitle">Voucher Kas Kecil & Pengeluaran Operasional</div>
                <div class="doc-subtitle font-mono" style="margin-top: 4px;">
                    Periode: <strong>{{ $periodLabel }}</strong> | Mode: <strong style="text-transform: uppercase;">{{ $fiscalMode }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <!-- Filter Info Badge -->
    <div class="filter-badge">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%;">
                    <strong>Sumber Kas / Rekening:</strong> {{ $paymentAccountLabel }}
                </td>
                <td style="width: 50%; text-align: right;">
                    <strong>Waktu Cetak:</strong> {{ date('d F Y, H:i') }} WIB
                </td>
            </tr>
        </table>
    </div>

    <!-- Tabel Daftar Transaksi -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 4%;" class="text-center">No</th>
                <th style="width: 14%;">No. Transaksi</th>
                <th style="width: 11%;">Tanggal</th>
                <th style="width: 18%;">Kategori Pengeluaran</th>
                <th style="width: 14%;">Sumber Kas</th>
                <th style="width: 14%;">Penerima</th>
                <th style="width: 25%;">Keterangan / Memo</th>
                <th style="width: 14%;" class="text-right">Nominal (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $index => $item)
                <tr>
                    <td class="text-center font-mono">{{ $index + 1 }}</td>
                    <td class="font-mono font-bold">{{ $item->transaction_number }}</td>
                    <td>{{ \Carbon\Carbon::parse($item->transaction_date)->format('d/m/Y') }}</td>
                    <td>{{ $item->expenseAccount?->name ?? '-' }}</td>
                    <td>{{ $item->paymentAccount?->name ?? '-' }}</td>
                    <td>{{ $item->recipient ?? '-' }}</td>
                    <td>{{ $item->description ?? '-' }}</td>
                    <td class="text-right font-mono font-bold">{{ number_format($item->amount, 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center" style="padding: 18px; color: #94a3b8;">
                        Tidak ada catatan pengeluaran kas pada periode ini.
                    </td>
                </tr>
            @endforelse

            <tr class="total-row">
                <td colspan="7" class="text-right" style="padding: 6px 8px;">
                    TOTAL PENGELUARAN KAS
                </td>
                <td class="text-right font-mono font-bold" style="color: #e11d48; font-size: 9.5px;">
                    Rp {{ number_format($totalAmount, 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Tanda Tangan Pertanggungjawaban / Petty Cash Voucher Approval -->
    <table class="signature-table">
        <tr>
            <td>
                <div class="signature-title">Dibuat Oleh (Kasir/Admin):</div>
                <div class="signature-box"></div>
                <div class="signature-name">( {{ auth()->user()->name ?? 'Staf Keuangan' }} )</div>
                <div style="font-size: 7.5px; color: #64748b;">Tanggal: {{ date('d/m/Y') }}</div>
            </td>
            <td>
                <div class="signature-title">Diperiksa Oleh (Finance/Akunting):</div>
                <div class="signature-box"></div>
                <div class="signature-name">( ........................................ )</div>
                <div style="font-size: 7.5px; color: #64748b;">Tanggal: ....................</div>
            </td>
            <td>
                <div class="signature-title">Disetujui Oleh (Pimpinan/Owner):</div>
                <div class="signature-box"></div>
                <div class="signature-name">( ........................................ )</div>
                <div style="font-size: 7.5px; color: #64748b;">Tanggal: ....................</div>
            </td>
        </tr>
    </table>

</body>
</html>
