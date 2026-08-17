<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dashboard;

use App\Domains\Project\Actions\GetDashboardOverviewData;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    /**
     * Handle the incoming dashboard overview request.
     */
    public function index(Request $request, GetDashboardOverviewData $action): Response
    {
        $now = now();
        $month = (int) $request->query('month', (string) $now->month);
        $year = (int) $request->query('year', (string) $now->year);

        // Sanitize bounds
        if ($month < 1 || $month > 12) {
            $month = (int) $now->month;
        }
        if ($year < 2000 || $year > 2100) {
            $year = (int) $now->year;
        }

        $data = $action->execute($month, $year);

        return Inertia::render('Overview', $data);
    }
}
