'use client'

import Link from 'next/link'
import { ArrowLeft, Github, ExternalLink, Shield, Terminal, Code, Network } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function NetworkIDSPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        {/* Header */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold glow-text">Network Intrusion Detection System</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Built a custom IDS using Python and Scapy to monitor network traffic and detect suspicious patterns.
            Implemented signature-based detection and alerting mechanisms.
          </p>
        </div>

        {/* Tech Stack */}
        <div className="glassmorphism p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {['Python', 'Scapy', 'Wireshark', 'Linux'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Overview */}
        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This project involved building a custom Network Intrusion Detection System (NIDS) from scratch using Python
            and the Scapy packet manipulation library. The system monitors live network traffic in real-time, analyzing
            packets for suspicious patterns and known attack signatures.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The IDS implements both signature-based detection (matching known attack patterns) and anomaly-based detection
            (identifying deviations from normal traffic baselines). When suspicious activity is detected, the system
            generates alerts with detailed information about the potential threat.
          </p>
        </div>

        {/* Features */}
        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Network, title: 'Real-time Traffic Monitoring', desc: 'Captures and analyzes network packets in real-time using Scapy' },
              { icon: Shield, title: 'Signature-based Detection', desc: 'Matches traffic against a database of known attack signatures' },
              { icon: Terminal, title: 'Alert System', desc: 'Generates detailed alerts for detected suspicious activities' },
              { icon: Code, title: 'Custom Rule Engine', desc: 'Flexible rule system for defining detection patterns' },
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

        {/* Architecture */}
        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Architecture</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>The system is built with a modular architecture consisting of:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">-</span>
                <span><strong className="text-foreground">Packet Capture Module:</strong> Uses Scapy to sniff network interfaces and capture raw packets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">-</span>
                <span><strong className="text-foreground">Protocol Parser:</strong> Dissects captured packets and extracts relevant fields for analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">-</span>
                <span><strong className="text-foreground">Detection Engine:</strong> Applies detection rules and signatures to parsed traffic data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">-</span>
                <span><strong className="text-foreground">Alert Manager:</strong> Handles alert generation, formatting, and notification delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">-</span>
                <span><strong className="text-foreground">Logging System:</strong> Records all detected events for forensic analysis and review</span>
              </li>
            </ul>
          </div>
        </div>

        {/* What I Learned */}
        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">What I Learned</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>- Deep packet inspection and protocol analysis</p>
            <p>- Network traffic normalization and baseline establishment</p>
            <p>- Signature creation and pattern matching algorithms</p>
            <p>- Real-time event processing and alert correlation</p>
            <p>- Linux network configuration and packet capture fundamentals</p>
          </div>
        </div>

        {/* Links */}
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
