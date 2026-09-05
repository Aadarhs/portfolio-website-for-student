'use client'

export interface HeroData {
  titleLine1: string
  titleLine2: string
  subtitle: string
  githubUrl: string
  linkedinUrl: string
  email: string
}

export interface AboutData {
  paragraphs: string[]
  stats: { value: string; label: string }[]
}

export interface SkillCategory {
  title: string
  icon: string
  skills: string[]
}

export interface SkillsData {
  categories: SkillCategory[]
}

export interface Project {
  title: string
  slug: string
  description: string
  technologies: string[]
  githubUrl: string
  demoUrl: string
}

export interface ProjectsData {
  projects: Project[]
}

export interface Experience {
  title: string
  company: string
  period: string
  description: string
  skills: string[]
}

export interface ExperienceData {
  experiences: Experience[]
}

export interface EducationEntry {
  degree: string
  institution: string
  period: string
  gpa: string
  highlights: string[]
}

export interface EducationData {
  education: EducationEntry[]
}

export interface Certification {
  title: string
  issuer: string
  issueDate: string
  credentialUrl: string
  description: string
  status: string
}

export interface CertificationsData {
  certifications: Certification[]
}

export interface ContactData {
  email: string
  phone: string
  githubUrl: string
  linkedinUrl: string
}

export interface NavigationData {
  logoText: string
  navItems: string[]
}

export interface PortfolioData {
  hero: HeroData
  about: AboutData
  skills: SkillsData
  projects: ProjectsData
  experience: ExperienceData
  education: EducationData
  certifications: CertificationsData
  contact: ContactData
  navigation: NavigationData
}

export const defaultPortfolioData: PortfolioData = {
  hero: {
    titleLine1: 'Cybersecurity',
    titleLine2: 'Student & Enthusiast',
    subtitle: 'Exploring the fundamentals of IT security through hands-on labs, penetration testing, and defensive strategies.',
    githubUrl: 'https://github.com/Aadarhs',
    linkedinUrl: 'https://www.linkedin.com/in/aadarhs-bhandari/',
    email: 'Aadarsha9808@gmail.com',
  },
  about: {
    paragraphs: [
      "I'm a passionate IT student dedicated to understanding the complexities of cybersecurity. My journey in security has involved exploring various domains including network security, threat analysis, and ethical hacking practices. I believe in continuous learning and staying updated with the latest security trends and vulnerabilities.",
      "Through hands-on labs and real-world scenarios, I've developed a solid foundation in identifying security vulnerabilities, implementing defensive measures, and responding to security incidents. I'm excited to leverage this knowledge to contribute to organizations' security posture and help protect valuable assets.",
    ],
    stats: [
      { value: '5+', label: 'Labs Completed' },
      { value: '10+', label: 'Projects' },
      { value: '2+', label: 'Certifications' },
    ],
  },
  skills: {
    categories: [
      { title: 'Security Fundamentals', icon: 'Shield', skills: ['Network Security', 'Cryptography', 'Security Protocols', 'Risk Management', 'Compliance'] },
      { title: 'Technical Skills', icon: 'Code', skills: ['Python', 'Bash/Shell', 'JavaScript', 'SQL', 'HTML/CSS'] },
      { title: 'Network & Systems', icon: 'Network', skills: ['TCP/IP', 'DNS & DHCP', 'Firewalls', 'Linux/Windows', 'Virtual Machines'] },
      { title: 'Tools & Technologies', icon: 'Terminal', skills: ['Wireshark', 'Metasploit', 'Burp Suite', 'Nessus', 'Kali Linux'] },
      { title: 'Defensive Strategies', icon: 'Lock', skills: ['Intrusion Detection', 'Incident Response', 'Vulnerability Assessment', 'Security Hardening', 'Access Control'] },
      { title: 'Offensive Techniques', icon: 'Search', skills: ['Penetration Testing', 'Network Reconnaissance', 'Exploitation', 'Social Engineering Awareness', 'Web Security'] },
    ],
  },
  projects: {
    projects: [
      {
        title: 'Network Intrusion Detection System',
        slug: 'network-ids',
        description: 'Built a custom IDS using Python and Scapy to monitor network traffic and detect suspicious patterns. Implemented signature-based detection and alerting mechanisms.',
        technologies: ['Python', 'Scapy', 'Wireshark', 'Linux'],
        githubUrl: 'https://github.com/Aadarhs',
        demoUrl: 'https://github.com/Aadarhs',
      },
      {
        title: 'Web Application Security Scanner',
        slug: 'web-scanner',
        description: 'Developed an automated vulnerability scanner for web applications focusing on OWASP Top 10 vulnerabilities. Includes SQL injection, XSS, and CSRF detection.',
        technologies: ['JavaScript', 'Node.js', 'Burp Suite', 'SQL'],
        githubUrl: 'https://github.com/Aadarhs',
        demoUrl: 'https://github.com/Aadarhs',
      },
      {
        title: 'Cryptography Implementation Lab',
        slug: 'cryptography-lab',
        description: 'Implemented various encryption algorithms including AES, RSA, and hash functions from scratch. Explored symmetric and asymmetric cryptography concepts.',
        technologies: ['Python', 'Cryptography', 'Mathematics', 'Security Protocols'],
        githubUrl: 'https://github.com/Aadarhs',
        demoUrl: 'https://github.com/Aadarhs',
      },
      {
        title: 'Incident Response Playbook',
        slug: 'incident-response',
        description: 'Created comprehensive documentation for incident response procedures including detection, containment, and recovery steps for common attack vectors.',
        technologies: ['Documentation', 'Risk Management', 'Security Operations', 'Analysis'],
        githubUrl: 'https://github.com/Aadarhs',
        demoUrl: 'https://github.com/Aadarhs',
      },
      {
        title: 'Linux Hardening Guide',
        slug: 'linux-hardening',
        description: 'Documented systematic approach to hardening Linux systems including SSH configuration, firewall rules, and service management best practices.',
        technologies: ['Linux', 'Bash', 'Security Hardening', 'Systems Administration'],
        githubUrl: 'https://github.com/Aadarhs',
        demoUrl: 'https://github.com/Aadarhs',
      },
      {
        title: 'Malware Analysis Lab',
        slug: 'malware-analysis',
        description: 'Analyzed malware behavior in isolated environments using static and dynamic analysis techniques. Documented findings and indicators of compromise.',
        technologies: ['Reverse Engineering', 'Sandboxing', 'IDA Pro', 'Wireshark'],
        githubUrl: 'https://github.com/Aadarhs',
        demoUrl: 'https://github.com/Aadarhs',
      },
    ],
  },
  experience: {
    experiences: [
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
    ],
  },
  education: {
    education: [
      {
        degree: 'Bachelor of Science in Information Technology',
        institution: 'University Name',
        period: '2022 - 2026 (Expected)',
        gpa: 'GPA: 3.8/4.0',
        highlights: ['Cybersecurity Specialization', 'Network Administration', 'Systems Security', 'Security Architecture'],
      },
      {
        degree: 'Advanced Networking Fundamentals',
        institution: 'Online Learning Platform',
        period: '2023',
        gpa: 'Completed',
        highlights: ['Network Protocols', 'OSI Model', 'TCP/IP Stack', 'Network Troubleshooting'],
      },
      {
        degree: 'Introduction to Cybersecurity',
        institution: 'Community College',
        period: '2022 - 2023',
        gpa: 'Completed',
        highlights: ['Security Concepts', 'Risk Assessment', 'Compliance & Standards', 'Security Best Practices'],
      },
    ],
  },
  certifications: {
    certifications: [
      {
        title: 'CompTIA Security+',
        issuer: 'CompTIA',
        issueDate: 'Expected 2025',
        credentialUrl: '#',
        description: 'Comprehensive security certification covering network security, threat management, and compliance.',
        status: 'In Progress',
      },
      {
        title: 'Google Cybersecurity Professional Certificate',
        issuer: 'Google Career Certificates',
        issueDate: '2024',
        credentialUrl: '#',
        description: 'Earned through Coursera - covering security fundamentals, threat analysis, and incident response.',
        status: 'Completed',
      },
      {
        title: 'Certified Ethical Hacker (CEH) - Candidate',
        issuer: 'EC-Council',
        issueDate: 'Expected 2025',
        credentialUrl: '#',
        description: 'Currently pursuing CEH certification to validate penetration testing and hacking knowledge.',
        status: 'In Progress',
      },
      {
        title: 'Linux Essentials',
        issuer: 'Linux Professional Institute',
        issueDate: '2023',
        credentialUrl: '#',
        description: 'Certified Linux Essentials demonstrating proficiency in Linux command line and system administration.',
        status: 'Completed',
      },
    ],
  },
  contact: {
    email: 'Aadarsha9808@gmail.com',
    phone: '+977 9869419057',
    githubUrl: 'https://github.com/Aadarhs',
    linkedinUrl: 'https://www.linkedin.com/in/aadarhs-bhandari/',
  },
  navigation: {
    logoText: 'Aadarsha',
    navItems: ['About', 'Skills', 'Projects', 'Experience', 'Education', 'Contact'],
  },
}

const STORAGE_KEY = 'portfolio-data'

export function loadPortfolioData(): PortfolioData {
  if (typeof window === 'undefined') return defaultPortfolioData
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultPortfolioData, ...JSON.parse(stored) }
    }
  } catch {}
  return defaultPortfolioData
}

export function savePortfolioData(data: PortfolioData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
