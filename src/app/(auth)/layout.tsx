import { Logo } from '@/components/layout/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-8">
      <Logo href="/" stacked />
      {children}
    </main>
  )
}
