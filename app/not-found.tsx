'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e27] text-foreground flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl sm:text-8xl font-bold glow-text">404</h1>
        <p className="text-xl text-muted-foreground">This page has been breached.</p>
        <p className="text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105"
        >
          Return to Safety
        </Link>
      </div>
    </div>
  )
}
