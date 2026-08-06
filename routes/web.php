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

Route::post('/po-pdf', [\App\Http\Controllers\PurchaseOrderPdfController::class, 'generatePdf'])->name('po.pdf');
Route::post('/client-invoice-pdf', [\App\Http\Controllers\ClientInvoicePdfController::class, 'generatePdf'])->name('client-invoice.pdf');
Route::get('/projects/{projectId}/payment', function ($projectId) {
    return Inertia::render('Projects/ProjectPayment', ['projectId' => (int) $projectId]);
})->name('project.payment');

require __DIR__.'/auth.php';
