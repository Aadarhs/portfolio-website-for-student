'use client'

import Link from 'next/link'
import { ArrowLeft, Github, ExternalLink, Search, Shield, Terminal, Code } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function WebScannerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold glow-text">Web Application Security Scanner</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Developed an automated vulnerability scanner for web applications focusing on OWASP Top 10 vulnerabilities.
            Includes SQL injection, XSS, and CSRF detection.
          </p>
        </div>

        <div className="glassmorphism p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {['JavaScript', 'Node.js', 'Burp Suite', 'SQL'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This project is an automated web application security scanner designed to identify vulnerabilities based on
            the OWASP Top 10. The scanner crawls target web applications, injects test payloads, and analyzes responses
            to detect common security flaws.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The tool automates the process of security testing that would otherwise require manual effort with tools like
            Burp Suite. It generates comprehensive reports detailing discovered vulnerabilities with severity ratings and
            remediation recommendations.
          </p>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Search, title: 'SQL Injection Detection', desc: 'Tests for union-based, blind, and time-based SQL injection vulnerabilities' },
              { icon: Shield, title: 'XSS Detection', desc: 'Identifies reflected, stored, and DOM-based cross-site scripting flaws' },
              { icon: Code, title: 'CSRF Analysis', desc: 'Checks for missing anti-CSRF tokens and vulnerable state-changing operations' },
              { icon: Terminal, title: 'Automated Crawling', desc: 'Discovers pages, forms, and endpoints systematically' },
            ].map((feature) => (
              <div key={feature.title} className="p-4 border border-white/10 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">OWASP Top 10 Coverage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
            {[
              'A01: Broken Access Control',
              'A02: Cryptographic Failures',
              'A03: Injection (SQL, NoSQL, LDAP)',
              'A04: Insecure Design',
              'A05: Security Misconfiguration',
              'A06: Vulnerable Components',
              'A07: Authentication Failures',
              'A08: Data Integrity Failures',
              'A09: Logging & Monitoring Failures',
              'A10: Server-Side Request Forgery',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 p-3 border border-white/10 rounded-lg">
                <span className="text-primary">&#10003;</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">What I Learned</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>- Web application security testing methodologies</p>
            <p>- HTTP request/response analysis and manipulation</p>
            <p>- Payload crafting for various vulnerability types</p>
            <p>- Automated security reporting and documentation</p>
            <p>- Integration with existing security tools like Burp Suite</p>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="https://github.com/Aadarhs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105"
          >
            <Github className="h-5 w-5" />
            View Source Code
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
