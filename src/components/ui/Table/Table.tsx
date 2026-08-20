import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-lg border border-muted bg-surface">
      <table className={cn('w-full caption-bottom text-sm', className)} {...rest} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={cn('bg-muted/40 [&_tr]:border-b border-muted', props.className)}
    />
  );
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...props} className={cn('[&_tr:last-child]:border-0', props.className)} />
  );
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn(
        'border-b border-muted transition-colors hover:bg-surface-hover even:bg-surface-hover/30',
        props.className,
      )}
    />
  );
}

export function TH(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        'h-11 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wide text-muted-foreground',
        props.className,
      )}
    />
  );
}

export function TD(props: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={cn('p-4 align-middle text-foreground', props.className)} />
  );
}
