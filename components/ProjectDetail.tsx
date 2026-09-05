'use client'

import Link from 'next/link'
import { ArrowLeft, Github, ExternalLink, Search, Shield, Lock, Terminal, Server, FolderGit2, Code } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { usePortfolioData } from '@/lib/use-portfolio'

const projectIcons: Record<string, LucideIcon> = {
  'network-ids': Shield,
  'web-scanner': Search,
  'cryptography-lab': Lock,
  'incident-response': Code,
  'linux-hardening': Server,
  'malware-analysis': Terminal,
}

export default function ProjectDetail({ slug }: { slug: string }) {
  const data = usePortfolioData()
  const project = data.projects.projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <h1 className="text-3xl font-bold glow-text mb-4">Project not found</h1>
          <p className="text-muted-foreground mb-8">The project &quot;{slug}&quot; doesn&apos;t exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const Icon = projectIcons[slug] || FolderGit2
  const hasDemo = Boolean(project.demoUrl) && project.demoUrl !== project.githubUrl

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold glow-text">{project.title}</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">{project.description}</p>
        </div>

        <div className="glassmorphism p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-muted-foreground leading-relaxed">{project.description}</p>
          <p className="text-sm text-muted-foreground">
            Manage this project&apos;s details (title, links, demo URL, technologies) from the Asura admin panel.
          </p>
        </div>

        <div className="flex gap-4">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105"
            >
              <Github className="h-5 w-5" />
              View Source Code
            </a>
          )}
          {hasDemo && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 border border-primary/50 text-primary font-semibold rounded-lg hover:bg-primary/10 transition-all hover:scale-105"
            >
              <ExternalLink className="h-5 w-5" />
              Live Demo
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}