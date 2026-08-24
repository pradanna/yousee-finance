<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Arus Kas - {{ $data['periodLabel'] }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 8.5px;
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

        .summary-box {
            width: 100%;
            margin-bottom: 12px;
            border-collapse: collapse;
        }

        .summary-card {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 6px 8px;
            border-radius: 4px;
            text-align: center;
        }

        .summary-card-title {
            font-size: 7.5px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
        }

        .summary-card-val {
            font-size: 11px;
            font-weight: 800;
            margin-top: 2px;
        }

        .text-emerald { color: #059669; }
        .text-rose { color: #e11d48; }
        .text-blue { color: #0284c7; }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 10px;
            margin-bottom: 6px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .data-table th {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 5px;
            font-weight: bold;
            font-size: 8px;
            text-align: left;
        }

        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 4px 5px;
            font-size: 8px;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }

        .psak-row-header {
            background-color: #f8fafc;
            font-weight: bold;
            color: #1e293b;
        }

        .psak-row-subtotal {
            background-color: #f1f5f9;
            font-weight: bold;
            border-top: 1px solid #94a3b8;
        }

        .psak-row-grandtotal {
            background-color: #e2e8f0;
            font-weight: 800;
            font-size: 9px;
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
        }

        .indent-1 { padding-left: 12px !important; }
        .indent-2 { padding-left: 20px !important; }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .signature-cell {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }

        .signature-title {
            font-weight: bold;
            color: #475569;
            font-size: 8px;
            margin-bottom: 40px;
        }

        .signature-name {
            font-weight: bold;
            border-bottom: 1px solid #334155;
            padding-bottom: 2px;
            display: inline-block;
            min-width: 130px;
        }
    </style>
</head>
<body>

    <!-- Header & Kop Surat -->
    <table class="header-table">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                <div class="brand-logo-text">YouSee<span class="brand-logo-dot">.</span></div>
                <div class="company-title">{{ $companyName }}</div>
                <div class="company-address">
                    Jalan Raya Solo Baru No. 88, Sukoharjo, Jawa Tengah<br>
                    Telp: (0271) 7890123 | Email: finance@yousee-indonesia.com
                </div>
            </td>
            <td style="width: 45%; vertical-align: top; text-align: right;">
                <h1 class="doc-title">LAPORAN ARUS KAS</h1>
                <div class="doc-subtitle">STATEMENT OF CASH FLOWS (PSAK 2)</div>
                <div style="margin-top: 6px; font-size: 8px; color: #475569;">
                    <strong>Periode:</strong> {{ $data['periodLabel'] }}<br>
                    <strong>Mode Fiskal:</strong> {{ strtoupper($data['fiscalMode']) }}<br>
                    <strong>Dicetak:</strong> {{ $printedAt }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Executive Summary Cards -->
    <table class="summary-box">
        <tr>
            <td style="width: 25%; padding-right: 4px;">
                <div class="summary-card">
                    <div class="summary-card-title">Saldo Awal Kas</div>
                    <div class="summary-card-val text-blue">Rp {{ number_format($data['beginningBalance'], 0, ',', '.') }}</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 2px;">
                <div class="summary-card">
                    <div class="summary-card-title">Total Kas Masuk</div>
                    <div class="summary-card-val text-emerald">Rp {{ number_format($data['totalInflow'], 0, ',', '.') }}</div>
                </div>
            </td>
            <td style="width: 25%; padding: 0 2px;">
                <div class="summary-card">
                    <div class="summary-card-title">Total Kas Keluar</div>
                    <div class="summary-card-val text-rose">Rp {{ number_format($data['totalOutflow'], 0, ',', '.') }}</div>
                </div>
            </td>
            <td style="width: 25%; padding-left: 4px;">
                <div class="summary-card">
                    <div class="summary-card-title">Saldo Akhir Kas</div>
                    <div class="summary-card-val {{ $data['endingBalance'] >= 0 ? 'text-emerald' : 'text-rose' }}">
                        Rp {{ number_format($data['endingBalance'], 0, ',', '.') }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 1. Laporan Arus Kas Formal PSAK 2 -->
    <div class="section-title">I. Laporan Arus Kas Terstruktur (Standar PSAK 2)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 70%;">Uraian Aktivitas Arus Kas</th>
                <th style="width: 30%; text-align: right;">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <!-- Aktivitas Operasi -->
            <tr class="psak-row-header">
                <td colspan="2">1. ARUS KAS DARI AKTIVITAS OPERASI</td>
            </tr>
            <tr>
                <td class="indent-1">Penerimaan kas dari pelanggan (Pelunasan Piutang Invoice)</td>
                <td class="text-right">{{ number_format($data['psak']['operatingClientIn'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="indent-1">Penerimaan operasional lainnya</td>
                <td class="text-right">{{ number_format($data['psak']['operatingOtherIn'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="indent-1">Pembayaran kas kepada pemasok / vendor (Pelunasan PO)</td>
                <td class="text-right">({{ number_format($data['psak']['operatingVendorOut'], 0, ',', '.') }})</td>
            </tr>
            <tr>
                <td class="indent-1">Pembayaran beban operasional langsung & umum kantor</td>
                <td class="text-right">({{ number_format($data['psak']['operatingDirectExpenseOut'], 0, ',', '.') }})</td>
            </tr>
            <tr>
                <td class="indent-1">Penyetoran pajak ke Kas Negara (PPN / PPh / NTPN)</td>
                <td class="text-right">({{ number_format($data['psak']['operatingTaxOut'], 0, ',', '.') }})</td>
            </tr>
            <tr class="psak-row-subtotal">
                <td class="indent-2">Arus Kas Bersih dari Aktivitas Operasi</td>
                <td class="text-right {{ $data['psak']['netOperating'] >= 0 ? 'text-emerald' : 'text-rose' }}">
                    {{ number_format($data['psak']['netOperating'], 0, ',', '.') }}
                </td>
            </tr>

            <!-- Aktivitas Investasi -->
            <tr class="psak-row-header">
                <td colspan="2">2. ARUS KAS DARI AKTIVITAS INVESTASI</td>
            </tr>
            <tr>
                <td class="indent-1">Hasil penjualan aset tetap / peralatan reklame</td>
                <td class="text-right">{{ number_format($data['psak']['investingAssetIn'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="indent-1">Pembelian aset tetap / belanja konstruksi billboard baru</td>
                <td class="text-right">({{ number_format($data['psak']['investingAssetOut'], 0, ',', '.') }})</td>
            </tr>
            <tr class="psak-row-subtotal">
                <td class="indent-2">Arus Kas Bersih dari Aktivitas Investasi</td>
                <td class="text-right {{ $data['psak']['netInvesting'] >= 0 ? 'text-emerald' : 'text-rose' }}">
                    {{ number_format($data['psak']['netInvesting'], 0, ',', '.') }}
                </td>
            </tr>

            <!-- Aktivitas Pendanaan -->
            <tr class="psak-row-header">
                <td colspan="2">3. ARUS KAS DARI AKTIVITAS PENDANAAN</td>
            </tr>
            <tr>
                <td class="indent-1">Penerimaan dari setoran modal pemilik / investor</td>
                <td class="text-right">{{ number_format($data['psak']['financingCapitalIn'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="indent-1">Pembayaran penarikan modal / prive / dividen pemilik</td>
                <td class="text-right">({{ number_format($data['psak']['financingPriveOut'], 0, ',', '.') }})</td>
            </tr>
            <tr class="psak-row-subtotal">
                <td class="indent-2">Arus Kas Bersih dari Aktivitas Pendanaan</td>
                <td class="text-right {{ $data['psak']['netFinancing'] >= 0 ? 'text-emerald' : 'text-rose' }}">
                    {{ number_format($data['psak']['netFinancing'], 0, ',', '.') }}
                </td>
            </tr>

            <!-- Grand Total Ringkasan -->
            <tr class="psak-row-grandtotal">
                <td>KENAIKAN / (PENURUNAN) BERSIH KAS DAN SETARA KAS</td>
                <td class="text-right {{ $data['psak']['netCashMovement'] >= 0 ? 'text-emerald' : 'text-rose' }}">
                    {{ number_format($data['psak']['netCashMovement'], 0, ',', '.') }}
                </td>
            </tr>
            <tr style="background-color: #f8fafc; font-weight: bold;">
                <td>SALDO KAS DAN SETARA KAS PADA AWAL PERIODE</td>
                <td class="text-right">{{ number_format($data['beginningBalance'], 0, ',', '.') }}</td>
            </tr>
            <tr class="psak-row-grandtotal">
                <td>SALDO KAS DAN SETARA KAS PADA AKHIR PERIODE</td>
                <td class="text-right {{ $data['endingBalance'] >= 0 ? 'text-emerald' : 'text-rose' }}">
                    Rp {{ number_format($data['endingBalance'], 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- 2. Rekapitulasi Saldo Kas & Bank per Rekening -->
    <div class="section-title">II. Rekapitulasi Posisi Saldo Kas & Bank</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">Kode</th>
                <th style="width: 30%;">Nama Akun / Rekening Bank</th>
                <th style="width: 15%; text-align: right;">Saldo Awal</th>
                <th style="width: 15%; text-align: right;">Total Masuk</th>
                <th style="width: 15%; text-align: right;">Total Keluar</th>
                <th style="width: 15%; text-align: right;">Saldo Akhir</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['bankAccounts'] as $bank)
            <tr>
                <td class="text-center font-bold">{{ $bank['code'] }}</td>
                <td>
                    <strong>{{ $bank['bankName'] }}</strong><br>
                    <span style="font-size: 7.5px; color: #64748b;">No. Rek: {{ $bank['accountNumber'] }}</span>
                </td>
                <td class="text-right">{{ number_format($bank['beginningBalance'], 0, ',', '.') }}</td>
                <td class="text-right text-emerald">{{ number_format($bank['inflowTotal'], 0, ',', '.') }}</td>
                <td class="text-right text-rose">{{ number_format($bank['outflowTotal'], 0, ',', '.') }}</td>
                <td class="text-right font-bold">{{ number_format($bank['currentBalance'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Tanda Tangan Otorisasi -->
    <table class="signature-table">
        <tr>
            <td class="signature-cell">
                <div class="signature-title">Disiapkan oleh (Finance):</div>
                <div class="signature-name">{{ $printedBy }}</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Staff Keuangan</div>
            </td>
            <td class="signature-cell">
                <div class="signature-title">Diperiksa oleh (Accounting):</div>
                <div class="signature-name">Indung Sukma</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Accounting Supervisor</div>
            </td>
            <td class="signature-cell">
                <div class="signature-title">Disetujui oleh (Pimpinan):</div>
                <div class="signature-name">Direktur Utama</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Pimpinan / Owner</div>
            </td>
        </tr>
    </table>

</body>
</html>
