import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = (props: ToasterProps) => (
  <Sonner
    toastOptions={{ classNames: { toast: '!rounded-xl !border-0 !bg-black !text-white !font-semibold !shadow-lift' } }}
    {...props}
  />
)
export { Toaster }
