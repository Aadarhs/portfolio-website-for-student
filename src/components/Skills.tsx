import { Shield, Network, Code, Terminal, Lock, Search } from 'lucide-react'

export default function Skills() {
  const skillCategories = [
    {
      title: 'Security Fundamentals',
      icon: Shield,
      skills: ['Network Security', 'Cryptography', 'Security Protocols', 'Risk Management', 'Compliance'],
    },
    {
      title: 'Technical Skills',
      icon: Code,
      skills: ['Python', 'Bash/Shell', 'JavaScript', 'SQL', 'HTML/CSS'],
    },
    {
      title: 'Network & Systems',
      icon: Network,
      skills: ['TCP/IP', 'DNS & DHCP', 'Firewalls', 'Linux/Windows', 'Virtual Machines'],
    },
    {
      title: 'Tools & Technologies',
      icon: Terminal,
      skills: ['Wireshark', 'Metasploit', 'Burp Suite', 'Nessus', 'Kali Linux'],
    },
    {
      title: 'Defensive Strategies',
      icon: Lock,
      skills: ['Intrusion Detection', 'Incident Response', 'Vulnerability Assessment', 'Security Hardening', 'Access Control'],
    },
    {
      title: 'Offensive Techniques',
      icon: Search,
      skills: ['Penetration Testing', 'Network Reconnaissance', 'Exploitation', 'Social Engineering Awareness', 'Web Security'],
    },
  ]

  return (
    <section id="skills" className="py-20 scroll-mt-16">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">Skills & Expertise</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.title}
                className="glassmorphism p-6 space-y-4 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-sm bg-white/5 border border-white/10 text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
