<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/overview');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Vendor Domain
    Route::resource('vendors', \App\Http\Controllers\Vendor\VendorController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('vendors/{vendor}/archive', [\App\Http\Controllers\Vendor\VendorController::class, 'archive'])->name('vendors.archive');
    Route::post('vendors/{vendor}/unarchive', [\App\Http\Controllers\Vendor\VendorController::class, 'unarchive'])->name('vendors.unarchive');

    // Client Domain
    Route::resource('clients', \App\Http\Controllers\Client\ClientController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('clients/{client}/archive', [\App\Http\Controllers\Client\ClientController::class, 'archive'])->name('clients.archive');
    Route::post('clients/{client}/unarchive', [\App\Http\Controllers\Client\ClientController::class, 'unarchive'])->name('clients.unarchive');

    // Sales Domain
    Route::resource('sales', \App\Http\Controllers\Sales\SalesController::class)->only(['index', 'store', 'update', 'destroy']);
});

Route::get('/overview', function () {
    return Inertia::render('Overview'); 
})->name('overview');

Route::get('/vendors', function () {
    return Inertia::render('Vendors');
})->name('vendors');

Route::get('/clients', function () {
    return Inertia::render('Clients');
})->name('clients');

Route::get('/sales', function () {
    return Inertia::render('Sales');
})->name('sales');

Route::get('/projects', function () {
    return Inertia::render('Projects');
})->name('projects');

Route::get('/debt-receivable', function () {
    return Inertia::render('DebtReceivable');
})->name('debt-receivable');

Route::get('/invoice-po', function () {
    return Inertia::render('InvoicePoList');
})->name('invoice-po');

Route::get('/purchases', function () {
    return Inertia::render('Purchases');
})->name('purchases');

Route::get('/cash-out', function () {
    return Inertia::render('CashOut');
})->name('cash-out');

Route::get('/sales-transactions', function () {
    return Inertia::render('SalesTransactions');
})->name('sales-transactions');

Route::get('/journal', function () {
    return Inertia::render('JournalReport');
})->name('journal');

Route::get('/ppn', function () {
    return Inertia::render('PpnReport');
})->name('ppn');

Route::get('/cashflow', function () {
    return Inertia::render('CashflowReport');
})->name('cashflow');

Route::match(['get', 'post'], '/po-pdf', [\App\Http\Controllers\PurchaseOrderPdfController::class, 'generatePdf'])->name('po.pdf');
Route::match(['get', 'post'], '/client-invoice-pdf', [\App\Http\Controllers\ClientInvoicePdfController::class, 'generatePdf'])->name('client-invoice.pdf');
Route::match(['get', 'post'], '/kwitansi-pdf', [\App\Http\Controllers\KwitansiPdfController::class, 'generatePdf'])->name('kwitansi.pdf');
Route::get('/projects/{projectId}/payment', function ($projectId) {
    return Inertia::render('Projects/ProjectPayment', ['projectId' => (int) $projectId]);
})->name('project.payment');

require __DIR__.'/auth.php';
