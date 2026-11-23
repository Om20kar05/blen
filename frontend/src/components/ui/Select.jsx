import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(({
  className,
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  required,
  children,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer',
          error && 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
