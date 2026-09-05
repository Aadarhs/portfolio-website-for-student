'use client'

import { ExternalLink, Github, ArrowRight } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'
import Link from 'next/link'

export default function Projects() {
  const data = usePortfolioData()

  return (
    <section id="projects" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Projects & Lab Work</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.projects.projects.map((project) => (
            <div
              key={project.title}
              className="glassmorphism p-6 space-y-4 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
            >
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {project.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed">{project.description}</p>

              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/30"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Link
                  href={`/projects/${project.slug}`}
                  className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-medium"
                >
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  Code
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
