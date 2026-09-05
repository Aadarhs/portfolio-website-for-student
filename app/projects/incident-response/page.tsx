'use client'

import Link from 'next/link'
import { ArrowLeft, Github, AlertTriangle, FileText, Shield, Clock } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function IncidentResponsePage() {
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
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold glow-text">Incident Response Playbook</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Created comprehensive documentation for incident response procedures including detection, containment,
            and recovery steps for common attack vectors.
          </p>
        </div>

        <div className="glassmorphism p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {['Documentation', 'Risk Management', 'Security Operations', 'Analysis'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This project involves creating a detailed incident response playbook that organizations can use
            to effectively handle cybersecurity incidents. The playbook covers the full incident lifecycle
            from initial detection through post-incident analysis.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Each procedure is documented with clear steps, responsible roles, communication templates,
            and decision trees to guide responders through high-pressure situations.
          </p>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Playbook Sections</h2>
          <div className="space-y-4">
            {[
              { icon: Shield, phase: 'Phase 1: Preparation', desc: 'Establishing incident response capabilities, training, and tools before incidents occur' },
              { icon: AlertTriangle, phase: 'Phase 2: Detection & Analysis', desc: 'Identifying indicators of compromise, validating incidents, and assessing impact and scope' },
              { icon: Clock, phase: 'Phase 3: Containment', desc: 'Short-term and long-term containment strategies to limit damage and prevent spread' },
              { icon: FileText, phase: 'Phase 4: Eradication & Recovery', desc: 'Removing the threat from the environment and restoring systems to normal operation' },
              { icon: Shield, phase: 'Phase 5: Post-Incident Activity', desc: 'Lessons learned documentation, process improvements, and reporting' },
            ].map((item) => (
              <div key={item.phase} className="p-4 border border-white/10 rounded-lg flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{item.phase}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Attack Scenarios Covered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
            {[
              'Ransomware Attack',
              'Phishing Campaign',
              'Data Breach',
              'DDoS Attack',
              'Insider Threat',
              'Malware Infection',
              'Unauthorized Access',
              'Supply Chain Compromise',
            ].map((scenario) => (
              <div key={scenario} className="flex items-center gap-2 p-3 border border-white/10 rounded-lg">
                <span className="text-primary">&#9672;</span>
                <span className="text-sm">{scenario}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">What I Learned</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>- Structured incident response frameworks (NIST, SANS)</p>
            <p>- Communication and escalation procedures during incidents</p>
            <p>- Evidence preservation and chain of custody</p>
            <p>- Risk assessment and prioritization techniques</p>
            <p>- Post-incident review and continuous improvement processes</p>
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
