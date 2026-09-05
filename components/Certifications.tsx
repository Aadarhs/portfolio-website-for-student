'use client'

import { Award, Calendar, ExternalLink } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'

export default function Certifications() {
  const data = usePortfolioData()

  return (
    <section id="certifications" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Certifications</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.certifications.certifications.map((cert) => (
            <div
              key={cert.title}
              className="glassmorphism p-6 space-y-4 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cert.title}
                    </h3>
                    <p className="text-muted-foreground">{cert.issuer}</p>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed">{cert.description}</p>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    {cert.issueDate}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'Completed'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-primary/20 text-primary border border-primary/30'
                    }`}
                  >
                    {cert.status}
                  </span>
                </div>

                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors group/link"
                >
                  View Credential
                  <ExternalLink className="h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
