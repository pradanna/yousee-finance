<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();
        if ($user && $user->hasRole('staff')) {
            return redirect()->route('projects');
        }
        return redirect()->route('overview');
    })->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Dashboard Overview
    Route::get('/overview', [\App\Http\Controllers\Dashboard\OverviewController::class, 'index'])->name('overview');

    // Master Data
    Route::resource('vendors', \App\Http\Controllers\Vendor\VendorController::class)->except(['create', 'edit', 'show'])->names([
        'index' => 'vendors',
    ]);
    Route::get('/vendors-list', [\App\Http\Controllers\Vendor\VendorController::class, 'index'])->name('vendors.index');
    Route::get('vendors/{vendor}/transactions', [\App\Http\Controllers\Vendor\VendorController::class, 'transactions'])->name('vendors.transactions');
    Route::post('vendors/{vendor}/archive', [\App\Http\Controllers\Vendor\VendorController::class, 'archive'])->name('vendors.archive');
    Route::post('vendors/{vendor}/unarchive', [\App\Http\Controllers\Vendor\VendorController::class, 'unarchive'])->name('vendors.unarchive');

    Route::resource('clients', \App\Http\Controllers\Client\ClientController::class)->except(['create', 'edit', 'show'])->names([
        'index' => 'clients',
    ]);
    Route::get('/clients-list', [\App\Http\Controllers\Client\ClientController::class, 'index'])->name('clients.index');
    Route::get('clients/{client}/transactions', [\App\Http\Controllers\Client\ClientController::class, 'transactions'])->name('clients.transactions');
    Route::post('clients/{client}/archive', [\App\Http\Controllers\Client\ClientController::class, 'archive'])->name('clients.archive');
    Route::post('clients/{client}/unarchive', [\App\Http\Controllers\Client\ClientController::class, 'unarchive'])->name('clients.unarchive');

    Route::resource('sales', \App\Http\Controllers\Sales\SalesController::class)->except(['create', 'edit', 'show'])->names([
        'index' => 'sales',
    ]);
    Route::get('/sales-list', [\App\Http\Controllers\Sales\SalesController::class, 'index'])->name('sales.index');
    Route::post('sales/{sale}/archive', [\App\Http\Controllers\Sales\SalesController::class, 'archive'])->name('sales.archive');
    Route::post('sales/{sale}/unarchive', [\App\Http\Controllers\Sales\SalesController::class, 'unarchive'])->name('sales.unarchive');

    // Project Domain
    Route::get('/projects', [\App\Http\Controllers\Project\ProjectController::class, 'index'])->name('projects');
    Route::resource('projects', \App\Http\Controllers\Project\ProjectController::class)->only(['store', 'update', 'destroy']);
    Route::get('/projects/{project}', [\App\Http\Controllers\Project\ProjectController::class, 'show'])->name('projects.show');
    Route::get('/projects/{projectId}/payment', function ($projectId) {
        return Inertia::render('Projects/ProjectPayment', ['projectId' => (int) $projectId]);
    })->name('project.payment');
    Route::post('projects/{project}/locations', [\App\Http\Controllers\Project\ProjectLocationController::class, 'store'])->name('projects.locations.store');
    Route::put('projects/{project}/locations/{location}', [\App\Http\Controllers\Project\ProjectLocationController::class, 'update'])->name('projects.locations.update');
    Route::delete('projects/{project}/locations/{location}', [\App\Http\Controllers\Project\ProjectLocationController::class, 'destroy'])->name('projects.locations.destroy');

    Route::post('projects/{project}/purchase-orders', [\App\Http\Controllers\Procurement\ProjectPurchaseOrderController::class, 'store'])->name('projects.purchase-orders.store');
    Route::delete('projects/{project}/purchase-orders/{purchaseOrder}', [\App\Http\Controllers\Procurement\ProjectPurchaseOrderController::class, 'destroy'])->name('projects.purchase-orders.destroy');
    Route::post(
        'projects/{project}/purchase-orders/{purchaseOrder}/payment-terms/{paymentTerm}/settle',
        [\App\Http\Controllers\Procurement\ProjectVendorPaymentController::class, 'store'],
    )->name('projects.po.payment-terms.settle');
    Route::post('projects/{project}/payment-plan', [\App\Http\Controllers\Billing\ProjectInvoiceController::class, 'storePaymentPlan'])->name('projects.payment-plan.store');
    Route::post('projects/{project}/invoice/issue', [\App\Http\Controllers\Billing\ProjectInvoiceController::class, 'issue'])->name('projects.invoice.issue');
    Route::post(
        'projects/{project}/invoice/payment-terms/{paymentTerm}/settle',
        [\App\Http\Controllers\Billing\ProjectInvoiceController::class, 'settlePaymentTerm'],
    )->name('projects.invoice.payment-terms.settle');

    // Transaksi
    Route::get('/purchases', [\App\Http\Controllers\Procurement\PurchaseOrderController::class, 'index'])->name('purchases');
    Route::get('/cash-out', [\App\Http\Controllers\Accounting\CashOutController::class, 'index'])->name('cash-out');
    Route::get('/cash-out-export', [\App\Http\Controllers\Accounting\CashOutController::class, 'exportCsv'])->name('cash-out.export');
    Route::post('/cash-out', [\App\Http\Controllers\Accounting\CashOutController::class, 'store'])->name('cash-out.store');
    Route::post('/cash-out/categories', [\App\Http\Controllers\Accounting\CashOutController::class, 'storeCategory'])->name('cash-out.categories.store');
    Route::post('/cash-out/{cashTransaction}/void', [\App\Http\Controllers\Accounting\CashOutController::class, 'void'])->name('cash-out.void');
    Route::post('/cash-out/{cashTransaction}', [\App\Http\Controllers\Accounting\CashOutController::class, 'update'])->name('cash-out.update');
    Route::delete('/cash-out/{cashTransaction}', [\App\Http\Controllers\Accounting\CashOutController::class, 'destroy'])->name('cash-out.destroy');

    Route::get('/sales-transactions', [\App\Http\Controllers\Billing\SalesTransactionController::class, 'index'])->name('sales-transactions');

    Route::get('/debt-receivable', [\App\Http\Controllers\Accounting\DebtReceivableController::class, 'index'])->name('debt-receivable');

    Route::get('/invoice-po', function () {
        return Inertia::render('InvoicePoList');
    })->name('invoice-po');

    // Accounting Domain — Master COA & Settings
    Route::prefix('accounting')->name('accounting.')->group(function () {
        Route::get('coa', [\App\Http\Controllers\Accounting\MasterCoaController::class, 'index'])->name('coa.index');
        Route::post('coa', [\App\Http\Controllers\Accounting\MasterCoaController::class, 'store'])->name('coa.store');
        Route::put('coa/{chartOfAccount}', [\App\Http\Controllers\Accounting\MasterCoaController::class, 'update'])->name('coa.update');
        Route::delete('coa/{chartOfAccount}', [\App\Http\Controllers\Accounting\MasterCoaController::class, 'destroy'])->name('coa.destroy');

        Route::get('settings', [\App\Http\Controllers\Accounting\AccountingSettingsController::class, 'index'])->name('settings.index');
        Route::put('settings', [\App\Http\Controllers\Accounting\AccountingSettingsController::class, 'update'])->name('settings.update');
    });

    // Laporan
    Route::get('/journal', [\App\Http\Controllers\Accounting\JournalReportController::class, 'index'])->name('journal');

    Route::get('/ppn', function () {
        return Inertia::render('PpnReport');
    })->name('ppn');

    Route::get('/cashflow', function () {
        return Inertia::render('CashflowReport');
    })->name('cashflow');

    // PDF Reports
    Route::match(['get', 'post'], '/po-pdf', [\App\Http\Controllers\PurchaseOrderPdfController::class, 'generatePdf'])->name('po.pdf');
    Route::match(['get', 'post'], '/client-invoice-pdf', [\App\Http\Controllers\ClientInvoicePdfController::class, 'generatePdf'])->name('client-invoice.pdf');
    Route::match(['get', 'post'], '/kwitansi-pdf', [\App\Http\Controllers\KwitansiPdfController::class, 'generatePdf'])->name('kwitansi.pdf');
    Route::match(['get', 'post'], '/ppn-pdf', [\App\Http\Controllers\PpnReportPdfController::class, 'generatePdf'])->name('ppn.pdf');
    Route::match(['get', 'post'], '/cash-out-pdf', [\App\Http\Controllers\CashOutPdfController::class, 'generatePdf'])->name('cash-out.pdf');
});

require __DIR__.'/auth.php';
