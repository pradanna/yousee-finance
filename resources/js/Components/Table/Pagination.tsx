interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage = 10,
    className = '',
}: PaginationProps) {
    if (totalPages <= 1 && !totalItems) return null;

    const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = totalItems
        ? Math.min(currentPage * itemsPerPage, totalItems)
        : 0;

    // Generate page numbers array
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <div
            className={`flex flex-col gap-4 border-t border-slate-100 bg-slate-50/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
        >
            {/* Info text */}
            {totalItems !== undefined && (
                <div className="text-xs font-semibold text-slate-500">
                    Menampilkan{' '}
                    <span className="font-bold text-slate-800">
                        {startItem}
                    </span>{' '}
                    -{' '}
                    <span className="font-bold text-slate-800">{endItem}</span>{' '}
                    dari{' '}
                    <span className="font-bold text-slate-800">
                        {totalItems}
                    </span>{' '}
                    data
                </div>
            )}
            {totalItems === undefined && <div />}

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                {/* Previous Button */}
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="shadow-2xs cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Halaman Sebelumnya"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                {/* Page Numbers */}
                {pages.map((p, idx) => {
                    if (typeof p === 'string') {
                        return (
                            <span
                                key={`dots-${idx}`}
                                className="select-none px-2 text-xs font-bold text-slate-400"
                            >
                                ...
                            </span>
                        );
                    }
                    const isCurrent = p === currentPage;
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                isCurrent
                                    ? 'shadow-xs bg-primary text-white shadow-neon-primary'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            {p}
                        </button>
                    );
                })}

                {/* Next Button */}
                <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="shadow-2xs cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Halaman Selanjutnya"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
