import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'space-y-3',
        month_caption: 'flex h-9 items-center justify-center',
        caption_label: 'text-sm font-bold',
        nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
        button_previous: cn(buttonVariants({ variant: 'outline' }), 'h-8 w-8 p-0'),
        button_next: cn(buttonVariants({ variant: 'outline' }), 'h-8 w-8 p-0'),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-10 text-[0.8rem] font-medium text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'h-10 w-10 p-0 text-center text-sm',
        day_button: cn(buttonVariants({ variant: 'ghost' }), 'h-10 w-10 p-0 font-medium aria-selected:opacity-100'),
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary',
        today: '[&>button]:border [&>button]:border-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-30',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (orientation === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
