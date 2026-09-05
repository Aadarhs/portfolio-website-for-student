'use client'

import { Github, Linkedin, Mail, Heart } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'

export default function Footer() {
  const data = usePortfolioData()

  return (
    <footer className="border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold glow-text">{data.navigation.logoText}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cybersecurity student passionate about protecting digital assets and building secure systems.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Quick Links</h4>
            <nav className="space-y-2">
              {data.navigation.navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Connect</h4>
            <div className="flex gap-3">
              <a
                href={data.contact.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-primary" />
              </a>
              <a
                href={data.contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-primary" />
              </a>
              <a
                href={`mailto:${data.contact.email}`}
                className="p-2 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-5 w-5 text-primary" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">{data.contact.email}</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {data.navigation.logoText}. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> for cybersecurity
          </p>
        </div>
      </div>
    </footer>
  )
}
