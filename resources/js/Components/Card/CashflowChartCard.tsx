export interface ChartBar {
    month: string;
    inflow: { val: string; h: number };
    outflow: { val: string; h: number };
}

interface CashflowChartCardProps {
    chartData: ChartBar[];
}

export default function CashflowChartCard({
    chartData,
}: CashflowChartCardProps) {
    return (
        <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 lg:col-span-2">
            <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-800">
                    Tren Cashflow Bulanan
                </h2>
                <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                    Perbandingan Aliran Dana Masuk & Keluar
                </p>
            </div>
            <div className="flex h-64 items-center justify-center">
                <svg className="h-full w-full" viewBox="0 0 500 215">
                    {/* Gridlines */}
                    <line
                        x1="40"
                        y1="30"
                        x2="480"
                        y2="30"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1="40"
                        y1="80"
                        x2="480"
                        y2="80"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1="40"
                        y1="130"
                        x2="480"
                        y2="130"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1="40"
                        y1="180"
                        x2="480"
                        y2="180"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                    />

                    {/* Y-Axis Labels */}
                    <text
                        x="32"
                        y="33"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#94a3b8"
                        textAnchor="end"
                    >
                        150M
                    </text>
                    <text
                        x="32"
                        y="83"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#94a3b8"
                        textAnchor="end"
                    >
                        100M
                    </text>
                    <text
                        x="32"
                        y="133"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#94a3b8"
                        textAnchor="end"
                    >
                        50M
                    </text>
                    <text
                        x="32"
                        y="183"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#94a3b8"
                        textAnchor="end"
                    >
                        0
                    </text>

                    {/* Legend */}
                    <g transform="translate(320, 10)">
                        <rect
                            x="0"
                            y="0"
                            width="12"
                            height="12"
                            rx="3"
                            fill="#10B981"
                        />
                        <text
                            x="18"
                            y="10"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#64748b"
                        >
                            Inflow
                        </text>
                        <rect
                            x="70"
                            y="0"
                            width="12"
                            height="12"
                            rx="3"
                            fill="#FB7185"
                        />
                        <text
                            x="88"
                            y="10"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#64748b"
                        >
                            Outflow
                        </text>
                    </g>

                    {/* Dynamic Data Bars */}
                    {chartData.map((data: ChartBar, index: number) => {
                        const xOffset = 60 + index * 80;
                        const inflowY = 180 - data.inflow.h;
                        const outflowY = 180 - data.outflow.h;
                        return (
                            <g key={data.month}>
                                {/* Inflow Bar */}
                                <rect
                                    x={xOffset}
                                    y={inflowY}
                                    width="16"
                                    height={data.inflow.h}
                                    rx="4"
                                    fill="#10B981"
                                />
                                <text
                                    x={xOffset + 8}
                                    y={inflowY - 5}
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill="#047857"
                                    textAnchor="middle"
                                >
                                    {data.inflow.val}
                                </text>

                                {/* Outflow Bar */}
                                <rect
                                    x={xOffset + 20}
                                    y={outflowY}
                                    width="16"
                                    height={data.outflow.h}
                                    rx="4"
                                    fill="#FB7185"
                                />
                                <text
                                    x={xOffset + 28}
                                    y={outflowY - 5}
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill="#BE123C"
                                    textAnchor="middle"
                                >
                                    {data.outflow.val}
                                </text>

                                {/* Month Name */}
                                <text
                                    x={xOffset + 18}
                                    y="198"
                                    fontSize="10"
                                    fontWeight="bold"
                                    fill="#94a3b8"
                                    textAnchor="middle"
                                >
                                    {data.month}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
