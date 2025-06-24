import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <html>
      <head>
        <title>Revierkompass</title>
      </head>
      <body>
        <div>
          <Outlet />
        </div>
      </body>
    </html>
  ),
}) 