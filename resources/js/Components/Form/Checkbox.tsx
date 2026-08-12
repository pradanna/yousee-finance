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
                'shadow-2xs rounded border-slate-300 text-blue-600 focus:ring-blue-500 ' +
                className
            }
        />
    );
}
