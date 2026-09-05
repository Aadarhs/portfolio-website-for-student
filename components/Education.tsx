'use client'

import { GraduationCap, Calendar } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'

export default function Education() {
  const data = usePortfolioData()

  return (
    <section id="education" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Education</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="space-y-8">
          {data.education.education.map((edu, index) => (
            <div key={edu.degree + index} className="relative">
              {index !== data.education.education.length - 1 && (
                <div className="absolute left-8 top-20 w-1 h-32 bg-gradient-to-b from-accent/50 to-transparent" />
              )}

              <div className="flex gap-6">
                <div className="relative z-10 pt-1">
                  <div className="w-4 h-4 rounded-full bg-accent shadow-lg shadow-green-500/50" />
                </div>

                <div className="glassmorphism p-6 space-y-4 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{edu.degree}</h3>
                      <p className="text-accent font-medium">{edu.institution}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      {edu.period}
                    </div>
                  </div>

                  <p className="text-primary font-medium">{edu.gpa}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {edu.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="px-3 py-1 rounded text-sm bg-accent/10 text-accent border border-accent/30"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
