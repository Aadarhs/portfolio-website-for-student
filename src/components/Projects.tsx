import { ExternalLink, Github } from 'lucide-react'

export default function Projects() {
  const projects = [
    {
      title: 'Network Intrusion Detection System',
      description: 'Built a custom IDS using Python and Scapy to monitor network traffic and detect suspicious patterns. Implemented signature-based detection and alerting mechanisms.',
      technologies: ['Python', 'Scapy', 'Wireshark', 'Linux'],
      links: {
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    },
    {
      title: 'Web Application Security Scanner',
      description: 'Developed an automated vulnerability scanner for web applications focusing on OWASP Top 10 vulnerabilities. Includes SQL injection, XSS, and CSRF detection.',
      technologies: ['JavaScript', 'Node.js', 'Burp Suite', 'SQL'],
      links: {
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    },
    {
      title: 'Cryptography Implementation Lab',
      description: 'Implemented various encryption algorithms including AES, RSA, and hash functions from scratch. Explored symmetric and asymmetric cryptography concepts.',
      technologies: ['Python', 'Cryptography', 'Mathematics', 'Security Protocols'],
      links: {
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    },
    {
      title: 'Incident Response Playbook',
      description: 'Created comprehensive documentation for incident response procedures including detection, containment, and recovery steps for common attack vectors.',
      technologies: ['Documentation', 'Risk Management', 'Security Operations', 'Analysis'],
      links: {
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    },
    {
      title: 'Linux Hardening Guide',
      description: 'Documented systematic approach to hardening Linux systems including SSH configuration, firewall rules, and service management best practices.',
      technologies: ['Linux', 'Bash', 'Security Hardening', 'Systems Administration'],
      links: {
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    },
    {
      title: 'Malware Analysis Lab',
      description: 'Analyzed malware behavior in isolated environments using static and dynamic analysis techniques. Documented findings and indicators of compromise.',
      technologies: ['Reverse Engineering', 'Sandboxing', 'IDA Pro', 'Wireshark'],
      links: {
        github: 'https://github.com',
        demo: 'https://github.com',
      },
    },
  ]

  return (
    <section id="projects" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Projects & Lab Work</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.title}
              className="glassmorphism p-6 space-y-4 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
            >
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {project.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/30"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
                >
                  <Github className="h-4 w-4" />
                  Code
                </a>
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
