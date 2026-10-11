export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const dateLong = (iso: string) =>
  new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

export const timeShort = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86400000)

export const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export const uid = () => Math.random().toString(36).slice(2, 9)
