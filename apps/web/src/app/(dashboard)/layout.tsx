import type { Metadata } from 'next'
import { Sidebar } from '@/components/dashboard/sidebar'
import { AuthGuard } from '@/components/dashboard/guard'
import { SSEProvider } from '@/components/dashboard/SSEProvider'
import { WelcomeToast } from '@/components/dashboard/WelcomeToast'
import TomasCommandBar from '@/components/tomas/TomasCommandBar'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SSEProvider>
        <div className="dark flex flex-col md:flex-row h-screen overflow-hidden bg-gray-950">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-950 pt-14 md:pt-0">
            <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
              <TomasCommandBar />
            </div>
            {children}
          </main>
          <WelcomeToast />
        </div>
      </SSEProvider>
    </AuthGuard>
  )
}
