"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Package, TrendingUp, Shield, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="text-xl font-semibold text-foreground">Hupes</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/features"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link href="/#about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </nav>

            <Link href="/login">
              <Button variant="default" className="rounded-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-background to-background" />

        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center py-24 md:py-32 lg:py-40">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-balance mb-6 max-w-5xl">
              Complete food production platform
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mb-10">
              Streamline operations from ingredient sourcing to final delivery. Ensure compliance, optimize yield, and
              scale confidently.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button size="lg" className="rounded-full text-base px-8">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 bg-transparent">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 md:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4">
              Built for modern food production
            </h2>
            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              Everything you need to manage your facility end-to-end
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gradient-to-b from-accent/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border border-border rounded-2xl p-8 h-full">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Ingredient Traceability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track every ingredient from supplier to finished product. Full chain of custody with lot tracking and
                  expiration management.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gradient-to-b from-accent/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border border-border rounded-2xl p-8 h-full">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Production Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time dashboards showing yield efficiency, batch performance, and resource utilization across all
                  production lines.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gradient-to-b from-accent/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border border-border rounded-2xl p-8 h-full">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Compliance Management</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automated documentation for FDA, HACCP, and SQF standards. Built-in audit trails and certification
                  tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Scale operations without complexity</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our platform grows with your business, from single facilities to multi-site operations across
                continents.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Recipe Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Version-controlled formulations with automatic scaling and substitution rules
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Quality Control</h3>
                    <p className="text-sm text-muted-foreground">
                      Automated testing workflows with statistical process control and trend analysis
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Inventory Optimization</h3>
                    <p className="text-sm text-muted-foreground">
                      Smart reordering with demand forecasting and supplier performance tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent rounded-3xl" />
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border bg-card">
                <img src="/images/image.png" alt="Production Dashboard" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Ready to transform your production?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 text-balance">
              Join food manufacturers who trust Hupes for their operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="rounded-full text-base px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 bg-transparent">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary" />
              <span className="font-semibold text-foreground">Hupes</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Hupes. Streamlining food production worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
