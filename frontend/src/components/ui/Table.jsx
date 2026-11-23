import React from 'react';
import { cn } from '../../utils/cn';

export const Table = ({ children, className }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table className={cn('w-full text-left border-collapse text-sm', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className }) => {
  return (
    <thead className={cn('bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider', className)}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className }) => {
  return <tbody className={cn('divide-y divide-slate-100 text-slate-700', className)}>{children}</tbody>;
};

export const TableRow = ({ children, className, hover = true, ...props }) => {
  return (
    <tr
      className={cn(
        'transition-colors',
        hover && 'hover:bg-slate-50/80',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className }) => {
  return <th className={cn('py-3.5 px-4 font-semibold', className)}>{children}</th>;
};

export const TableCell = ({ children, className }) => {
  return <td className={cn('py-3.5 px-4 align-middle', className)}>{children}</td>;
};
