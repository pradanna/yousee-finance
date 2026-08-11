<?php

namespace Tests\Unit;

use App\Helpers\TerbilangHelper;
use PHPUnit\Framework\TestCase;

class TerbilangHelperTest extends TestCase
{
    public function test_terbilang_conversion_for_reference_kwitansi()
    {
        $amount = 53280000;
        $result = TerbilangHelper::convert($amount);
        $this->assertEquals('LIMA PULUH TIGA JUTA DUA RATUS DELAPAN PULUH RIBU RUPIAH', $result);
    }

    public function test_terbilang_conversion_zero()
    {
        $result = TerbilangHelper::convert(0);
        $this->assertEquals('NOL RUPIAH', $result);
    }
}
