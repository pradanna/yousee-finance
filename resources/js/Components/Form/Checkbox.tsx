import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-slate-300 text-blue-600 shadow-2xs focus:ring-blue-500 ' +
                className
            }
        />
    );
}
