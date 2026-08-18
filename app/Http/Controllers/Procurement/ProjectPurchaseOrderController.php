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
            [
                'lighting'       => $request->validated('lighting'),
                'top_notes'      => $request->validated('top_notes'),
                'term_scheme'    => $request->validated('term_scheme'),
                'term_percents'  => $request->validated('term_percents'),
                'term_due_dates' => $request->validated('term_due_dates'),
            ],
        );

        return redirect()->back()->with('success', 'PO vendor berhasil diterbitkan.');
    }

    /**
     * Batalkan dan hapus PO vendor (hanya jika belum ada pembayaran).
     */
    public function destroy(Project $project, \App\Domains\Procurement\Models\PurchaseOrder $purchaseOrder, \App\Domains\Procurement\Actions\CancelPurchaseOrder $action): RedirectResponse
    {
        abort_unless($purchaseOrder->project_id === $project->id, 404);

        $action->execute($purchaseOrder);

        return redirect()->back()->with('success', "PO {$purchaseOrder->po_number} berhasil dibatalkan. Titik lokasi dapat diedit kembali.");
    }
}
