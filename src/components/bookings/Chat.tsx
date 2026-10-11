import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import { useStore } from '../../features/store'
import type { Thread } from '../../types'
import { dateLong, timeShort } from '../../utils/format'
import { Avatar, EmptyState } from '../ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

/** Two-pane inbox shared by customers and providers. `side` decides who "I" am. */
export function Chat({ side, threads, nameOf, initialId, subtitleOf }: { side: 'customer' | 'provider'; threads: Thread[]; nameOf: (t: Thread) => string; initialId?: string | null; subtitleOf?: (t: Thread) => string | undefined }) {
  const { sendMessage, markRead } = useStore()
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const active = threads.find((t) => t.id === activeId) ?? null
  const count = active?.messages.length

  useEffect(() => { if (activeId) markRead(activeId) }, [activeId, markRead])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [activeId, count])

  if (threads.length === 0) {
    return <EmptyState icon={MessageSquare} title="No conversations yet" text="Messages appear here as soon as someone gets in touch." />
  }

  const send = () => {
    if (!active || !text.trim()) return
    sendMessage(active.id, side, text.trim())
    setText('')
  }

  return (
    <Card className={`grid overflow-hidden md:h-[calc(100vh-14rem)] md:min-h-[28rem] md:grid-cols-[300px_1fr] ${active ? 'h-[calc(100dvh-10rem)] min-h-[26rem]' : ''}`}>
      <ul className={`divide-y divide-soft overflow-y-auto ${active ? 'hidden md:block' : ''}`} aria-label="Conversations">
        {threads.map((t) => {
          const last = t.messages[t.messages.length - 1]
          return (
            <li key={t.id}>
              <button onClick={() => setActiveId(t.id)} className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-ivory ${t.id === activeId ? 'bg-teal-50' : ''}`}>
                <Avatar name={nameOf(t)} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><span className="truncate font-bold">{nameOf(t)}</span>{t.unread > 0 && <span className="rounded-full bg-navy-900 px-2 text-xs font-bold text-white">{t.unread}</span>}</span>
                  {subtitleOf?.(t) && <span className="block truncate text-xs font-semibold text-slate-700">{subtitleOf(t)}</span>}
                  <span className="block truncate text-sm text-slate-500">{last ? last.text : 'Say hello'}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className={`flex min-h-0 flex-col ${active ? '' : 'hidden md:flex'}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-soft p-4">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveId(null)} aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Button>
              <Avatar name={nameOf(active)} size="sm" />
              <p className="font-bold">{nameOf(active)}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-ivory/60 p-4" aria-live="polite">
              {active.messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No messages yet. Ask about dates, packages or your venue.</p>}
              {active.messages.map((m, i) => {
                const mine = m.from === side
                const newDay = i === 0 || m.time.slice(0, 10) !== active.messages[i - 1].time.slice(0, 10)
                return (
                  <div key={m.id}>
                    {newDay && <p className="my-2 text-center text-xs text-slate-400">{dateLong(m.time.slice(0, 10))}</p>}
                    <div className={`flex ${mine ? 'justify-end' : ''}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'rounded-br-md bg-navy-900 text-white' : 'rounded-bl-md bg-white shadow-rounded-2xl border bg-card text-card-foreground shadow-card'}`}>
                        {m.text}
                        <span className={`mt-1 block text-[11px] ${mine ? 'text-slate-300' : 'text-slate-400'}`}>{timeShort(m.time)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>
            <form className="flex gap-2 border-t border-soft p-3" onSubmit={(e) => { e.preventDefault(); send() }}>
              <label className="sr-only" htmlFor="msg">Message</label>
              <Input id="msg"  placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} />
              <Button aria-label="Send message"><Send className="h-4 w-4" /></Button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-slate-500">Select a conversation</div>
        )}
      </div>
    </Card>
  )
}
