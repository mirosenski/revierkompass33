import { createFileRoute } from '@tanstack/react-router'
import { HeroSection } from '../components/sections/HeroSection'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeroSection />
    </div>
  )
} 