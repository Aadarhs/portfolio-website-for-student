'use client'

import { useState, FormEvent } from 'react'
import { Mail, Phone, Linkedin, Github } from 'lucide-react'

export default function Contact() {
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
    setStatus('loading')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setStatusMessage('Message sent successfully! I\'ll get back to you soon.')
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        })
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
        setStatusMessage(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setStatusMessage('An error occurred. Please try again later.')
      console.error('Form submission error:', error)
    }
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
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="glassmorphism p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <a href="mailto:Aadarsha9808@gmail.com" className="text-foreground hover:text-primary transition-colors">
                    Aadarsha9808@gmail.com
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
                  <a href="tel:+9779869419057" className="text-foreground hover:text-accent transition-colors">
                    +977 9869419057
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-foreground font-semibold">Follow Me</p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/Aadarhs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                  aria-label="GitHub"
                >
                  <Github className="h-6 w-6 text-primary" />
                </a>
                <a
                  href="https://www.linkedin.com/in/aadarhs-bhandari/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-6 w-6 text-primary" />
                </a>
                <a
                  href="mailto:Aadarsha9808@gmail.com"
                  className="p-3 glassmorphism rounded-lg hover:glow-primary transition-all hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="h-6 w-6 text-primary" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
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
