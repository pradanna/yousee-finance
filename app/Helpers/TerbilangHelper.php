<?php

namespace App\Helpers;

class TerbilangHelper
{
    private static array $units = [
        '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
    ];

    public static function convert(float|int $number): string
    {
        $number = (int) floor(abs($number));

        if ($number === 0) {
            return 'NOL RUPIAH';
        }

        $result = self::toWords($number);
        $result = preg_replace('/\s+/', ' ', trim($result));

        return strtoupper($result) . ' RUPIAH';
    }

    private static function toWords(int $n): string
    {
        if ($n < 12) {
            return self::$units[$n];
        }
        if ($n < 20) {
            return self::$units[$n - 10] . ' belas';
        }
        if ($n < 100) {
            return self::$units[(int)($n / 10)] . ' puluh ' . self::$units[$n % 10];
        }
        if ($n < 200) {
            return 'seratus ' . self::toWords($n - 100);
        }
        if ($n < 1000) {
            return self::$units[(int)($n / 100)] . ' ratus ' . self::toWords($n % 100);
        }
        if ($n < 2000) {
            return 'seribu ' . self::toWords($n - 1000);
        }
        if ($n < 1000000) {
            return self::toWords((int)($n / 1000)) . ' ribu ' . self::toWords($n % 1000);
        }
        if ($n < 1000000000) {
            return self::toWords((int)($n / 1000000)) . ' juta ' . self::toWords($n % 1000000);
        }
        if ($n < 1000000000000) {
            return self::toWords((int)($n / 1000000000)) . ' milyar ' . self::toWords($n % 1000000000);
        }
        if ($n < 1000000000000000) {
            return self::toWords((int)($n / 1000000000000)) . ' triliun ' . self::toWords($n % 1000000000000);
        }

        return '';
    }
}
