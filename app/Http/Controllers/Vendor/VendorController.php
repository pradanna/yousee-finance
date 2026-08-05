<?php

namespace App\Http\Controllers\Vendor;

use App\Domains\Vendor\Actions\ArchiveVendor;
use App\Domains\Vendor\Actions\CreateVendor;
use App\Domains\Vendor\Actions\DeleteVendor;
use App\Domains\Vendor\Actions\UpdateVendor;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Http\Resources\Vendor\VendorResource;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    /**
     * Display a listing of the vendors.
     */
    public function index(): Response
    {
        $vendors = Vendor::orderBy('name')->paginate(10);
        
        return Inertia::render('Vendor/Index', [
            'vendors' => VendorResource::collection($vendors),
        ]);
    }

    /**
     * Store a newly created vendor in storage.
     */
    public function store(StoreVendorRequest $request, CreateVendor $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'Vendor berhasil ditambahkan.');
    }

    /**
     * Update the specified vendor in storage.
     */
    public function update(UpdateVendorRequest $request, Vendor $vendor, UpdateVendor $action): RedirectResponse
    {
        $action->execute($vendor, $request->validated());

        return redirect()->back()->with('success', 'Vendor berhasil diperbarui.');
    }
    
    /**
     * Archive the specified vendor.
     */
    public function archive(Vendor $vendor, ArchiveVendor $action): RedirectResponse
    {
        $action->execute($vendor, true);

        return redirect()->back()->with('success', 'Vendor berhasil diarsipkan.');
    }
    
    /**
     * Unarchive the specified vendor.
     */
    public function unarchive(Vendor $vendor, ArchiveVendor $action): RedirectResponse
    {
        $action->execute($vendor, false);

        return redirect()->back()->with('success', 'Vendor berhasil diaktifkan kembali.');
    }

    /**
     * Remove the specified vendor from storage.
     */
    public function destroy(Vendor $vendor, DeleteVendor $action): RedirectResponse
    {
        $action->execute($vendor);

        return redirect()->back()->with('success', 'Vendor berhasil dihapus.');
    }
}
