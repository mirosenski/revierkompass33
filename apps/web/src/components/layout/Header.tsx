import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { User, Menu } from 'lucide-react'
import { ModeToggle } from '../theme-provider'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  // Ist aktueller Pfad im Wizard?
  const isWizard = location.pathname.startsWith('/wizard')

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm">RK</span>
              </div>
              <span className="text-xl font-bold text-foreground">RevierKompass</span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link
              to="/wizard/step1"
              className={`text-muted-foreground hover:text-primary transition-colors ${isWizard ? 'text-primary font-medium' : ''}`}
            >
              Wizard
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              Über uns
            </Link>
          </nav>

          {/* Admin + Login Buttons */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggler */}
            <ModeToggle />

            {/* Login Button */}
            <Link
              to="/login"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary/90 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
              <Link to="/" className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/wizard/step1" className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors">Wizard</Link>
              <Link to="/about" className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors">Über uns</Link>
              <Link to="/login" className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors">Login</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 