import * as React from 'react'
import { cn } from '@/lib/utils'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-x-auto">
    <table ref={ref} className={cn('w-full caption-bottom text-sm max-md:[&_thead]:hidden max-md:[&_tr]:block max-md:[&_tr]:px-4 max-md:[&_tr]:py-3 max-md:[&_td]:flex max-md:[&_td]:items-center max-md:[&_td]:justify-between max-md:[&_td]:gap-4 max-md:[&_td]:px-0 max-md:[&_td]:py-1.5 max-md:[&_td]:text-right max-md:[&_td]:before:text-xs max-md:[&_td]:before:font-semibold max-md:[&_td]:before:text-muted-foreground max-md:[&_td]:before:text-left max-md:[&_td]:before:content-[attr(data-label)] max-md:[&_td:first-child]:block max-md:[&_td:first-child]:text-left max-md:[&_td:first-child]:before:hidden', className)} {...props} />
  </div>
))
Table.displayName = 'Table'
const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />
))
TableRow.displayName = 'TableRow'
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn('h-12 px-4 text-left align-middle font-semibold text-muted-foreground', className)} {...props} />
))
TableHead.displayName = 'TableHead'
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle', className)} {...props} />
))
TableCell.displayName = 'TableCell'
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
