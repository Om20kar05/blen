import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 rounded-b-xl text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-700">{startRecord}</span> to{' '}
        <span className="font-semibold text-slate-700">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Previous
        </Button>
        <div className="px-2 text-xs font-medium text-slate-600">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
