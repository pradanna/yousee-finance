<?php

namespace App\Domains\Sales\Actions;

use App\Domains\Sales\Models\Sales;

class DeleteSales
{
    /**
     * Delete a sales.
     *
     * @param \App\Domains\Sales\Models\Sales $sales
     * @return bool|null
     */
    public function execute(Sales $sales): ?bool
    {
        return $sales->delete();
    }
}
