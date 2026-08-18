<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>INVOICE {{ $invoiceNumber }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 10px;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .brand-logo-text {
            font-size: 18px;
            font-weight: 800;
            color: #0284c7;
        }

        .brand-logo-dot {
            color: #e11d48;
        }

        .brand-subtext {
            font-size: 7.5px;
            color: #475569;
            margin-bottom: 4px;
        }

        .company-title {
            font-size: 10.5px;
            font-weight: bold;
            color: #0f172a;
        }

        .company-address {
            font-size: 8.5px;
            color: #334155;
            line-height: 1.35;
        }

        .invoice-header-title {
            font-size: 26px;
            font-weight: 900;
            color: #0284c7;
            text-align: right;
            letter-spacing: 0.5px;
            margin: 0;
            padding: 0;
        }

        .meta-table {
            float: right;
            border-collapse: collapse;
            margin-top: 4px;
        }

        .meta-table td {
            font-size: 9.5px;
            padding: 1.5px 0;
            vertical-align: top;
        }

        .meta-label {
            font-weight: bold;
            color: #334155;
            text-align: right;
            padding-right: 6px !important;
            white-space: nowrap;
        }

        .meta-value {
            text-align: right;
            font-family: 'Courier', monospace;
            font-weight: bold;
            color: #0f172a;
            white-space: nowrap;
        }

        .clear {
            clear: both;
        }

        .bill-to-header {
            background-color: #0284c7;
            color: #ffffff;
            font-weight: bold;
            font-size: 9px;
            padding: 3px 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .bill-to-box {
            border: 1px solid #0284c7;
            padding: 6px 8px;
            margin-bottom: 12px;
            background-color: #ffffff;
        }

        .bill-to-name {
            font-weight: bold;
            font-size: 10px;
            color: #0f172a;
        }

        .bill-to-subname {
            font-size: 9.5px;
            color: #334155;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .items-table th {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 5px 6px;
            border: 1px solid #0284c7;
            text-align: center;
        }

        .items-table td {
            border: 1px solid #94a3b8;
            padding: 5px 6px;
            font-size: 9px;
            vertical-align: top;
        }

        .row-empty td {
            height: 24px;
        }

        .payment-cell {
            padding: 6px 8px;
            font-size: 9px;
            line-height: 1.4;
            background-color: #f8fafc;
        }

        .payment-title {
            font-weight: bold;
            color: #0f172a;
            display: inline-block;
            width: 80px;
        }

        .summary-wrapper {
            width: 100%;
            margin-top: 5px;
        }

        .notes-box {
            width: 58%;
            float: left;
            border: 1px solid #475569;
        }

        .notes-header {
            background-color: #cbd5e1;
            font-weight: bold;
            font-size: 9px;
            padding: 3px 8px;
            border-bottom: 1px solid #475569;
            color: #0f172a;
        }

        .notes-content {
            padding: 6px 8px;
            font-size: 8.5px;
            line-height: 1.4;
            color: #1e293b;
        }

        .totals-table {
            width: 38%;
            float: right;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 3px 6px;
            font-size: 9px;
            border: 1px solid #94a3b8;
        }

        .totals-label {
            font-weight: bold;
            text-align: right;
            background-color: #f1f5f9;
        }

        .totals-value {
            text-align: right;
            font-family: 'Courier', monospace;
            font-weight: bold;
        }

        .grand-total-row {
            background-color: #0284c7 !important;
            color: #ffffff !important;
            font-weight: bold;
        }

        .grand-total-row td {
            border-color: #0284c7 !important;
        }

        .signature-section {
            width: 100%;
            margin-top: 30px;
            page-break-inside: avoid;
        }

        .signature-box {
            width: 40%;
            float: left;
            text-align: center;
        }

        .signature-title {
            font-size: 9px;
            color: #334155;
            margin-bottom: 60px;
        }

        .signature-name {
            font-weight: bold;
            font-size: 9.5px;
            color: #0f172a;
        }

        .signature-role {
            font-size: 9px;
            color: #475569;
        }
    </style>
</head>
<body>

    <!-- 1. HEADER SECTION -->
    <table class="header-table">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                <img src="{{ public_path('images/logo-yousee2.png') }}" alt="Yousee Indonesia" style="height: 38px; width: auto; margin-bottom: 4px;">
                <div class="company-title">Yousee Indonesia - PT SS Indonesia</div>
                <div class="company-address">
                    <strong>Marketing Office :</strong> Jl. Pengadegan Timur III No.2 RT06 RW02 Pancoran - Jakarta Selatan<br>
                    <strong>Head Office :</strong> Jl Yos Sudarso - Tanjung Anom No 19B, Kel Kwarasan, Kec Grogol, Kab Sukoharjo, Jawa Tengah 57522<br>
                    <strong>Phone :</strong> +62 813 9370 0771 | <strong>Mail :</strong> official@yousee-indonesia.com | <strong>Web :</strong> www.yousee-indonesia.com
                </div>
            </td>
            <td style="width: 45%; vertical-align: top; text-align: right;">
                <div class="invoice-header-title">INVOICE</div>
                @if(!empty($termLabel))
                    <div style="font-size: 8.5px; font-weight: bold; color: #0284c7; margin-top: 2px; text-transform: uppercase;">
                        {{ $termLabel }}
                    </div>
                @endif
                <table class="meta-table">
                    <tr>
                        <td class="meta-label">DATE :</td>
                        <td class="meta-value">{{ $invoiceDate }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">NO :</td>
                        <td class="meta-value">{{ $invoiceNumber }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- 2. BILL TO SECTION -->
    <div class="bill-to-header">BILL TO</div>
    <div class="bill-to-box">
        <div class="bill-to-name">{{ $clientName }}</div>
        @if(!empty($clientSubName))
            <div class="bill-to-subname">{{ $clientSubName }}</div>
        @endif
    </div>

    <!-- 3. ITEMS TABLE -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 8%;">NO</th>
                <th style="width: 25%;">JENIS MEDIA</th>
                <th style="width: 57%;">DESKRIPSI & LOKASI</th>
                <th style="width: 10%;">QTY</th>
            </tr>
        </thead>
        <tbody>
            @foreach($locations as $index => $item)
                <tr>
                    <td style="text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
                    <td style="font-weight: bold;">
                        {{ $item['type'] ?? 'Billboard' }} {{ $item['size'] ?? '' }} {{ $item['orientation'] ?? 'V' }}
                    </td>
                    <td>
                        {{ $item['description'] ?? '-' }}
                        @if(!empty($item['area']))
                            <strong>({{ $item['area'] }})</strong>
                        @endif
                    </td>
                    <td style="text-align: center; font-weight: bold;">{{ $item['qty'] ?? 1 }}</td>
                </tr>
            @endforeach

            @for($i = count($locations); $i < 4; $i++)
                <tr class="row-empty">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            @endfor

            <!-- PAYMENT TO CELL ROW -->
            <tr>
                <td colspan="4" class="payment-cell">
                    <div style="margin-bottom: 2px;">
                        <span class="payment-title">PAYMENT TO :</span>
                        <strong>{{ $bankAccountName }}</strong>
                    </div>
                    <div>
                        <span class="payment-title" style="padding-left: 20px;">{{ $bankName }} :</span>
                        <strong style="font-family: 'Courier', monospace; font-size: 10px;">{{ $bankAccountNumber }}</strong>
                        <span style="color: #475569; margin-left: 4px;">({{ $bankBranch }})</span>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- 4. NOTES & TOTALS SECTION -->
    <div class="summary-wrapper">
        <div class="notes-box">
            <div class="notes-header">Keterangan & Catatan</div>
            <div class="notes-content">
                @if(!empty($termLabel))
                    <div style="margin-bottom: 4px; font-weight: bold; color: #0284c7;">
                        Penagihan: {{ $termLabel }}
                        @if(!empty($contractTotalInvoice) && $contractTotalInvoice > 0)
                            <span style="color: #475569; font-weight: normal;">(dari Total Nilai Kontrak Rp {{ number_format($contractTotalInvoice, 0, ',', '.') }})</span>
                        @endif
                    </div>
                @endif
                @if(is_array($notes))
                    @foreach($notes as $noteLine)
                        <div>&bull; {{ $noteLine }}</div>
                    @endforeach
                @else
                    <div>{!! nl2br(e($notes)) !!}</div>
                @endif
            </div>
        </div>

        <table class="totals-table">
            <tr>
                <td class="totals-label">SUBTOTAL (DPP)</td>
                <td class="totals-value">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="text-align: left; border: none; padding: 0;">Rp</td>
                            <td style="text-align: right; border: none; padding: 0;">{{ number_format($subtotal, 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            @if($isPPN)
            <tr>
                <td class="totals-label">PPN 11%</td>
                <td class="totals-value">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="text-align: left; border: none; padding: 0;">Rp</td>
                            <td style="text-align: right; border: none; padding: 0;">{{ number_format($ppnAmount, 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif
            @if($dpAmount > 0)
            <tr>
                <td class="totals-label">DP / TERBAYAR</td>
                <td class="totals-value">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="text-align: left; border: none; padding: 0;">Rp</td>
                            <td style="text-align: right; border: none; padding: 0;">{{ number_format($dpAmount, 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif
            <tr class="grand-total-row">
                <td class="totals-label" style="background-color: #0284c7 !important; color: #ffffff;">
                    {{ !empty($termLabel) && str_contains(strtolower($termLabel), 'termin') || str_contains(strtolower($termLabel), 'dp') ? 'TOTAL TAGIHAN' : 'TOTAL KONTRAK' }}
                </td>
                <td class="totals-value" style="color: #ffffff;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="text-align: left; border: none; padding: 0; color: #ffffff;">Rp</td>
                            <td style="text-align: right; border: none; padding: 0; color: #ffffff;">{{ number_format($grandTotal, 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <div class="clear"></div>
    </div>

    <!-- 5. SIGNATURE SECTION -->
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-title">Approved By</div>
            <div class="signature-name">{{ $directorName }}</div>
            <div class="signature-role">{{ $directorTitle }}</div>
        </div>
        <div class="clear"></div>
    </div>

</body>
</html>
