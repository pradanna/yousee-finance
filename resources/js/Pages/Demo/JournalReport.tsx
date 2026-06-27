import React from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';

export default function JournalReport() {
    const fiscalMode = useDemoFiscalMode();

    // Dummy balanced journals based on fiscalMode
    const journals = fiscalMode === 'ppn'
        ? [
              {
                  date: '2026-06-25',
                  doc: 'INV-PPN-001',
                  desc: 'Jurnal Piutang Invoice #INV-PPN-001 - PT. Gojek Tokopedia',
                  lines: [
                      { account: 'Piutang Dagang', debit: 'IDR 11.100.000', credit: '—' },
                      { account: 'Pendapatan Usaha', debit: '—', credit: 'IDR 10.000.000' },
                      { account: 'PPN Keluaran', debit: '—', credit: 'IDR 1.100.000' }
                  ]
              },
              {
                  date: '2026-06-24',
                  doc: 'PO-PPN-001',
                  desc: 'Jurnal PO #PO-PPN-001 - PT. Megah Billboard Jaya',
                  lines: [
                      { account: 'Beban / Persediaan', debit: 'IDR 3.000.000', credit: '—' },
                      { account: 'PPN Masukan', debit: 'IDR 330.000', credit: '—' },
                      { account: 'Hutang Dagang / Kas', debit: '—', credit: 'IDR 3.330.000' }
                  ]
              },
              {
                  date: '2026-06-22',
                  doc: 'INV-PPN-002',
                  desc: 'Jurnal Piutang Invoice #INV-PPN-002 - Traveloka Corp',
                  lines: [
                      { account: 'Piutang Dagang', debit: 'IDR 5.550.000', credit: '—' },
                      { account: 'Pendapatan Usaha', debit: '—', credit: 'IDR 5.000.000' },
                      { account: 'PPN Keluaran', debit: '—', credit: 'IDR 550.000' }
                  ]
              }
          ]
        : [
              {
                  date: '2026-06-25',
                  doc: 'INV-NP-001',
                  desc: 'Jurnal Piutang Invoice #INV-NP-001 (Non-PPN) - Shopee Indonesia',
                  lines: [
                      { account: 'Piutang Dagang', debit: 'IDR 10.000.000', credit: '—' },
                      { account: 'Pendapatan Usaha', debit: '—', credit: 'IDR 10.000.000' }
                  ]
              },
              {
                  date: '2026-06-24',
                  doc: 'PO-NP-001',
                  desc: 'Jurnal PO #PO-NP-001 (Non-PPN) - CV. Media Ad Perkasa',
                  lines: [
                      { account: 'Beban / Persediaan', debit: 'IDR 1.200.000', credit: '—' },
                      { account: 'Hutang Dagang / Kas', debit: '—', credit: 'IDR 1.200.000' }
                  ]
              },
              {
                  date: '2026-06-22',
                  doc: 'INV-NP-002',
                  desc: 'Jurnal Piutang Invoice #INV-NP-002 (Non-PPN) - PT. Citra Digital',
                  lines: [
                      { account: 'Piutang Dagang', debit: 'IDR 5.000.000', credit: '—' },
                      { account: 'Pendapatan Usaha', debit: '—', credit: 'IDR 5.000.000' }
                  ]
              }
          ];

    // Compute totals
    const totalDebit = fiscalMode === 'ppn' ? 19980000 : 16200000;
    const totalCredit = fiscalMode === 'ppn' ? 19980000 : 16200000;

    return (
        <DemoLayout
            activePage="journal"
            title="Laporan Jurnal Umum"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Accounting' }, { label: 'Jurnal Umum' }]}
        >
            <div className="space-y-6">
                {/* Heading */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Balanced General Journal</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Semua entri jurnal otomatis terposting dan wajib berimbang</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Hard Invariant: Balanced (Debet = Kredit)
                    </span>
                </div>

                {/* Table list */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4 w-32">Tanggal / Doc</th>
                                    <th className="px-6 py-4">Keterangan Jurnal / Nama Akun</th>
                                    <th className="px-6 py-4 text-right w-44">Debet</th>
                                    <th className="px-6 py-4 text-right w-44">Kredit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {journals.map((j, idx) => (
                                    <React.Fragment key={idx}>
                                        {/* Journal Header line */}
                                        <tr className="bg-slate-50/20">
                                            <td className="px-6 py-3 font-semibold text-slate-500 whitespace-nowrap">
                                                {j.date}
                                                <div className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{j.doc}</div>
                                            </td>
                                            <td colSpan={3} className="px-6 py-3 font-bold text-slate-800">
                                                {j.desc}
                                            </td>
                                        </tr>
                                        {/* Ledger lines */}
                                        {j.lines.map((line, lIdx) => (
                                            <tr key={lIdx} className="hover:bg-slate-50/20 transition-colors">
                                                <td></td>
                                                <td className={`px-6 py-3 font-semibold ${line.credit !== '—' ? 'pl-12 text-slate-500' : 'text-slate-700'}`}>
                                                    {line.account}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">{line.debit}</td>
                                                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">{line.credit}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}

                                {/* Balanced Total Footer */}
                                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                                    <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Total Jurnal Periode Ini</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-600">IDR {totalDebit.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-600">IDR {totalCredit.toLocaleString('id-ID')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DemoLayout>
    );
}
