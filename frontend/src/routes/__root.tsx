import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Navbar } from '../components/Navbar'

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center w-full">
        <Outlet />
      </main>
      
      <footer className="w-full py-6 text-center text-slate-500 text-sm border-t border-slate-800 mt-12">
        <p>© 2024 DropLink. Secure file sharing made simple.</p>
      </footer>
      
      <div className="fixed bottom-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
        <TanStackRouterDevtools />
      </div>
    </div>
  ),
})
