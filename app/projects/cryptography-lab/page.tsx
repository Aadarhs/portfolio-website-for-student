'use client'

import Link from 'next/link'
import { ArrowLeft, Github, Lock, Key, Hash, Shield } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function CryptographyLabPage() {
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
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold glow-text">Cryptography Implementation Lab</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Implemented various encryption algorithms including AES, RSA, and hash functions from scratch.
            Explored symmetric and asymmetric cryptography concepts.
          </p>
        </div>

        <div className="glassmorphism p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {['Python', 'Cryptography', 'Mathematics', 'Security Protocols'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This lab project involves implementing fundamental cryptographic algorithms from the ground up in Python.
            Rather than relying on high-level libraries, the goal was to understand the mathematical foundations
            and step-by-step processes behind modern encryption.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The implementation covers both symmetric (AES) and asymmetric (RSA) encryption, along with cryptographic
            hash functions. Each algorithm includes detailed documentation explaining the mathematical concepts
            and security considerations.
          </p>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Implemented Algorithms</h2>
          <div className="space-y-6">
            <div className="p-4 border border-white/10 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">AES (Advanced Encryption Standard)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Implemented the symmetric block cipher used worldwide. Includes SubBytes, ShiftRows, MixColumns,
                and AddRoundKey transformations with support for 128-bit, 192-bit, and 256-bit key sizes.
              </p>
            </div>

            <div className="p-4 border border-white/10 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">RSA Encryption</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Built the asymmetric cryptosystem from prime number generation through key pair creation,
                encryption, and decryption. Includes modular exponentiation and the extended Euclidean algorithm.
              </p>
            </div>

            <div className="p-4 border border-white/10 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Hash Functions</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Implemented SHA-256 and MD5 hash functions, understanding the Merkle-Damgard construction
                and the properties that make hash functions useful for integrity verification.
              </p>
            </div>
          </div>
        </div>

        <div className="glassmorphism p-8 mb-8 space-y-6">
          <h2 className="text-2xl font-bold">What I Learned</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>- Mathematical foundations of modern cryptography</p>
            <p>- Symmetric vs asymmetric encryption trade-offs</p>
            <p>- Key generation and management principles</p>
            <p>- Padding schemes and block cipher modes of operation</p>
            <p>- Cryptographic hash function properties and collision resistance</p>
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
