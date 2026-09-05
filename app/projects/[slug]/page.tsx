import ProjectDetail from '@/components/ProjectDetail'

const projectSlugs = [
  'network-ids',
  'web-scanner',
  'cryptography-lab',
  'incident-response',
  'linux-hardening',
  'malware-analysis',
]

export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }))
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ProjectDetail slug={decodeURIComponent(slug)} />
}