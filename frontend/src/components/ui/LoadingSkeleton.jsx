import React from 'react';
import { cn } from '../../utils/cn';

export const LoadingSkeleton = ({ className }) => {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/70', className)}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <LoadingSkeleton className="h-6 w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <LoadingSkeleton key={cIdx} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
