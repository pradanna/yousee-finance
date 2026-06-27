<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::prefix('demo')->group(function () {
    Route::get('/overview', function () {
        return Inertia::render('Demo/Overview');
    })->name('demo.overview');

    Route::get('/vendors', function () {
        return Inertia::render('Demo/Vendors');
    })->name('demo.vendors');

    Route::get('/clients', function () {
        return Inertia::render('Demo/Clients');
    })->name('demo.clients');

    Route::get('/sales', function () {
        return Inertia::render('Demo/Sales');
    })->name('demo.sales');

    Route::get('/projects', function () {
        return Inertia::render('Demo/Projects');
    })->name('demo.projects');

    Route::get('/debt-receivable', function () {
        return Inertia::render('Demo/DebtReceivable');
    })->name('demo.debt-receivable');

    Route::get('/invoice-po', function () {
        return Inertia::render('Demo/InvoicePoList');
    })->name('demo.invoice-po');

    Route::get('/purchases', function () {
        return Inertia::render('Demo/Purchases');
    })->name('demo.purchases');

    Route::get('/sales-transactions', function () {
        return Inertia::render('Demo/SalesTransactions');
    })->name('demo.sales-transactions');

    Route::get('/journal', function () {
        return Inertia::render('Demo/JournalReport');
    })->name('demo.journal');

    Route::get('/ppn', function () {
        return Inertia::render('Demo/PpnReport');
    })->name('demo.ppn');

    Route::get('/cashflow', function () {
        return Inertia::render('Demo/CashflowReport');
    })->name('demo.cashflow');
});

require __DIR__.'/auth.php';
