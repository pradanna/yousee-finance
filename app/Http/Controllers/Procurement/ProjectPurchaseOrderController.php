<?php

declare(strict_types=1);

namespace App\Http\Controllers\Procurement;

use App\Domains\Procurement\Actions\IssueVendorPurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Vendor\Models\Vendor;
use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\StoreVendorPurchaseOrderRequest;
use Illuminate\Http\RedirectResponse;

class ProjectPurchaseOrderController extends Controller
{
    /**
     * Terbitkan PO vendor untuk satu atau beberapa titik lokasi proyek.
     */
    public function store(StoreVendorPurchaseOrderRequest $request, Project $project, IssueVendorPurchaseOrder $action): RedirectResponse
    {
        $vendor = Vendor::findOrFail($request->validated('vendor_id'));

        $action->execute(
            $project,
            $vendor,
            $request->validated('location_ids'),
            $request->validated('transaction_date'),
        );

        return redirect()->back()->with('success', 'PO vendor berhasil diterbitkan.');
    }
}
