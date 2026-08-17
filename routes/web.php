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

    Route::get('/sales', function () {
        return Inertia::render('Sales');
    })->name('sales');
    Route::resource('sales', \App\Http\Controllers\Sales\SalesController::class)->only(['store', 'update', 'destroy']);

    // Project Domain
    Route::get('/projects', [\App\Http\Controllers\Project\ProjectController::class, 'index'])->name('projects');
    Route::resource('projects', \App\Http\Controllers\Project\ProjectController::class)->only(['store', 'update', 'destroy']);
    Route::get('/projects/{projectId}', function ($projectId) {
        return Inertia::render('Projects/Show', ['projectId' => (int) $projectId]);
    })->name('projects.show');
    Route::get('/projects/{projectId}/payment', function ($projectId) {
        return Inertia::render('Projects/ProjectPayment', ['projectId' => (int) $projectId]);
    })->name('project.payment');
    Route::post('projects/{project}/locations', [\App\Http\Controllers\Project\ProjectLocationController::class, 'store'])->name('projects.locations.store');
    Route::put('projects/{project}/locations/{location}', [\App\Http\Controllers\Project\ProjectLocationController::class, 'update'])->name('projects.locations.update');
    Route::delete('projects/{project}/locations/{location}', [\App\Http\Controllers\Project\ProjectLocationController::class, 'destroy'])->name('projects.locations.destroy');

    Route::post('projects/{project}/purchase-orders', [\App\Http\Controllers\Procurement\ProjectPurchaseOrderController::class, 'store'])->name('projects.purchase-orders.store');
    Route::post('projects/{project}/payment-plan', [\App\Http\Controllers\Billing\ProjectInvoiceController::class, 'storePaymentPlan'])->name('projects.payment-plan.store');
    Route::post('projects/{project}/invoice/issue', [\App\Http\Controllers\Billing\ProjectInvoiceController::class, 'issue'])->name('projects.invoice.issue');

    // Transaksi
    Route::get('/purchases', function () {
        return Inertia::render('Purchases');
    })->name('purchases');

    Route::get('/cash-out', function () {
        return Inertia::render('CashOut');
    })->name('cash-out');

    Route::get('/sales-transactions', function () {
        return Inertia::render('SalesTransactions');
    })->name('sales-transactions');

    Route::get('/debt-receivable', function () {
        return Inertia::render('DebtReceivable');
    })->name('debt-receivable');

    Route::get('/invoice-po', function () {
        return Inertia::render('InvoicePoList');
    })->name('invoice-po');

    // Accounting Domain — Master COA & Settings
    Route::prefix('accounting')->name('accounting.')->group(function () {
        Route::get('coa', function () {
            return Inertia::render('Accounting/MasterCoa/Index');
        })->name('coa.index');

        Route::get('settings', function () {
            return Inertia::render('Accounting/Settings/Index');
        })->name('settings.index');
    });

    // Laporan
    Route::get('/journal', function () {
        return Inertia::render('JournalReport');
    })->name('journal');

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
});

require __DIR__.'/auth.php';
