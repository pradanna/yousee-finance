<?php

namespace App\Domains\Sales\Actions;

use App\Domains\Sales\Models\Sales;

class UpdateSales
{
    /**
     * Update an existing sales.
     *
     * @param \App\Domains\Sales\Models\Sales $sales
     * @param array $data
     * @return \App\Domains\Sales\Models\Sales
     */
    public function execute(Sales $sales, array $data): Sales
    {
        $sales->update($data);

        return $sales->fresh();
    }
}
