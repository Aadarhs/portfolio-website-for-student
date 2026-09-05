'use client'

import { usePortfolioData } from '@/lib/use-portfolio'

export default function About() {
  const data = usePortfolioData()

  return (
    <section id="about" className="py-20 scroll-mt-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">About Me</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="glassmorphism p-8 space-y-6">
          {data.about.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-lg text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
            {data.about.stats.map((stat, i) => (
              <div key={i} className="p-4 border border-white/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
