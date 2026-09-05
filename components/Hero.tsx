'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const data = usePortfolioData()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      opacity: number
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x - particle.radius < 0 || particle.x + particle.radius > canvas.width) {
          particle.vx *= -1
          particle.x = Math.max(particle.radius, Math.min(canvas.width - particle.radius, particle.x))
        }
        if (particle.y - particle.radius < 0 || particle.y + particle.radius > canvas.height) {
          particle.vy *= -1
          particle.y = Math.max(particle.radius, Math.min(canvas.height - particle.radius, particle.y))
        }

        ctx.fillStyle = `rgba(0, 217, 255, ${particle.opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.toLowerCase())
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-16">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 text-center space-y-8 px-4">
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-7xl font-bold text-balance">
            <span className="glow-text">{data.hero.titleLine1}</span>
            <br />
            <span className="text-foreground">{data.hero.titleLine2}</span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
            {data.hero.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            onClick={() => scrollToSection('projects')}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105"
          >
            View My Work
            <ArrowRight className="inline ml-2 h-5 w-5" />
          </button>

          <button
            onClick={() => scrollToSection('contact')}
            className="px-8 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors"
          >
            Get in Touch
          </button>
        </div>

        <div className="flex gap-6 justify-center pt-8">
          <a
            href={data.hero.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg glassmorphism hover:glow-primary transition-all hover:scale-110"
            aria-label="GitHub"
          >
            <Github className="h-6 w-6 text-primary" />
          </a>

          <a
            href={data.hero.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg glassmorphism hover:glow-primary transition-all hover:scale-110"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-6 w-6 text-primary" />
          </a>

          <a
            href={`mailto:${data.hero.email}`}
            className="p-3 rounded-lg glassmorphism hover:glow-primary transition-all hover:scale-110"
            aria-label="Email"
          >
            <Mail className="h-6 w-6 text-primary" />
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
