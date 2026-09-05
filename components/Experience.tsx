'use client'

import { Briefcase, Calendar } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'

export default function Experience() {
  const data = usePortfolioData()

  return (
    <section id="experience" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Experience</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="space-y-8">
          {data.experience.experiences.map((exp, index) => (
            <div key={exp.title + index} className="relative">
              {index !== data.experience.experiences.length - 1 && (
                <div className="absolute left-8 top-20 w-1 h-16 bg-gradient-to-b from-primary/50 to-transparent" />
              )}

              <div className="flex gap-6">
                <div className="relative z-10 pt-1">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-cyan-500/50" />
                </div>

                <div className="glassmorphism p-6 space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{exp.title}</h3>
                      <p className="text-primary font-medium">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      {exp.period}
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{exp.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {exp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-sm bg-white/5 border border-white/10 text-foreground"
                      >
                        {skill}
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
