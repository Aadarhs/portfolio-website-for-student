'use client'

import { Briefcase, Calendar } from 'lucide-react'

export default function Experience() {
  const experiences = [
    {
      title: 'Security Lab Assistant',
      company: 'University IT Department',
      period: '2024 - Present',
      description: 'Assisted in setting up and maintaining cybersecurity lab environment. Supported students in hands-on exercises and troubleshooted security tools.',
      skills: ['Lab Management', 'Linux/Windows', 'Security Tools', 'Technical Support'],
    },
    {
      title: 'Penetration Testing Intern',
      company: 'Security Startup',
      period: '2023 - 2024',
      description: 'Conducted authorized penetration tests on client networks. Documented vulnerabilities and provided remediation recommendations.',
      skills: ['Penetration Testing', 'Vulnerability Assessment', 'Report Writing', 'Client Communication'],
    },
    {
      title: 'Network Security Trainee',
      company: 'IT Solutions Company',
      period: '2023',
      description: 'Learned network security fundamentals and assisted in monitoring network infrastructure for security threats and anomalies.',
      skills: ['Network Monitoring', 'IDS/IPS', 'Incident Response', 'Documentation'],
    },
  ]

  return (
    <section id="experience" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Experience</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <div key={exp.title} className="relative">
              {/* Timeline line */}
              {index !== experiences.length - 1 && (
                <div className="absolute left-8 top-20 w-1 h-16 bg-gradient-to-b from-primary/50 to-transparent" />
              )}

              <div className="flex gap-6">
                {/* Timeline dot */}
                <div className="relative z-10 pt-1">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-cyan-500/50" />
                </div>

                {/* Content */}
                <div className="glassmorphism p-6 space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{exp.title}</h3>
                      <p className="text-primary font-medium">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      {exp.period}
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{exp.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {exp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-sm bg-white/5 border border-white/10 text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
