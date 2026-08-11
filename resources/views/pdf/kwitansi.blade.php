<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>KWITANSI {{ $receiptNumber }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            font-size: 10.5px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .container {
            border: 1.5px solid #1e293b;
            padding: 0;
            box-sizing: border-box;
            min-height: 520px;
        }

        /* Header Table (Flush to top, left, right of container) */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1.5px solid #1e293b;
            margin: 0;
        }

        .header-left {
            width: 30%;
            padding: 8px;
            vertical-align: middle;
            text-align: center;
            border-right: 1.5px solid #1e293b;
            background-color: #ffffff;
        }

        .header-left img {
            max-height: 54px;
            max-width: 150px;
            margin: 0 auto;
            display: block;
        }

        .logo-title {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
            line-height: 1;
        }

        .logo-title span {
            color: #0284c7;
        }

        .logo-subtitle {
            font-size: 6px;
            font-weight: bold;
            color: #475569;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }

        .header-right {
            width: 70%;
            padding: 6px 10px;
            vertical-align: middle;
            text-align: center;
        }

        .company-name {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 1px;
            letter-spacing: 0.2px;
        }

        .company-subtitle {
            font-size: 9.5px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 4px;
            letter-spacing: 0.2px;
        }

        .company-address {
            font-size: 8.5px;
            color: #334155;
            line-height: 1.3;
            margin-bottom: 3px;
        }

        .company-contact {
            font-size: 7.5px;
            color: #475569;
        }

        /* Body Content Inside Container */
        .body-content {
            padding: 18px 20px 20px 20px;
        }

        /* Title */
        .title-container {
            text-align: center;
            margin-bottom: 22px;
        }

        .title-text {
            font-size: 13px;
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #0f172a;
        }

        /* Form Metadata */
        .form-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .form-table td {
            padding: 5px 0;
            vertical-align: top;
        }

        .field-label {
            width: 130px;
            font-size: 10.5px;
            color: #1e293b;
            white-space: nowrap;
        }

        .field-colon {
            width: 15px;
            font-size: 10.5px;
            color: #1e293b;
            text-align: center;
        }

        .field-value {
            font-size: 10.5px;
            color: #0f172a;
            line-height: 1.45;
        }

        .field-value-bold {
            font-weight: bold;
            text-transform: uppercase;
        }

        /* Date line */
        .date-container {
            text-align: right;
            margin-bottom: 12px;
            padding-right: 25px;
            font-size: 10.5px;
            color: #0f172a;
        }

        /* Bottom Section: Rp Box & Signature */
        .bottom-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }

        .bottom-table td {
            vertical-align: top;
        }

        .rp-box-table {
            border-collapse: collapse;
            border: 1.5px solid #1e293b;
            margin-bottom: 12px;
        }

        .rp-box-label {
            background-color: #ffffff;
            padding: 6px 14px;
            font-weight: bold;
            font-size: 12px;
            border-right: 1.5px solid #1e293b;
            text-align: center;
            width: 40px;
        }

        .rp-box-amount {
            background-color: #d8eff2; /* Soft cyan matching physical receipt */
            padding: 6px 20px;
            font-weight: bold;
            font-size: 13px;
            letter-spacing: 0.5px;
            color: #0f172a;
            text-align: center;
            min-width: 160px;
        }

        .bank-info {
            font-size: 10px;
            color: #1e293b;
            line-height: 1.4;
        }

        .signature-container {
            text-align: center;
            padding-top: 35px;
        }

        .signature-name {
            font-size: 10.5px;
            font-weight: bold;
            text-decoration: underline;
            color: #0f172a;
        }

        .signature-title {
            font-size: 10px;
            color: #334155;
            margin-top: 2px;
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Header (Flush to outer border: no margin/padding on top, left, right) -->
    <table class="header-table">
        <tr>
            <td class="header-left">
                @if(isset($logoBase64) && $logoBase64)
                    <img src="{{ $logoBase64 }}" alt="YouSee Logo">
                @else
                    <div class="logo-title">You<span>see</span></div>
                    <div class="logo-subtitle">INDONESIA ADVERTISING AGENCY</div>
                @endif
            </td>
            <td class="header-right">
                <div class="company-name">{{ $companyName }}</div>
                <div class="company-subtitle">{{ $brandName }}</div>
                <div class="company-address">{{ $companyAddress }}</div>
                <div class="company-contact">{{ $companyContact }}</div>
            </td>
        </tr>
    </table>

    <div class="body-content">
        <!-- Title -->
        <div class="title-container">
            <span class="title-text">KWITANSI</span>
        </div>

        <!-- Form Content -->
        <table class="form-table">
            <tr>
                <td class="field-label">No</td>
                <td class="field-colon">:</td>
                <td class="field-value">{{ $receiptNumber }}</td>
            </tr>
            <tr>
                <td class="field-label">Telah Terima dari</td>
                <td class="field-colon">:</td>
                <td class="field-value">{{ $receivedFrom }}</td>
            </tr>
            <tr>
                <td class="field-label">Uang Sejumlah</td>
                <td class="field-colon">:</td>
                <td class="field-value field-value-bold">{{ $terbilang }}</td>
            </tr>
            <tr>
                <td class="field-label">Untuk Pembayaran</td>
                <td class="field-colon">:</td>
                <td class="field-value">{{ $forPaymentOf }}</td>
            </tr>
        </table>

        <!-- Date Line -->
        <div class="date-container">
            {{ $city }}, {{ $dateFormatted }}
        </div>

        <!-- Bottom Section -->
        <table class="bottom-table">
            <tr>
                <!-- Left Side: Rp Box & Bank Info -->
                <td style="width: 55%;">
                    <table class="rp-box-table">
                        <tr>
                            <td class="rp-box-label">Rp</td>
                            <td class="rp-box-amount">{{ number_format($amount, 0, ',', '.') }}</td>
                        </tr>
                    </table>

                    <div class="bank-info">
                        Pembayaran melalui Rek:<br>
                        <strong>{{ $bankAccountName }}</strong><br>
                        <strong>Mandiri - {{ $bankAccountNumber }}</strong><br>
                        <strong>{{ $bankName }}</strong>
                    </div>
                </td>

                <!-- Right Side: Signature -->
                <td style="width: 45%; text-align: center;">
                    <div class="signature-container">
                        <div class="signature-name">{{ $directorName }}</div>
                        <div class="signature-title">{{ $directorTitle }}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>

</body>
</html>
