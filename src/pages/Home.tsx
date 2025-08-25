import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Brain, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Beyond
            <span className="block text-4xl md:text-6xl text-muted-foreground">Big-O</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
            Ready to go beyond interview algorithms? Let's explore the fascinating world 
            of computational theory, real-world optimizations, and algorithmic beauty 
            that powers the software we use every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/blogs">
                Explore Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/about">
                My Philosophy
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-16">
            What I Explore
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4">Advanced Algorithms</h3>
              <p className="text-muted-foreground leading-relaxed">
                From suffix trees to FFT-based pattern matching, I explore algorithms 
                that solve real-world problems at scale.
              </p>
            </div>
            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4">Computational Theory</h3>
              <p className="text-muted-foreground leading-relaxed">
                Dive into automata theory, complexity beyond P vs NP, and the mathematical 
                foundations that power modern computing.
              </p>
            </div>
            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4">Systems Programming</h3>
              <p className="text-muted-foreground leading-relaxed">
                Deep dives into kernel programming, the mathematics behind compilers, 
                and the low-level systems that make high-level algorithms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Article Teaser */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-16">
            Latest Article
          </h2>
          <div className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-wrap gap-2 mb-4">
              {["algorithms", "automata-theory", "fft"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="font-display text-2xl font-semibold mb-4">
              Pattern Matching On Steroids: Searching Patterns In Billions Of Characters
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Dive into the world of high-performance pattern matching where I tackle 
              two real-world bioinformatics challenges: exact sequence matching across 
              a billion characters, and fuzzy pattern matching with 2-3% tolerance.
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span>By Anirudh Singh</span>
                <span className="mx-2">•</span>
                <span>30 min read</span>
                <span className="mx-2">•</span>
                <span>August 20, 2025</span>
              </div>
              <Button asChild variant="outline">
                <Link to="/blogs/pattern-matching-steroids">
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}