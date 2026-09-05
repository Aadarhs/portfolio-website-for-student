'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import {
  PortfolioData,
  defaultPortfolioData,
  loadPortfolioData,
  savePortfolioData,
} from '@/lib/portfolio-data'

const sections = [
  'Hero',
  'About',
  'Skills',
  'Projects',
  'Experience',
  'Education',
  'Certifications',
  'Contact',
  'Navigation',
] as const

export default function AsuraPage() {
  const router = useRouter()
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData)
  const [activeSection, setActiveSection] = useState<string>('Hero')
  const [saved, setSaved] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setData(loadPortfolioData())
  }, [])

  const handleSave = () => {
    savePortfolioData(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('Reset all content to defaults?')) {
      setData(defaultPortfolioData)
      savePortfolioData(defaultPortfolioData)
    }
  }

  const update = (path: string, value: unknown) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj: Record<string, unknown> = next
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>
      }
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const inputClass =
    'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm'
  const labelClass = 'block text-sm font-medium text-muted-foreground mb-1'
  const btnClass =
    'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-medium'

  return (
    <div className="min-h-screen bg-[#0a0e27] text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold glow-text">Asura Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-colors">
              Reset Defaults
            </button>
            <button onClick={handleSave} className={btnClass}>
              <Save className="inline h-4 w-4 mr-1" />
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="glassmorphism rounded-lg p-2 space-y-1 sticky top-20">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 glassmorphism rounded-lg p-6 space-y-6">
          {activeSection === 'Hero' && (
            <HeroEditor data={data} update={update} inputClass={inputClass} labelClass={labelClass} />
          )}
          {activeSection === 'About' && (
            <AboutEditor data={data} update={update} inputClass={inputClass} labelClass={labelClass} />
          )}
          {activeSection === 'Skills' && (
            <SkillsEditor data={data} update={update} inputClass={inputClass} labelClass={labelClass} />
          )}
          {activeSection === 'Projects' && (
            <ProjectsEditor data={data} update={update} setData={setData} inputClass={inputClass} labelClass={labelClass} expandedItems={expandedItems} toggleItem={toggleItem} />
          )}
          {activeSection === 'Experience' && (
            <ExperienceEditor data={data} update={update} setData={setData} inputClass={inputClass} labelClass={labelClass} expandedItems={expandedItems} toggleItem={toggleItem} />
          )}
          {activeSection === 'Education' && (
            <EducationEditor data={data} update={update} setData={setData} inputClass={inputClass} labelClass={labelClass} expandedItems={expandedItems} toggleItem={toggleItem} />
          )}
          {activeSection === 'Certifications' && (
            <CertificationsEditor data={data} update={update} setData={setData} inputClass={inputClass} labelClass={labelClass} expandedItems={expandedItems} toggleItem={toggleItem} />
          )}
          {activeSection === 'Contact' && (
            <ContactEditor data={data} update={update} inputClass={inputClass} labelClass={labelClass} />
          )}
          {activeSection === 'Navigation' && (
            <NavigationEditor data={data} update={update} inputClass={inputClass} labelClass={labelClass} />
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  )
}

function HeroEditor({ data, update, inputClass, labelClass }: { data: PortfolioData; update: (path: string, value: unknown) => void; inputClass: string; labelClass: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hero Section</h2>
      <Field label="Title Line 1">
        <input className={inputClass} value={data.hero.titleLine1} onChange={(e) => update('hero.titleLine1', e.target.value)} />
      </Field>
      <Field label="Title Line 2">
        <input className={inputClass} value={data.hero.titleLine2} onChange={(e) => update('hero.titleLine2', e.target.value)} />
      </Field>
      <Field label="Subtitle">
        <textarea className={inputClass + ' resize-none'} rows={2} value={data.hero.subtitle} onChange={(e) => update('hero.subtitle', e.target.value)} />
      </Field>
      <Field label="GitHub URL">
        <input className={inputClass} value={data.hero.githubUrl} onChange={(e) => update('hero.githubUrl', e.target.value)} />
      </Field>
      <Field label="LinkedIn URL">
        <input className={inputClass} value={data.hero.linkedinUrl} onChange={(e) => update('hero.linkedinUrl', e.target.value)} />
      </Field>
      <Field label="Email">
        <input className={inputClass} value={data.hero.email} onChange={(e) => update('hero.email', e.target.value)} />
      </Field>
    </div>
  )
}

function AboutEditor({ data, update, inputClass }: { data: PortfolioData; update: (path: string, value: unknown) => void; inputClass: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">About Section</h2>
      {data.about.paragraphs.map((p, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Paragraph {i + 1}</span>
            {data.about.paragraphs.length > 1 && (
              <button
                onClick={() => {
                  const next = data.about.paragraphs.filter((_, idx) => idx !== i)
                  update('about.paragraphs', next)
                }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <textarea
            className={inputClass + ' resize-none'}
            rows={3}
            value={p}
            onChange={(e) => {
              const next = [...data.about.paragraphs]
              next[i] = e.target.value
              update('about.paragraphs', next)
            }}
          />
        </div>
      ))}
      <button
        onClick={() => update('about.paragraphs', [...data.about.paragraphs, ''])}
        className="text-primary text-sm hover:underline"
      >
        <Plus className="inline h-4 w-4 mr-1" /> Add Paragraph
      </button>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-lg font-semibold mb-4">Stats</h3>
        {data.about.stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-3 gap-3 mb-3">
            <input
              className={inputClass}
              value={stat.value}
              placeholder="Value"
              onChange={(e) => {
                const next = [...data.about.stats]
                next[i] = { ...next[i], value: e.target.value }
                update('about.stats', next)
              }}
            />
            <input
              className={inputClass}
              value={stat.label}
              placeholder="Label"
              onChange={(e) => {
                const next = [...data.about.stats]
                next[i] = { ...next[i], label: e.target.value }
                update('about.stats', next)
              }}
            />
            <button
              onClick={() => update('about.stats', data.about.stats.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-300 px-3"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => update('about.stats', [...data.about.stats, { value: '', label: '' }])}
          className="text-primary text-sm hover:underline"
        >
          <Plus className="inline h-4 w-4 mr-1" /> Add Stat
        </button>
      </div>
    </div>
  )
}

function SkillsEditor({ data, update, inputClass }: { data: PortfolioData; update: (path: string, value: unknown) => void; inputClass: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Skills Section</h2>
      {data.skills.categories.map((cat, i) => (
        <div key={i} className="glassmorphism p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <input
              className={inputClass + ' w-1/2'}
              value={cat.title}
              placeholder="Category Title"
              onChange={(e) => {
                const next = [...data.skills.categories]
                next[i] = { ...next[i], title: e.target.value }
                update('skills.categories', next)
              }}
            />
            <button
              onClick={() => update('skills.categories', data.skills.categories.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input
            className={inputClass + ' w-1/2'}
            value={cat.icon}
            placeholder="Icon name (Shield, Code, Network, Terminal, Lock, Search)"
            onChange={(e) => {
              const next = [...data.skills.categories]
              next[i] = { ...next[i], icon: e.target.value }
              update('skills.categories', next)
            }}
          />
          <div className="flex flex-wrap gap-2">
            {cat.skills.map((skill, j) => (
              <div key={j} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1">
                <input
                  className="bg-transparent text-sm w-28 focus:outline-none"
                  value={skill}
                  onChange={(e) => {
                    const next = [...data.skills.categories]
                    const skills = [...next[i].skills]
                    skills[j] = e.target.value
                    next[i] = { ...next[i], skills }
                    update('skills.categories', next)
                  }}
                />
                <button
                  onClick={() => {
                    const next = [...data.skills.categories]
                    next[i] = { ...next[i], skills: next[i].skills.filter((_, idx) => idx !== j) }
                    update('skills.categories', next)
                  }}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const next = [...data.skills.categories]
                next[i] = { ...next[i], skills: [...next[i].skills, 'New Skill'] }
                update('skills.categories', next)
              }}
              className="text-primary text-sm hover:underline"
            >
              + Add
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          update('skills.categories', [...data.skills.categories, { title: 'New Category', icon: 'Shield', skills: ['Skill 1'] }])
        }
        className="text-primary text-sm hover:underline"
      >
        <Plus className="inline h-4 w-4 mr-1" /> Add Category
      </button>
    </div>
  )
}

function ProjectsEditor({ data, setData, inputClass, expandedItems, toggleItem }: { data: PortfolioData; update: (path: string, value: unknown) => void; setData: React.Dispatch<React.SetStateAction<PortfolioData>>; inputClass: string; labelClass: string; expandedItems: Record<string, boolean>; toggleItem: (key: string) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Projects Section</h2>
      {data.projects.projects.map((proj, i) => (
        <div key={i} className="glassmorphism rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(`proj-${i}`)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">{proj.title || `Project ${i + 1}`}</span>
            {expandedItems[`proj-${i}`] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expandedItems[`proj-${i}`] && (
            <div className="p-4 pt-0 space-y-3 border-t border-white/10">
              <Field label="Title">
                <input className={inputClass} value={proj.title} onChange={(e) => {
                  const next = [...data.projects.projects]; next[i] = { ...next[i], title: e.target.value }; setData({ ...data, projects: { projects: next } })
                }} />
              </Field>
              <Field label="Slug (URL path, e.g. network-ids)">
                <input className={inputClass} value={proj.slug || ''} placeholder="network-ids" onChange={(e) => {
                  const next = [...data.projects.projects]; next[i] = { ...next[i], slug: e.target.value }; setData({ ...data, projects: { projects: next } })
                }} />
              </Field>
              <Field label="Description">
                <textarea className={inputClass + ' resize-none'} rows={2} value={proj.description} onChange={(e) => {
                  const next = [...data.projects.projects]; next[i] = { ...next[i], description: e.target.value }; setData({ ...data, projects: { projects: next } })
                }} />
              </Field>
              <Field label="Technologies (comma separated)">
                <input className={inputClass} value={proj.technologies.join(', ')} onChange={(e) => {
                  const next = [...data.projects.projects]; next[i] = { ...next[i], technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }; setData({ ...data, projects: { projects: next } })
                }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="GitHub URL">
                  <input className={inputClass} value={proj.githubUrl} onChange={(e) => {
                    const next = [...data.projects.projects]; next[i] = { ...next[i], githubUrl: e.target.value }; setData({ ...data, projects: { projects: next } })
                  }} />
                </Field>
                <Field label="Demo URL">
                  <input className={inputClass} value={proj.demoUrl} onChange={(e) => {
                    const next = [...data.projects.projects]; next[i] = { ...next[i], demoUrl: e.target.value }; setData({ ...data, projects: { projects: next } })
                  }} />
                </Field>
              </div>
              <button
                onClick={() => { const next = data.projects.projects.filter((_, idx) => idx !== i); setData({ ...data, projects: { projects: next } }) }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="inline h-4 w-4 mr-1" /> Remove Project
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => setData({ ...data, projects: { projects: [...data.projects.projects, { title: 'New Project', slug: 'new-project', description: '', technologies: [], githubUrl: '', demoUrl: '' }] } })}
        className="text-primary text-sm hover:underline"
      >
        <Plus className="inline h-4 w-4 mr-1" /> Add Project
      </button>
    </div>
  )
}

function ExperienceEditor({ data, setData, inputClass, expandedItems, toggleItem }: { data: PortfolioData; update: (path: string, value: unknown) => void; setData: React.Dispatch<React.SetStateAction<PortfolioData>>; inputClass: string; labelClass: string; expandedItems: Record<string, boolean>; toggleItem: (key: string) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Experience Section</h2>
      {data.experience.experiences.map((exp, i) => (
        <div key={i} className="glassmorphism rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(`exp-${i}`)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">{exp.title || `Experience ${i + 1}`}</span>
            {expandedItems[`exp-${i}`] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expandedItems[`exp-${i}`] && (
            <div className="p-4 pt-0 space-y-3 border-t border-white/10">
              <Field label="Title">
                <input className={inputClass} value={exp.title} onChange={(e) => {
                  const next = [...data.experience.experiences]; next[i] = { ...next[i], title: e.target.value }; setData({ ...data, experience: { experiences: next } })
                }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company">
                  <input className={inputClass} value={exp.company} onChange={(e) => {
                    const next = [...data.experience.experiences]; next[i] = { ...next[i], company: e.target.value }; setData({ ...data, experience: { experiences: next } })
                  }} />
                </Field>
                <Field label="Period">
                  <input className={inputClass} value={exp.period} onChange={(e) => {
                    const next = [...data.experience.experiences]; next[i] = { ...next[i], period: e.target.value }; setData({ ...data, experience: { experiences: next } })
                  }} />
                </Field>
              </div>
              <Field label="Description">
                <textarea className={inputClass + ' resize-none'} rows={2} value={exp.description} onChange={(e) => {
                  const next = [...data.experience.experiences]; next[i] = { ...next[i], description: e.target.value }; setData({ ...data, experience: { experiences: next } })
                }} />
              </Field>
              <Field label="Skills (comma separated)">
                <input className={inputClass} value={exp.skills.join(', ')} onChange={(e) => {
                  const next = [...data.experience.experiences]; next[i] = { ...next[i], skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }; setData({ ...data, experience: { experiences: next } })
                }} />
              </Field>
              <button
                onClick={() => { const next = data.experience.experiences.filter((_, idx) => idx !== i); setData({ ...data, experience: { experiences: next } }) }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="inline h-4 w-4 mr-1" /> Remove
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => setData({ ...data, experience: { experiences: [...data.experience.experiences, { title: '', company: '', period: '', description: '', skills: [] }] } })}
        className="text-primary text-sm hover:underline"
      >
        <Plus className="inline h-4 w-4 mr-1" /> Add Experience
      </button>
    </div>
  )
}

function EducationEditor({ data, setData, inputClass, expandedItems, toggleItem }: { data: PortfolioData; update: (path: string, value: unknown) => void; setData: React.Dispatch<React.SetStateAction<PortfolioData>>; inputClass: string; labelClass: string; expandedItems: Record<string, boolean>; toggleItem: (key: string) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Education Section</h2>
      {data.education.education.map((edu, i) => (
        <div key={i} className="glassmorphism rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(`edu-${i}`)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">{edu.degree || `Education ${i + 1}`}</span>
            {expandedItems[`edu-${i}`] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expandedItems[`edu-${i}`] && (
            <div className="p-4 pt-0 space-y-3 border-t border-white/10">
              <Field label="Degree">
                <input className={inputClass} value={edu.degree} onChange={(e) => {
                  const next = [...data.education.education]; next[i] = { ...next[i], degree: e.target.value }; setData({ ...data, education: { education: next } })
                }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Institution">
                  <input className={inputClass} value={edu.institution} onChange={(e) => {
                    const next = [...data.education.education]; next[i] = { ...next[i], institution: e.target.value }; setData({ ...data, education: { education: next } })
                  }} />
                </Field>
                <Field label="Period">
                  <input className={inputClass} value={edu.period} onChange={(e) => {
                    const next = [...data.education.education]; next[i] = { ...next[i], period: e.target.value }; setData({ ...data, education: { education: next } })
                  }} />
                </Field>
              </div>
              <Field label="GPA / Status">
                <input className={inputClass} value={edu.gpa} onChange={(e) => {
                  const next = [...data.education.education]; next[i] = { ...next[i], gpa: e.target.value }; setData({ ...data, education: { education: next } })
                }} />
              </Field>
              <Field label="Highlights (comma separated)">
                <input className={inputClass} value={edu.highlights.join(', ')} onChange={(e) => {
                  const next = [...data.education.education]; next[i] = { ...next[i], highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }; setData({ ...data, education: { education: next } })
                }} />
              </Field>
              <button
                onClick={() => { const next = data.education.education.filter((_, idx) => idx !== i); setData({ ...data, education: { education: next } }) }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="inline h-4 w-4 mr-1" /> Remove
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => setData({ ...data, education: { education: [...data.education.education, { degree: '', institution: '', period: '', gpa: '', highlights: [] }] } })}
        className="text-primary text-sm hover:underline"
      >
        <Plus className="inline h-4 w-4 mr-1" /> Add Education
      </button>
    </div>
  )
}

function CertificationsEditor({ data, setData, inputClass, expandedItems, toggleItem }: { data: PortfolioData; update: (path: string, value: unknown) => void; setData: React.Dispatch<React.SetStateAction<PortfolioData>>; inputClass: string; labelClass: string; expandedItems: Record<string, boolean>; toggleItem: (key: string) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Certifications Section</h2>
      {data.certifications.certifications.map((cert, i) => (
        <div key={i} className="glassmorphism rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(`cert-${i}`)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">{cert.title || `Certification ${i + 1}`}</span>
            {expandedItems[`cert-${i}`] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expandedItems[`cert-${i}`] && (
            <div className="p-4 pt-0 space-y-3 border-t border-white/10">
              <Field label="Title">
                <input className={inputClass} value={cert.title} onChange={(e) => {
                  const next = [...data.certifications.certifications]; next[i] = { ...next[i], title: e.target.value }; setData({ ...data, certifications: { certifications: next } })
                }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Issuer">
                  <input className={inputClass} value={cert.issuer} onChange={(e) => {
                    const next = [...data.certifications.certifications]; next[i] = { ...next[i], issuer: e.target.value }; setData({ ...data, certifications: { certifications: next } })
                  }} />
                </Field>
                <Field label="Issue Date">
                  <input className={inputClass} value={cert.issueDate} onChange={(e) => {
                    const next = [...data.certifications.certifications]; next[i] = { ...next[i], issueDate: e.target.value }; setData({ ...data, certifications: { certifications: next } })
                  }} />
                </Field>
              </div>
              <Field label="Description">
                <textarea className={inputClass + ' resize-none'} rows={2} value={cert.description} onChange={(e) => {
                  const next = [...data.certifications.certifications]; next[i] = { ...next[i], description: e.target.value }; setData({ ...data, certifications: { certifications: next } })
                }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    className={inputClass}
                    value={cert.status}
                    onChange={(e) => {
                      const next = [...data.certifications.certifications]; next[i] = { ...next[i], status: e.target.value }; setData({ ...data, certifications: { certifications: next } })
                    }}
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </Field>
                <Field label="Credential URL">
                  <input className={inputClass} value={cert.credentialUrl} onChange={(e) => {
                    const next = [...data.certifications.certifications]; next[i] = { ...next[i], credentialUrl: e.target.value }; setData({ ...data, certifications: { certifications: next } })
                  }} />
                </Field>
              </div>
              <button
                onClick={() => { const next = data.certifications.certifications.filter((_, idx) => idx !== i); setData({ ...data, certifications: { certifications: next } }) }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="inline h-4 w-4 mr-1" /> Remove
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => setData({ ...data, certifications: { certifications: [...data.certifications.certifications, { title: '', issuer: '', issueDate: '', credentialUrl: '#', description: '', status: 'In Progress' }] } })}
        className="text-primary text-sm hover:underline"
      >
        <Plus className="inline h-4 w-4 mr-1" /> Add Certification
      </button>
    </div>
  )
}

function ContactEditor({ data, update, inputClass }: { data: PortfolioData; update: (path: string, value: unknown) => void; inputClass: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contact Section</h2>
      <Field label="Email">
        <input className={inputClass} value={data.contact.email} onChange={(e) => update('contact.email', e.target.value)} />
      </Field>
      <Field label="Phone">
        <input className={inputClass} value={data.contact.phone} onChange={(e) => update('contact.phone', e.target.value)} />
      </Field>
      <Field label="GitHub URL">
        <input className={inputClass} value={data.contact.githubUrl} onChange={(e) => update('contact.githubUrl', e.target.value)} />
      </Field>
      <Field label="LinkedIn URL">
        <input className={inputClass} value={data.contact.linkedinUrl} onChange={(e) => update('contact.linkedinUrl', e.target.value)} />
      </Field>
    </div>
  )
}

function NavigationEditor({ data, update, inputClass }: { data: PortfolioData; update: (path: string, value: unknown) => void; inputClass: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Navigation</h2>
      <Field label="Logo Text">
        <input className={inputClass} value={data.navigation.logoText} onChange={(e) => update('navigation.logoText', e.target.value)} />
      </Field>
      <Field label="Nav Items (comma separated)">
        <input className={inputClass} value={data.navigation.navItems.join(', ')} onChange={(e) => update('navigation.navItems', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
      </Field>
    </div>
  )
}
