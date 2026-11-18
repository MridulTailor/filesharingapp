import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'

export const Route = createRootRoute({
  component: () => (
    <div className="surface-page flex min-h-screen flex-col">
      <Navbar />

      <main className="flex w-full flex-1 justify-center px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  ),
})
