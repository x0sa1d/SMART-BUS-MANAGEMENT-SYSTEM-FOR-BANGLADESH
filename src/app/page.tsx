import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, APP_TAGLINE, PRICING_PLANS } from "@/constants";
import { MAJOR_OPERATORS, POPULAR_ROUTES, COVERAGE_STATS, PAYMENT_METHODS } from "@/constants/operators";
import {
  Bus, Route, Ticket, MapPin, BarChart3, CreditCard, Users,
  Building2, ArrowRight, CheckCircle2, Globe,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "486+ Operators",
    desc: "Manage national and regional bus companies from one platform.",
    color: "from-[#006A4E] to-[#00875f]",
    href: "/operators",
  },
  {
    icon: Route,
    title: "Nationwide Routes",
    desc: "258+ routes across 8 divisions, 64 districts, and major upazilas.",
    color: "from-[#1D3557] to-[#457B9D]",
    href: "/search",
  },
  {
    icon: Ticket,
    title: "Online Booking",
    desc: "Interactive seat selection with Economy, Business & VIP classes.",
    color: "from-[#E63946] to-[#ff5a67]",
    href: "/search",
  },
  {
    icon: MapPin,
    title: "GPS Tracking",
    desc: "Live bus tracking with ETA across all major terminals.",
    color: "from-[#FFB703] to-[#E63946]",
    href: "/login?demo=1&next=/passenger/track",
  },
  {
    icon: CreditCard,
    title: "BD Payments",
    desc: "bKash, Nagad, Rocket, SSLCommerz & card payments built-in.",
    color: "from-pink-500 to-rose-500",
    href: "#payments",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "Revenue, occupancy, route performance & passenger growth.",
    color: "from-[#006A4E] to-[#457B9D]",
    href: "/login?demo=1&next=/dashboard",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white text-sm font-bold shadow-soft">SBM</div>
            <div>
              <span className="font-bold text-sm">{APP_NAME}</span>
              <Badge variant="outline" className="ml-2 text-[10px] py-0 border-primary/30 text-primary">Bangladesh</Badge>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#coverage" className="hover:text-primary transition-colors">Coverage</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#routes" className="hover:text-primary transition-colors">Routes</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost">Sign in</LinkButton>
            <LinkButton href="/register" variant="ghost">Passenger Sign up</LinkButton>
            <LinkButton href="/register-company" variant="gradient">Register Company</LinkButton>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none z-0" aria-hidden="true" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20 px-4 py-1">
              <Globe className="h-3 w-3 mr-1" /> Trusted by 486+ Bus Operators Nationwide
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="gradient-text">{APP_NAME}</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">{APP_TAGLINE}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <LinkButton href="/register" size="lg" variant="gradient" className="text-base px-8 shadow-soft-lg">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/login?demo=1" size="lg" variant="outline" className="text-base px-8 border-primary/30 hover:bg-primary/5">
                View Demo
              </LinkButton>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 pt-8 max-w-3xl mx-auto">
              {COVERAGE_STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold gradient-text">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="coverage" className="border-y bg-card/50 py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-8 pointer-events-none">
          {[...MAJOR_OPERATORS, ...MAJOR_OPERATORS].map((name, i) => (
            <span key={`${name}-${i}`} className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" /> {name}
            </span>
          ))}
        </div>
        <div className="text-center mt-3">
          <Link href="/operators" className="text-sm text-primary font-medium hover:underline pointer-events-auto">
            View all 486+ operators →
          </Link>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Everything for Bangladesh Transport</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Enterprise tools built for the unique needs of Bangladesh&apos;s intercity bus industry</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group card-elevated rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-all block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className={`rounded-xl bg-gradient-to-br ${f.color} p-3 w-fit text-white shadow-soft`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <span className="inline-flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="h-3 w-3 ml-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="routes" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Popular Routes</h2>
          <p className="text-muted-foreground mt-2">Intercity connections across all 8 divisions</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {POPULAR_ROUTES.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              href="/search"
              className="card-elevated rounded-xl p-4 space-y-2 block hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                {r.from} → {r.to}
              </div>
              <p className="text-xs text-muted-foreground">{r.distance} · {r.duration}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <LinkButton href="/search" variant="outline">Search All Routes</LinkButton>
        </div>
      </section>

      <section id="payments" className="container mx-auto px-4 py-12">
        <div className="rounded-2xl gradient-hero p-8 md:p-12 text-white text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Bangladesh Payment Gateways</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {PAYMENT_METHODS.map((p) => (
              <span key={p.name} className={`${p.color} px-4 py-2 rounded-full text-sm font-medium text-white shadow-md`}>{p.name}</span>
            ))}
          </div>
          <p className="text-white/80 text-sm max-w-lg mx-auto">Secure payments with instant verification, refund processing, and full transaction history</p>
          <LinkButton href="/register" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">
            Enable Payments for Your Fleet
          </LinkButton>
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Plans for Every Operator</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1 ${plan.highlighted ? "border-2 border-primary shadow-soft-lg scale-105" : "card-elevated"}`}>
              {plan.highlighted && <Badge className="gradient-primary">Most Popular</Badge>}
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-3xl font-bold">৳{plan.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{plan.period}</span></p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <LinkButton href="/register" variant={plan.highlighted ? "gradient" : "outline"} className="w-full">
                Get Started
              </LinkButton>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <div className="card-elevated rounded-2xl p-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Ready to digitize your fleet?</h2>
          <p className="text-muted-foreground">Join 486+ bus operators managing routes, tickets, and payments on Smart Bus Management</p>
          <LinkButton href="/register" size="lg" variant="gradient">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="h-4 w-4 text-primary" />
          <span>{APP_NAME} — Nationwide Transport Operations Platform</span>
        </div>
        <p>8 Divisions · 64 Districts · 486+ Operators · 258+ Routes</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}
