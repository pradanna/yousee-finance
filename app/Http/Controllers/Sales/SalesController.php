<?php

namespace App\Http\Controllers\Sales;

use App\Domains\Sales\Actions\CreateSales;
use App\Domains\Sales\Actions\DeleteSales;
use App\Domains\Sales\Actions\UpdateSales;
use App\Domains\Sales\Models\Sales;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreSalesRequest;
use App\Http\Requests\Sales\UpdateSalesRequest;
use App\Http\Resources\Sales\SalesResource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    /**
     * Display a listing of the sales.
     */
    public function index(): Response
    {
        $sales = Sales::orderBy('name')->paginate(10);
        
        return Inertia::render('Sales/Index', [
            'sales' => SalesResource::collection($sales),
        ]);
    }

    /**
     * Store a newly created sales in storage.
     */
    public function store(StoreSalesRequest $request, CreateSales $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'Sales berhasil ditambahkan.');
    }

    /**
     * Update the specified sales in storage.
     */
    public function update(UpdateSalesRequest $request, Sales $sale, UpdateSales $action): RedirectResponse
    {
        $action->execute($sale, $request->validated());

        return redirect()->back()->with('success', 'Sales berhasil diperbarui.');
    }

    /**
     * Remove the specified sales from storage.
     */
    public function destroy(Sales $sale, DeleteSales $action): RedirectResponse
    {
        $action->execute($sale);

        return redirect()->back()->with('success', 'Sales berhasil dihapus.');
    }
}
