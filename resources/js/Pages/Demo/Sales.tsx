import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';
import SlideOver from '@/Components/SlideOver';

interface SalesItem {
    id: number;
    name: string;
    achieved: string;
    achievedVal: number;
    commission: string;
    status: string;
}

export default function Sales() {
    const fiscalMode = useDemoFiscalMode();
    const [isOpen, setIsOpen] = useState(false);
    const [salesTeam, setSalesTeam] = useState<SalesItem[]>([
        { id: 1, name: 'Rian Hidayat', achieved: 'Rp 320.000.000', achievedVal: 320000000, commission: 'Rp 6.400.000', status: 'Active' },
        { id: 2, name: 'Siti Aminah', achieved: 'Rp 180.000.000', achievedVal: 180000000, commission: 'Rp 3.600.000', status: 'Active' },
        { id: 3, name: 'Budi Santoso', achieved: 'Rp 50.000.000', achievedVal: 50000000, commission: 'Rp 1.000.000', status: 'Active' }
    ]);

    const [form, setForm] = useState({ name: '', commissionRate: '2' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap sales wajib diisi.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSalesTeam([
            ...salesTeam,
            {
                id: salesTeam.length + 1,
                name: form.name,
                achieved: 'Rp 0',
                achievedVal: 0,
                commission: 'Rp 0',
                status: 'Active'
            }
        ]);

        setForm({ name: '', commissionRate: '2' });
        setErrors({});
        setIsOpen(false);
    };

    // Calculate total summary metrics
    const totalAchieved = salesTeam.reduce((acc, curr) => acc + curr.achievedVal, 0);
    const totalCommission = salesTeam.reduce((acc, curr) => {
        const val = parseInt(curr.commission.replace(/[^0-9]/g, '')) || 0;
        return acc + val;
    }, 0);

    return (
        <DemoLayout
            activePage="sales"
            title="Sales Tracking"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Master Data' }, { label: 'Sales' }]}
        >
            <div className="space-y-6">
                {/* Header CTA */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Pelacakan Performa Sales</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Pantau pencapaian omset dan estimasi komisi tim marketing billboard</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Daftarkan Sales Baru
                    </button>
                </div>

                {/* Mini Stat Widget Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TOTAL OMSET TIM SALES</span>
                        <span className="text-xl font-bold text-slate-800 font-mono block">Rp {totalAchieved.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Akumulasi deal penawaran sewa baliho/LED</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">KOMISI TERBENTUK</span>
                        <span className="text-xl font-bold text-emerald-600 font-mono block">Rp {totalCommission.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-emerald-600/80 font-bold block">Biaya insentif yang dibayarkan ke sales</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TOTAL TIM SALES</span>
                        <span className="text-xl font-bold text-blue-600 font-mono block">{salesTeam.length} Orang</span>
                        <span className="text-[10px] text-blue-500 font-bold block">Sales executive aktif Yousee Indonesia</span>
                    </div>
                </div>

                {/* Sales Table List */}
                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4">Sales Executive</th>
                                    <th className="px-6 py-4 text-right">Pencapaian Omset</th>
                                    <th className="px-6 py-4 text-right">Estimasi Komisi (2%)</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {salesTeam.map((sales) => (
                                    <tr key={sales.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            <div>{sales.name}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">ID: SLS-{sales.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{sales.achieved}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{sales.commission}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                {sales.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form SlideOver Drawer */}
                <SlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} title="Daftarkan Sales Executive Baru">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                Nama Lengkap Sales <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Nama sales executive..."
                            />
                            {errors.name && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.name}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Komisi Rate (%)</label>
                            <input
                                type="number"
                                value={form.commissionRate}
                                onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                min="0.1"
                                max="10"
                                step="0.1"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Default adalah 2% untuk billing penawaran yang dibayarkan lunas.</span>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                            >
                                Simpan Sales
                            </button>
                        </div>
                    </form>
                </SlideOver>
            </div>
        </DemoLayout>
    );
}
