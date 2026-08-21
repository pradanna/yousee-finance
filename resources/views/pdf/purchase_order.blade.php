<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Purchase Order - {{ $poNumber }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table {
            margin-bottom: 15px;
        }

        .header-table td {
            vertical-align: top;
        }

        .company-name {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 4px;
            margin-bottom: 3px;
        }

        .company-address {
            font-size: 8.5px;
            color: #334155;
            line-height: 1.35;
        }

        .po-title {
            font-size: 22px;
            font-weight: bold;
            color: #0088cc;
            text-align: right;
            text-transform: uppercase;
            margin: 0 0 5px 0;
        }

        .po-meta-table {
            font-size: 9.5px;
            float: right;
            border-collapse: collapse;
        }

        .po-meta-table td {
            text-align: right;
        }
 
        .po-meta-table td.label {
            font-weight: bold;
            padding: 1px 4px 1px 0;
            white-space: nowrap;
            width: 1%;
        }

        .po-meta-table td.value {
            padding: 1px 0 1px 4px;
            font-family: 'Courier', monospace;
            white-space: nowrap;
            width: 1%;
        }

        .vendor-section {
            margin-bottom: 15px;
        }

        .vendor-box {
            border: 1px solid #0088cc;
            width: 80%;
            float: left;
        }

        .vendor-header {
            background-color: #0088cc;
            color: #ffffff;
            font-weight: bold;
            font-size: 9.5px;
            padding: 3px 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .vendor-body {
            padding: 8px;
            font-size: 9.5px;
            color: #1e293b;
        }

        .vendor-name {
            font-weight: bold;
            font-size: 10.5px;
            margin-bottom: 2px;
        }

        .qr-container {
            width: 85px;
            height: 85px;
            border: 1px solid #cbd5e1;
            float: right;
            text-align: center;
            padding: 3px;
        }

        .clear {
            clear: both;
        }

        .items-table {
            width: 100%;
            border: 1px solid #94a3b8;
            margin-bottom: 12px;
        }

        .items-table th {
            background-color: #0088cc;
            color: #ffffff;
            font-weight: bold;
            font-size: 9.5px;
            padding: 5px;
            border: 1px solid #94a3b8;
            text-align: center;
        }

        .items-table td {
            border: 1px solid #94a3b8;
            padding: 6px 8px;
            font-size: 9.5px;
            vertical-align: top;
        }

        .row-empty td {
            height: 28px;
        }

        .summary-section {
            width: 100%;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .notes-column {
            width: 58%;
            float: left;
        }

        .notes-info {
            font-size: 9px;
            margin-bottom: 8px;
            line-height: 1.4;
        }

        .instructions-box {
            border: 1px solid #94a3b8;
            background-color: #f1f5f9;
            padding: 6px 8px;
            font-size: 9px;
        }

        .instructions-title {
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .totals-column {
            width: 38%;
            float: right;
        }

        .totals-table {
            border-left: 1px solid #94a3b8;
            border-right: 1px solid #94a3b8;
            border-bottom: 1px solid #94a3b8;
        }

        .totals-table td {
            padding: 4px 8px;
            font-size: 9.5px;
        }

        .totals-label {
            font-weight: bold;
            text-align: right;
            border-right: 1px solid #94a3b8;
        }

        .totals-value {
            text-align: right;
            font-family: 'Courier', monospace;
        }

        .signatures-section {
            margin-top: 30px;
            width: 100%;
            page-break-inside: avoid;
        }

        .signature-col {
            width: 48%;
            float: left;
            padding-left: 15px;
        }

        .signature-title {
            font-size: 9.5px;
            color: #475569;
            margin-bottom: 3px;
        }

        .signature-company {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 60px;
        }

        .signature-name {
            font-weight: bold;
            font-size: 10px;
        }

        .footer-notice {
            margin-top: 40px;
            text-align: center;
            font-size: 8px;
            color: #64748b;
        }
    </style>
</head>
<body>

    <!-- 1. HEADER LOGO & COMPANY INFO -->
    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <img src="{{ public_path('images/logo-yousee2.png') }}" alt="Yousee Indonesia" style="height: 38px; width: auto;">
                <div class="company-name">Yousee Indonesia - PT SS Indonesia</div>
                <div class="company-address">
                    <strong>Marketing Office :</strong> Jl. Balai Pustaka No.23, RT.6/RW.15, Rawamangun, Kec. Pulo Gadung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13220<br>
                    <strong>Head Office :</strong> Jl Yos Sudarso - Tanjung Anom No 19B, Kel Kwarasan, Kec Grogol, Kab Sukoharjo, Jawa Tengah 57522<br>
                    <strong>Phone :</strong> +62 813 9370 0771 | <strong>Email :</strong> official@yousee-indonesia.com | <strong>Web :</strong> www.yousee-indonesia.com
                </div>
            </td>
            <td style="width: 40%;">
                <div class="po-title">PURCHASE ORDER</div>
                <table class="po-meta-table">
                    <tr>
                        <td class="label">DATE</td>
                        <td class="value">: {{ $poDate }}</td>
                    </tr>
                    <tr>
                        <td class="label">PO #</td>
                        <td class="value">: {{ $poNumber }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- 2. VENDOR INFO & QR CODE -->
    <div class="vendor-section">
        <div class="vendor-box">
            <div class="vendor-header">ORDER TO</div>
            <div class="vendor-body">
                <div class="vendor-name">{{ $vendorName }}</div>
                <div>{{ $vendorAddress ?? '-' }}</div>
                <div>{{ $vendorPhone ?? '-' }}</div>
            </div>
        </div>

        <div class="qr-container">
            <img src="data:image/svg+xml;base64,{{ $qrCodeBase64 }}" style="width: 100%; height: 100%; display: block;" alt="QR Code Validation">
        </div>
        <div class="clear"></div>
    </div>

    <!-- 3. ITEM TABLE -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 45%;">Deskripsi</th>
                <th style="width: 12%;">Ukuran</th>
                <th style="width: 8%;">V/H</th>
                <th style="width: 15%;">Lama Tayang</th>
                <th style="width: 15%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($locations as $index => $item)
                <tr>
                    <td style="text-align: center;">{{ $index + 1 }}</td>
                    <td>{{ $item['description'] ?? '-' }}</td>
                    <td style="text-align: center;">{{ $item['size'] ?? '4x6' }}</td>
                    <td style="text-align: center; font-weight: bold;">{{ $item['orientation'] ?? 'V' }}</td>
                    <td style="text-align: center;">{{ $project['period'] ?? '1 Minggu' }}</td>
                    <td style="text-align: right;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left; border: none; padding: 0;">Rp</td>
                                <td style="text-align: right; border: none; padding: 0; font-family: 'Courier', monospace;">{{ number_format($item['vendorCost'] ?? 0, 0, ',', '.') }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @endforeach

            @for($i = count($locations); $i < 5; $i++)
                <tr class="row-empty">
                    <td style="text-align: center;">{{ $i + 1 }}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            @endfor
        </tbody>
    </table>

    <!-- 4. TOTAL SUMMARY & NOTES -->
    <div class="summary-section">
        <div class="notes-column">
            <div class="notes-info">
                <strong>Rate* :</strong><br>
                <strong>Materi :</strong> {{ $project['name'] ?? '' }}<br>
                <strong>Penerangan :</strong> {{ $lighting }}<br>
                <strong>Term Of Payment :</strong> {{ $topNotes }}
            </div>

            <div class="instructions-box">
                <div class="instructions-title">Special Instructions</div>
                <div>
                    Order dikerjakan setelah Purchasing Order ditandatangani dan mohon dikirimkan kembali melalui :
                    <span style="color: #0284c7; text-decoration: underline;">official@yousee-indonesia.com</span>
                </div>
            </div>
        </div>

        <div class="totals-column">
            <table class="totals-table">
                <tr>
                    <td class="totals-label">Total</td>
                    <td class="totals-value">
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left; border: none; padding: 0;">Rp</td>
                                <td style="text-align: right; border: none; padding: 0;">{{ number_format($totalDPP, 0, ',', '.') }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                @if($isPPN)
                <tr>
                    <td class="totals-label">PPN 11%</td>
                    <td class="totals-value">
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left; border: none; padding: 0;">Rp</td>
                                <td style="text-align: right; border: none; padding: 0;">{{ number_format($totalPPN, 0, ',', '.') }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                @endif
                <tr>
                    <td class="totals-label">Sub Total</td>
                    <td class="totals-value" style="font-weight: bold;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left; border: none; padding: 0;">Rp</td>
                                <td style="text-align: right; border: none; padding: 0;">{{ number_format($grandTotal, 0, ',', '.') }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        <div class="clear"></div>
    </div>

    <!-- 5. SIGNATURES SECTION -->
    <div class="signatures-section">
        <div class="signature-col">
            <div class="signature-title">Pihak Vendor</div>
            <div class="signature-company">{{ $vendorName }}</div>
            <div class="signature-name">( ........................................ )</div>
        </div>

        <div class="signature-col">
            <div class="signature-title">Disetujui Oleh (Authorized)</div>
            <div class="signature-company">Yousee Indonesia</div>
            <div class="signature-name">Manajemen Keuangan</div>
        </div>
        <div class="clear"></div>
    </div>

    <!-- FOOTER WATERMARK -->
    <div class="footer-notice">
        The project has been approved by Yousee Indonesia. Intellectual Property & All Copyrights belongs to Yousee Indonesia .
    </div>

</body>
</html>
