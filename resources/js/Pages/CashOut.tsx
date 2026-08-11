import React, { useState } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import Modal from '@/Components/UI/Modal';

interface CashExpense {
    id: number;
    paymentAccountCode: string;
    expenseAccountCode: string;
    amount: number;
    transactionDate: string;
    description: string;
    receiptNumber: string;
}

const expenseAccounts = [
    { code: '5210', label: 'Beban Operasional Listrik & Utilitas' },
    { code: '5220', label: 'Beban Gaji & Honorarium Karyawan' },
    { code: '5230', label: 'Beban Perlengkapan (ATK) & Fotocopy' },
    { code: '5240', label: 'Beban Pemeliharaan & Perbaikan Gedung' },
    { code: '5250', label: 'Beban Bensin, Tol & Parkir' },
    { code: '5260', label: 'Beban Iklan & Promosi (Media Cetak/Online)' },
];

const paymentAccounts = [
    { code: '1111', label: 'Bank Mandiri Solo Baru (138-00-2010633-7)' },
    { code: '1112', label: 'Bank BCA Operasional Utama' },
    { code: '1110', label: 'Kas Tunai / Operasional' },
];

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

export default function CashOut() {
    const fiscalMode = useFiscalMode();
    const [expenses, setExpenses] = useState<CashExpense[]>([
        {
            id: 1,
            paymentAccountCode: '1112',
            expenseAccountCode: '5210',
            amount: 1500000,
            transactionDate: '2026-08-10',
            description: 'Bayar token listrik Videotron Simpang Lima',
            receiptNumber: 'OUT-2026-001'
        },
        {
            id: 2,
            paymentAccountCode: '1110',
            expenseAccountCode: '5230',
            amount: 350000,
            transactionDate: '2026-08-08',
            description: 'Beli kertas HVS dan tinta printer',
            receiptNumber: 'OUT-2026-002'
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    
    // Form State
    const [formData, setFormData] = useState({
        paymentAccountCode: '1112',
        expenseAccountCode: '5210',
        amount: '',
        transactionDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newExpense: CashExpense = {
            id: Date.now(),
            paymentAccountCode: formData.paymentAccountCode,
            expenseAccountCode: formData.expenseAccountCode,
            amount: Number(formData.amount),
            transactionDate: formData.transactionDate,
            description: formData.description,
            receiptNumber: `OUT-2026-${String(expenses.length + 1).padStart(3, '0')}`
        };

        setExpenses([newExpense, ...expenses]);
        setIsModalOpen(false);
        setFormData({
            ...formData,
            amount: '',
            description: ''
        });
        setSuccessMessage(`Berhasil mencatat pengeluaran sebesar ${fmt(newExpense.amount)}!`);
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    return (
        <AppLayout activePage="cash-out" title="Pengeluaran Kas"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Pengeluaran Kas' }]}>
            
            <div className="w-full space-y-6">
                {/* Success Toast */}
                {successMessage && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-900 font-black">✕</button>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Riwayat Pengeluaran Operasional</h2>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                            Pencatatan pengeluaran kas non-vendor (listrik, gaji, atk, dll) · Mode {fiscalMode === 'ppn' ? 'PPN' : 'Non-PPN'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2.5 bg-primary hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Catat Pengeluaran
                    </button>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pengeluaran Bulan Ini</span>
                        <div className="text-xl font-black text-slate-800 mt-1">{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Transaksi</span>
                        <div className="text-xl font-black text-slate-800 mt-1">{expenses.length} Trx</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">Quick Info</span>
                        <div className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">
                            Mencatat pengeluaran di sini akan <strong>otomatis membuat jurnal ganda</strong> (Debet Beban & Kredit Bank).
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold tracking-wider">
                                <tr>
                                    <th className="px-5 py-3">No. Referensi</th>
                                    <th className="px-5 py-3">Tanggal</th>
                                    <th className="px-5 py-3">Beban (Debet)</th>
                                    <th className="px-5 py-3">Sumber Dana (Kredit)</th>
                                    <th className="px-5 py-3">Keterangan</th>
                                    <th className="px-5 py-3 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {expenses.map((expense) => {
                                    const expAcc = expenseAccounts.find(a => a.code === expense.expenseAccountCode)?.label || expense.expenseAccountCode;
                                    const bankAcc = paymentAccounts.find(a => a.code === expense.paymentAccountCode)?.label || expense.paymentAccountCode;
                                    
                                    return (
                                        <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{expense.receiptNumber}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">{formatDate(expense.transactionDate)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                    <span className="text-slate-700">{expAcc}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-slate-700">{bankAcc}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 truncate max-w-[200px]" title={expense.description}>
                                                {expense.description || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                                                {fmt(expense.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {expenses.length === 0 && (
                            <div className="py-12 text-center text-slate-400">
                                Belum ada data pengeluaran.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Pengeluaran */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Catat Pengeluaran Kas</h3>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                            <input 
                                type="date" 
                                required
                                value={formData.transactionDate}
                                onChange={e => setFormData({...formData, transactionDate: e.target.value})}
                                className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Bayar Dari (Sumber Dana)</label>
                            <select 
                                value={formData.paymentAccountCode}
                                onChange={e => setFormData({...formData, paymentAccountCode: e.target.value})}
                                className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            >
                                {paymentAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>{acc.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Biaya (Beban)</label>
                            <select 
                                value={formData.expenseAccountCode}
                                onChange={e => setFormData({...formData, expenseAccountCode: e.target.value})}
                                className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            >
                                {expenseAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>{acc.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-sm text-slate-400 font-bold">Rp</span>
                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    value={formData.amount}
                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                    placeholder="0"
                                    className="w-full border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Memo</label>
                            <textarea 
                                rows={2}
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Contoh: Bayar tagihan listrik..."
                                className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-primary hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-neon-primary transition-all"
                        >
                            Simpan Pengeluaran
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
