import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <h3>Willkommen beim Revierkompass!</h3>
      <p>Hier finden Sie alles rund um Ihr Revier.</p>
    </div>
  )
} 