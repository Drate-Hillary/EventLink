import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

export function DatePicker({ id, value, onChange, placeholder = 'Pick a date', disablePast }: {
  id?: string; value: string; onChange: (iso: string) => void; placeholder?: string; disablePast?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? fromIso(value) : undefined
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className={cn('w-full justify-start font-normal', !selected && 'text-muted-foreground')}>
          <CalendarIcon /> {selected ? selected.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={(d) => { if (d) { onChange(toIso(d)); setOpen(false) } }} disabled={disablePast ? { before: today } : undefined} autoFocus />
      </PopoverContent>
    </Popover>
  )
}
