'use client'

import { useState, FormEvent } from 'react'
import { Mail, Phone, Linkedin, Github } from 'lucide-react'
import { usePortfolioData } from '@/lib/use-portfolio'

export default function Contact() {
  const data = usePortfolioData()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const mailtoLink = `mailto:${data.contact.email}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`
    window.location.href = mailtoLink
    setStatus('success')
    setStatusMessage('Opening your email client...')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <section id="contact" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Get In Touch</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="glassmorphism p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <a href={`mailto:${data.contact.email}`} className="text-foreground hover:text-primary transition-colors">
                    {data.contact.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="glassmorphism p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <a href={`tel:${data.contact.phone.replace(/\s/g, '')}`} className="text-foreground hover:text-accent transition-colors">
                    {data.contact.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-foreground font-semibold">Follow Me</p>
              <div className="flex gap-4">
                <a
                  href={data.contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                  aria-label="GitHub"
                >
                  <Github className="h-6 w-6 text-primary" />
                </a>
                <a
                  href={data.contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-6 w-6 text-primary" />
                </a>
                <a
                  href={`mailto:${data.contact.email}`}
                  className="p-3 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="h-6 w-6 text-primary" />
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glassmorphism p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Message subject"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="Your message here..."
                />
              </div>

              {status !== 'idle' && (
                <div
                  className={`p-4 rounded-lg ${
                    status === 'success'
                      ? 'bg-accent/20 border border-accent/30 text-accent'
                      : status === 'error'
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                        : 'bg-primary/20 border border-primary/30 text-primary'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
