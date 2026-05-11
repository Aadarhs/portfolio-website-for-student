'use client'

export default function About() {
  return (
    <section id="about" className="py-20 scroll-mt-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">
            <span className="glow-text">About Me</span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        <div className="glassmorphism p-8 space-y-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            I'm a passionate IT student dedicated to understanding the complexities of cybersecurity. My journey in security has involved exploring various domains including network security, threat analysis, and ethical hacking practices. I believe in continuous learning and staying updated with the latest security trends and vulnerabilities.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Through hands-on labs and real-world scenarios, I've developed a solid foundation in identifying security vulnerabilities, implementing defensive measures, and responding to security incidents. I'm excited to leverage this knowledge to contribute to organizations' security posture and help protect valuable assets.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">5+</div>
              <div className="text-sm text-muted-foreground">Labs Completed</div>
            </div>
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">10+</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">2+</div>
              <div className="text-sm text-muted-foreground">Certifications</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
