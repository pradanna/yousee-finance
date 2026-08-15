import { z } from 'zod';

export const createProjectSchema = z
    .object({
        name: z.string().trim().min(1, 'Nama proyek wajib diisi.').max(255),
        clientId: z.string().min(1, 'Client wajib dipilih.'),
        salesId: z.string().optional(),
        startDate: z.string().min(1, 'Tanggal mulai wajib diisi.'),
        endDate: z.string().min(1, 'Tanggal selesai wajib diisi.'),
        targetQty: z
            .string()
            .min(1, 'Jumlah titik lokasi wajib diisi.')
            .regex(/^\d+$/, 'Jumlah titik lokasi harus berupa angka.')
            .refine(
                (v) => parseInt(v, 10) >= 1,
                'Jumlah titik lokasi minimal 1.',
            ),
        contractValue: z
            .string()
            .min(1, 'Nilai kontrak wajib diisi.')
            .refine(
                (v) => (parseInt(v.replace(/[^0-9]/g, ''), 10) || 0) > 0,
                'Nilai kontrak wajib diisi.',
            ),
        taxMode: z.enum(['dpp', 'inc']),
    })
    .refine(
        (data) =>
            !data.startDate ||
            !data.endDate ||
            new Date(data.startDate) <= new Date(data.endDate),
        {
            message:
                'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            path: ['endDate'],
        },
    );

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
