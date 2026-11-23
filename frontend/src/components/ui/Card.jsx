import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, title, description, action }) => {
  return (
    <div className={cn('p-5 border-b border-slate-100 flex items-center justify-between', className)}>
      <div>
        {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent = ({ children, className }) => {
  return <div className={cn('p-5', className)}>{children}</div>;
};

export const CardFooter = ({ children, className }) => {
  return <div className={cn('px-5 py-4 bg-slate-50/50 border-t border-slate-100 rounded-b-xl', className)}>{children}</div>;
};
