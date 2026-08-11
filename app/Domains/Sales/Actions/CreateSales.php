<?php

namespace App\Domains\Sales\Actions;

use App\Domains\Sales\Models\Sales;

class CreateSales
{
    /**
     * Create a new sales.
     *
     * @param array $data
     * @return \App\Domains\Sales\Models\Sales
     */
    public function execute(array $data): Sales
    {
        return Sales::create($data);
    }
}
