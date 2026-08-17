<?php

declare(strict_types=1);

namespace App\Domains\Sales\Actions;

use App\Domains\Sales\Models\Sales;

class UnarchiveSales
{
    /**
     * Unarchive a sales rep.
     */
    public function execute(Sales $sales): Sales
    {
        $sales->update(['is_archived' => false]);

        return $sales;
    }
}
