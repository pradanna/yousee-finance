import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Modal from '@/Components/UI/Modal';
import { fmt } from '@/Pages/Projects/projectTypes';
import { router } from '@inertiajs/react';
import axios from 'axios';
import React, { useRef, useState } from 'react';

export interface PreviewLocationItem {
    vendor_id: string;
    vendor_code: string;
    vendor_name: string;
    area: string;
    description: string;
    type: string;
    size: string;
    orientation: 'V' | 'H';
    lighting: string;
    qty: number;
    vendor_cost: number;
    is_ppn_inclusive: boolean;
    top_notes: string | null;
}

interface LocationImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | number;
    isPPN?: boolean;
}

export default function LocationImportModal({
    isOpen,
    onClose,
    projectId,
    isPPN = false,
}: LocationImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [previewItems, setPreviewItems] = useState<PreviewLocationItem[]>([]);
    const [parsingErrors, setParsingErrors] = useState<string[]>([]);
    const [summary, setSummary] = useState({ total_rows: 0, valid_rows: 0 });

    const resetState = () => {
        setStep('upload');
        setSelectedFile(null);
        setIsUploading(false);
        setIsSubmitting(false);
        setUploadError(null);
        setPreviewItems([]);
        setParsingErrors([]);
        setSummary({ total_rows: 0, valid_rows: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        if (isUploading || isSubmitting) return;
        resetState();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    const handleUploadAndPreview = async () => {
        if (!selectedFile) {
            setUploadError('Pilih file template terlebih dahulu.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post<{
                items: PreviewLocationItem[];
                errors: string[];
                total_rows: number;
                valid_rows: number;
            }>(route('projects.locations.preview', projectId), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;
            setPreviewItems(data.items || []);
            setParsingErrors(data.errors || []);
            setSummary({
                total_rows: data.total_rows || 0,
                valid_rows: data.valid_rows || 0,
            });

            if (
                (data.items || []).length === 0 &&
                (data.errors || []).length === 0
            ) {
                setUploadError('File tidak memiliki baris data titik.');
            } else {
                setStep('preview');
            }
        } catch (err: unknown) {
            let errorMsg =
                'Gagal memproses file. Pastikan format kolom sesuai template.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                errorMsg = String(err.response.data.message);
            }
            setUploadError(errorMsg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirmImport = () => {
        if (previewItems.length === 0) return;

        setIsSubmitting(true);
        router.post(
            route('projects.locations.import', projectId),
            {
                items: previewItems.map((item) => ({
                    vendor_id: item.vendor_id,
                    area: item.area,
                    description: item.description,
                    type: item.type,
                    size: item.size,
                    orientation: item.orientation,
                    lighting: item.lighting,
                    qty: item.qty,
                    vendor_cost: item.vendor_cost,
                    is_ppn_inclusive: item.is_ppn_inclusive,
                    top_notes: item.top_notes,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    handleClose();
                },
                onError: (errs) => {
                    const firstMsg = Object.values(errs)[0];
                    setUploadError(firstMsg || 'Gagal menyimpan titik lokasi.');
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <Modal
            show={isOpen}
            onClose={handleClose}
            maxWidth={step === 'preview' ? '5xl' : 'xl'}
        >
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                {step === 'upload'
                                    ? 'Import Titik Lokasi via Excel / CSV'
                                    : 'Review & Pratinjau Titik Lokasi'}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {step === 'upload'
                                    ? 'Unggah file spreadsheet template untuk memasukkan banyak titik lokasi sekaligus.'
                                    : 'Periksa kembali data titik dan kecocokan vendor sebelum disimpan ke database.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUploading || isSubmitting}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-slate-50 text-slate-500 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {uploadError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                        {uploadError}
                    </div>
                )}

                {/* Step 1: Upload & Download Template */}
                {step === 'upload' && (
                    <div className="space-y-5">
                        {/* Download Template Banner Card */}
                        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <span className="block text-xs font-bold text-blue-950">
                                    Format Template Excel Resmi
                                </span>
                                <span className="block text-[11px] text-blue-700">
                                    Gunakan template resmi kami yang telah
                                    dilengkapi contoh pengisian Kode Vendor
                                    (cth: VND-0001) dan ukuran titik.
                                </span>
                            </div>
                            <a
                                href={route(
                                    'projects.locations.template',
                                    projectId,
                                )}
                                className="shadow-2xs inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-50"
                            >
                                <svg
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                Unduh Template (.CSV)
                            </a>
                        </div>

                        {/* PPN Mode Constraint Banner */}
                        {isPPN && (
                            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
                                <span className="text-base leading-none">
                                    ⚠️
                                </span>
                                <div className="space-y-0.5">
                                    <strong className="block font-bold text-amber-950">
                                        Perhatian: Mode PPN Aktif
                                    </strong>
                                    <p className="text-[11px] leading-relaxed text-amber-800">
                                        Proyek ini menggunakan{' '}
                                        <strong>Mode PPN</strong>. Sesuai aturan
                                        perpajakan, seluruh vendor mitra wajib
                                        berstatus{' '}
                                        <strong>
                                            PKP (memiliki NPWP di Master Vendor)
                                        </strong>
                                        . Baris data yang mencantumkan vendor
                                        Non-PKP akan otomatis ditolak dan
                                        dilarang diimpor ke sistem.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Dropzone File Upload Area */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv, .txt, text/csv, application/vnd.ms-excel"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="shadow-xs mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 transition-transform group-hover:scale-110 group-hover:text-emerald-600">
                                <svg
                                    className="h-7 w-7"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.8}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            </div>
                            {selectedFile ? (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-emerald-800">
                                        File Terpilih: {selectedFile.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {(selectedFile.size / 1024).toFixed(1)}{' '}
                                        KB &bull; Klik atau seret file lain
                                        untuk mengganti
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-700">
                                        Seret file ke sini atau{' '}
                                        <span className="text-emerald-600 underline">
                                            pilih dari komputer
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Format didukung: CSV (BOM UTF-8) / Excel
                                        Spreadsheet (Maks. 5MB)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={handleClose}
                                disabled={isUploading}
                            >
                                Batal
                            </SecondaryButton>
                            <PrimaryButton
                                type="button"
                                onClick={handleUploadAndPreview}
                                disabled={!selectedFile || isUploading}
                                isLoading={isUploading}
                                loadingText="Membaca File..."
                            >
                                Unggah & Review Data
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Step 2: Review / Preview Table */}
                {step === 'preview' && (
                    <div className="space-y-4">
                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    {summary.valid_rows} Titik Siap Diimpor
                                </span>
                                {parsingErrors.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-100/80 px-3 py-1.5 text-xs font-bold text-rose-800">
                                        <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                                        {parsingErrors.length} Baris Dilewati /
                                        Error
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                                Total Baris Data: {summary.total_rows}
                            </span>
                        </div>

                        {/* Error Notification List */}
                        {parsingErrors.length > 0 && (
                            <div className="max-h-36 overflow-y-auto rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
                                <p className="mb-1 font-bold">
                                    Catatan Peringatan / Baris Dilewati:
                                </p>
                                <ul className="list-inside list-disc space-y-0.5 text-[11px]">
                                    {parsingErrors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preview Table */}
                        <div className="max-h-[380px] overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200/90 bg-white">
                            <table className="w-full border-collapse text-left text-xs text-slate-700">
                                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <tr>
                                        <th className="px-3 py-2.5">No</th>
                                        <th className="px-3 py-2.5">
                                            Kode Vendor
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Nama Vendor
                                        </th>
                                        <th className="px-3 py-2.5">Area</th>
                                        <th className="px-3 py-2.5">
                                            Keterangan Titik
                                        </th>
                                        <th className="px-3 py-2.5">Jenis</th>
                                        <th className="px-3 py-2.5">Ukuran</th>
                                        <th className="px-3 py-2.5">O/P</th>
                                        <th className="px-3 py-2.5 text-center">
                                            Qty
                                        </th>
                                        <th className="px-3 py-2.5 text-right">
                                            Biaya DPP (Rp)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {previewItems.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-slate-50/60"
                                        >
                                            <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                                                {idx + 1}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-bold text-slate-700">
                                                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5">
                                                    {item.vendor_code || '—'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-800">
                                                {item.vendor_name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-600">
                                                {item.area}
                                            </td>
                                            <td className="min-w-[180px] px-3 py-2 font-medium text-slate-800">
                                                {item.description}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2">
                                                <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-600">
                                                {item.size}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-[10px] font-bold text-slate-500">
                                                {item.orientation} &bull;{' '}
                                                {item.lighting === 'Berlampu'
                                                    ? '💡'
                                                    : '🌑'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-center font-bold text-slate-700">
                                                {item.qty}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-bold text-slate-800">
                                                {fmt(item.vendor_cost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep('upload')}
                                disabled={isSubmitting}
                                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Ganti File
                            </button>
                            <div className="flex items-center gap-3">
                                <SecondaryButton
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton
                                    type="button"
                                    onClick={handleConfirmImport}
                                    disabled={
                                        previewItems.length === 0 ||
                                        isSubmitting
                                    }
                                    isLoading={isSubmitting}
                                    loadingText="Menyimpan Titik..."
                                >
                                    Konfirmasi & Simpan {previewItems.length}{' '}
                                    Titik Lokasi
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
