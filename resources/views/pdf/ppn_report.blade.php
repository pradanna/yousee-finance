<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan PPN {{ $periodLabel }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 9.5px;
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
            font-size: 8.5px;
            color: #334155;
            line-height: 1.3;
        }

        .doc-title {
            font-size: 16px;
            font-weight: 800;
            color: #0284c7;
            text-align: right;
            margin: 0;
        }

        .doc-subtitle {
            font-size: 9px;
            font-weight: bold;
            color: #475569;
            text-align: right;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            background-color: #f1f5f9;
            padding: 5px 8px;
            border-left: 3px solid #0284c7;
            margin-top: 10px;
            margin-bottom: 6px;
            text-transform: uppercase;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .summary-table td {
            padding: 4px 6px;
            border: 1px solid #e2e8f0;
            font-size: 9px;
        }

        .summary-label {
            font-weight: bold;
            color: #334155;
            background-color: #f8fafc;
            width: 45%;
        }

        .summary-value {
            font-weight: bold;
            text-align: right;
            font-family: 'Courier', monospace;
        }

        .badge-paid {
            color: #15803d;
            background-color: #dcfce7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
        }

        .badge-unpaid {
            color: #b91c1c;
            background-color: #fee2e2;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .data-table th {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 5px 6px;
            border: 1px solid #0284c7;
            text-align: left;
        }

        .data-table td {
            padding: 4.5px 6px;
            border: 1px solid #cbd5e1;
            font-size: 8.5px;
            vertical-align: middle;
        }

        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-mono {
            font-family: 'Courier', monospace;
        }

        .total-row td {
            background-color: #e0f2fe !important;
            font-weight: bold;
            border-top: 2px solid #0284c7;
        }

        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 10px;
        }

        .sig-space {
            height: 50px;
        }

        .sig-name {
            font-weight: bold;
            text-decoration: underline;
        }

        .sig-title {
            font-size: 8px;
            color: #475569;
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                <img src="{{ public_path('images/logo-yousee2.png') }}" alt="PT. SUKMA SETIAWAN" style="height: 36px; width: auto; margin-bottom: 4px;">
                <div class="company-title">PT. SUKMA SETIAWAN</div>
                <div class="company-address">
                    Jl. Kebangkitan Nasional No. 8, Penumping, Laweyan, Surakarta<br>
                    NPWP: 01.234.567.8-522.000 | Telp: (0271) 714-889<br>
                    Email: finance@youseemedia.co.id
                </div>
            </td>
            <td style="width: 45%; vertical-align: top; text-align: right;">
                <div class="doc-title">LAPORAN PPN</div>
                <div class="doc-subtitle">SPT MASA & REKONSILIASI DJP</div>
                <div style="margin-top: 6px; font-size: 9px; font-weight: bold; color: #0284c7;">
                    PERIODE: {{ strtoupper($periodLabel) }}
                </div>
                <div style="font-size: 8px; color: #64748b;">
                    Dicetak: {{ $printedAt }} WIB
                </div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Masa Pajak & NTPN -->
    <div class="section-title">1. Ringkasan SPT Masa PPN & Bukti Setor NTPN (Kas Negara)</div>
    <table class="summary-table">
        <tr>
            <td class="summary-label">Total PPN Keluaran (Penjualan PKP)</td>
            <td class="summary-value" style="color: #0284c7;">Rp {{ number_format($totalKeluaranPpn, 0, ',', '.') }}</td>
            <td class="summary-label">Status Penyetoran</td>
            <td class="summary-value" style="text-align: center;">
                @if(($taxSettlement['status'] ?? '') === 'paid')
                    <span class="badge-paid">✓ LUNAS DISETOR</span>
                @else
                    <span class="badge-unpaid">BELUM DISETOR</span>
                @endif
            </td>
        </tr>
        <tr>
            <td class="summary-label">Total PPN Masukan (Pembelian Terkreditkan)</td>
            <td class="summary-value" style="color: #16a34a;">Rp {{ number_format($totalMasukanPpnCreditable, 0, ',', '.') }}</td>
            <td class="summary-label">Nomor NTPN Kas Negara</td>
            <td class="summary-value font-mono">{{ $taxSettlement['ntpn'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="summary-label">Selisih PPN ({{ $netPpnAmount >= 0 ? 'Kurang Bayar / Terutang' : 'Lebih Bayar' }})</td>
            <td class="summary-value" style="color: {{ $netPpnAmount >= 0 ? '#b91c1c' : '#16a34a' }};">
                Rp {{ number_format(abs($netPpnAmount), 0, ',', '.') }}
            </td>
            <td class="summary-label">Tanggal Setor & Bank</td>
            <td class="summary-value">
                {{ $taxSettlement['paidDate'] ? date('d/m/Y', strtotime($taxSettlement['paidDate'])) : '-' }} ({{ $taxSettlement['bankName'] ?? '-' }})
            </td>
        </tr>
    </table>

    <!-- Rincian PPN Keluaran -->
    <div class="section-title">2. Rincian PPN Keluaran (Faktur Pajak Penjualan per Invoice Client)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 14%;">No. Invoice</th>
                <th style="width: 22%;">No. Seri Faktur (NSFP)</th>
                <th style="width: 10%;">Tanggal</th>
                <th style="width: 24%;">Nama Client & NPWP</th>
                <th style="width: 15%; text-align: right;">DPP (Rp)</th>
                <th style="width: 15%; text-align: right;">PPN 11% (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($ppnKeluaran as $k)
                <tr>
                    <td class="font-mono" style="font-weight: bold;">{{ $k['docNo'] }}</td>
                    <td class="font-mono">{{ $k['nsfp'] }}</td>
                    <td class="text-center">{{ date('d/m/Y', strtotime($k['date'])) }}</td>
                    <td>
                        <strong>{{ $k['client'] }}</strong><br>
                        <span style="color: #64748b; font-size: 7.5px;">NPWP: {{ $k['npwp'] }}</span>
                    </td>
                    <td class="text-right font-mono">{{ number_format($k['dpp'], 0, ',', '.') }}</td>
                    <td class="text-right font-mono" style="font-weight: bold; color: #0284c7;">{{ number_format($k['ppn'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="color: #94a3b8; padding: 10px;">Tidak ada transaksi PPN Keluaran pada periode ini.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="4" class="text-right">TOTAL PPN KELUARAN (PENJUALAN):</td>
                <td class="text-right font-mono">Rp {{ number_format($totalKeluaranDpp, 0, ',', '.') }}</td>
                <td class="text-right font-mono" style="color: #0284c7;">Rp {{ number_format($totalKeluaranPpn, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Rincian PPN Masukan -->
    <div class="section-title">3. Rincian PPN Masukan (Faktur Pajak Pembelian per PO Vendor)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 14%;">No. PO</th>
                <th style="width: 22%;">No. Seri Faktur (NSFP)</th>
                <th style="width: 10%;">Tanggal</th>
                <th style="width: 24%;">Nama Vendor & NPWP</th>
                <th style="width: 15%; text-align: right;">DPP (Rp)</th>
                <th style="width: 15%; text-align: right;">PPN 11% (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($ppnMasukan as $m)
                <tr>
                    <td class="font-mono" style="font-weight: bold;">{{ $m['docNo'] }}</td>
                    <td class="font-mono">{{ $m['nsfp'] }}</td>
                    <td class="text-center">{{ date('d/m/Y', strtotime($m['date'])) }}</td>
                    <td>
                        <strong>{{ $m['vendor'] }}</strong><br>
                        <span style="color: #64748b; font-size: 7.5px;">NPWP: {{ $m['npwp'] }}</span>
                    </td>
                    <td class="text-right font-mono">{{ number_format($m['dpp'], 0, ',', '.') }}</td>
                    <td class="text-right font-mono" style="font-weight: bold; color: #16a34a;">{{ number_format($m['ppn'], 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="color: #94a3b8; padding: 10px;">Tidak ada transaksi PPN Masukan pada periode ini.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="4" class="text-right">TOTAL PPN MASUKAN TERKREDITKAN:</td>
                <td class="text-right font-mono">Rp {{ number_format($totalMasukanDpp, 0, ',', '.') }}</td>
                <td class="text-right font-mono" style="color: #16a34a;">Rp {{ number_format($totalMasukanPpnCreditable, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Signatures -->
    <table class="signatures-table">
        <tr>
            <td>
                <div>Dibuat oleh,</div>
                <div class="sig-space"></div>
                <div class="sig-name">Tax & Accounting Officer</div>
                <div class="sig-title">PT. Sukma Setiawan</div>
            </td>
            <td>
                <div>Disetujui oleh,</div>
                <div class="sig-space"></div>
                <div class="sig-name">Yosua Eka Setiawan</div>
                <div class="sig-title">Direktur Utama</div>
            </td>
        </tr>
    </table>

</body>
</html>
