import React, { useMemo } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/utils/style';

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  siblingCount?: number;
};

type PaginationItemType = number | 'ellipsis';

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className,
  siblingCount = 1,
}) => {
  const items = useMemo<PaginationItemType[]>(() => {
    const normalizedTotalPages = Math.max(0, Math.floor(totalPages));
    const normalizedSiblingCount = Math.max(0, Math.floor(siblingCount));

    if (normalizedTotalPages <= 0) {
      return [];
    }

    const rawPages = Array.from(
      { length: normalizedTotalPages },
      (_, index) => index + 1
    ).filter(
      (pageNumber) =>
        pageNumber === 1 ||
        pageNumber === normalizedTotalPages ||
        Math.abs(pageNumber - page) <= normalizedSiblingCount
    );

    const parsed: PaginationItemType[] = [];

    rawPages.forEach((pageNumber, index) => {
      const previousPage = rawPages[index - 1];
      if (index > 0 && previousPage && pageNumber - previousPage > 1) {
        parsed.push('ellipsis');
      }

      parsed.push(pageNumber);
    });

    return parsed;
  }, [page, siblingCount, totalPages]);

  if (totalPages <= 1 || items.length === 0) {
    return null;
  }

  const isPrevDisabled = disabled || page <= 1;
  const isNextDisabled = disabled || page >= totalPages;

  const handleChange = (nextPage: number) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages) {
      return;
    }

    onPageChange(nextPage);
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={isPrevDisabled}
            tabIndex={isPrevDisabled ? -1 : undefined}
            className={cn(isPrevDisabled && 'pointer-events-none opacity-50')}
            onClick={(event) => {
              event.preventDefault();
              if (!isPrevDisabled) {
                handleChange(page - 1);
              }
            }}
          />
        </PaginationItem>

        {items.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const pageNumber = item;
          const isActive = pageNumber === page;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={isActive}
                aria-disabled={disabled && !isActive}
                tabIndex={disabled && !isActive ? -1 : undefined}
                className={cn(
                  disabled && !isActive && 'pointer-events-none opacity-50'
                )}
                onClick={(event) => {
                  event.preventDefault();
                  if (!disabled && !isActive) {
                    handleChange(pageNumber);
                  }
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={isNextDisabled}
            tabIndex={isNextDisabled ? -1 : undefined}
            className={cn(isNextDisabled && 'pointer-events-none opacity-50')}
            onClick={(event) => {
              event.preventDefault();
              if (!isNextDisabled) {
                handleChange(page + 1);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;
