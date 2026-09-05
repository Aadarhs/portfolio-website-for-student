'use client'

import Link from 'next/link'
import { ArrowLeft, Github, Terminal, Shield, Lock, Server } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function LinuxHardeningPage() {
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
              <Terminal className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold glow-text">Linux Hardening Guide</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Documented systematic approach to hardening Linux systems including SSH configuration,
            firewall rules, and service management best practices.
          </p>
        </div>

        <div className="glassmorphism p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {['Linux', 'Bash', 'Security Hardening', 'Systems Administration'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This project provides a comprehensive guide for hardening Linux systems against common attack vectors.
            It covers security configurations from kernel parameters to service-level controls, providing both
            manual steps and automated scripts for implementation.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The guide is designed for system administrators and security professionals who need to secure Linux
            servers in production environments. Each recommendation includes the rationale behind the change
            and potential impacts on system functionality.
          </p>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Hardening Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Lock, title: 'SSH Configuration', desc: 'Key-based auth, disabled root login, port changes, and access restrictions' },
              { icon: Shield, title: 'Firewall Rules', desc: 'iptables/nftables configuration for inbound/outbound traffic filtering' },
              { icon: Server, title: 'Service Management', desc: 'Disabling unnecessary services and configuring service-level controls' },
              { icon: Terminal, title: 'User & Permissions', desc: 'Password policies, sudo configuration, and file permission hardening' },
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
          <h2 className="text-2xl font-bold">Checklist Categories</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>- Kernel parameter tuning (sysctl.conf)</p>
            <p>- Network security configuration</p>
            <p>- File system permissions and mount options</p>
            <p>- Audit logging and monitoring (auditd)</p>
            <p>- Cron job review and scheduled task security</p>
            <p>- Package management and update policies</p>
            <p>- Boot loader security (GRUB)</p>
            <p>- Core dump restrictions</p>
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">What I Learned</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>- Linux security architecture and attack surfaces</p>
            <p>- Defense-in-depth principles for system hardening</p>
            <p>- Balancing security with operational usability</p>
            <p>- Automated compliance checking and reporting</p>
            <p>- CIS Benchmark and STIG compliance standards</p>
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
