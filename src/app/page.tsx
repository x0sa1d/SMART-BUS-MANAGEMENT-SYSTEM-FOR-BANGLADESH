import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, APP_TAGLINE, PRICING_PLANS } from "@/constants";
import { MAJOR_OPERATORS, POPULAR_ROUTES, COVERAGE_STATS, PAYMENT_METHODS } from "@/constants/operators";
import {
  Bus, Route, Ticket, MapPin, BarChart3, CreditCard, Users,
  Building2, ArrowRight, CheckCircle2, Shield, Sparkles, Siren, PackageSearch, QrCode, Brain,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Seat Tips",
    desc: "Pick window, aisle, or quieter seats with a quick recommendation.",
  },
  {
    icon: QrCode,
    title: "QR Tickets",
    desc: "Get an e-ticket with a QR code you can show at boarding.",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    desc: "Follow your bus on the map and check the expected arrival time.",
  },
  {
    icon: Sparkles,
    title: "Delay Alerts",
    desc: "See when a trip may run late based on traffic and schedule progress.",
  },
  {
    icon: Siren,
    title: "SOS Button",
    desc: "Send an emergency alert with your location when you need help.",
  },
  {
    icon: PackageSearch,
    title: "Lost & Found",
    desc: "Report a missing bag or help return something found on a bus.",
  },
];

const fleet = [
  { name: "City Express AC", seats: 40, price: "From ৳450", rating: "4.8" },
  { name: "Intercity Deluxe", seats: 36, price: "From ৳650", rating: "4.9" },
  { name: "Night Coach VIP", seats: 28, price: "From ৳900", rating: "4.7" },
  { name: "Non-AC Economy", seats: 44, price: "From ৳320", rating: "4.5" },
];

const services = [
  { icon: Building2, title: "Operator tools", desc: "Run your fleet, drivers, and schedules from one place." },
  { icon: Ticket, title: "Online booking", desc: "Choose seats on a clear map and pay in a few steps." },
  { icon: CreditCard, title: "Local payments", desc: "bKash, Nagad, Rocket, and card options built in." },
  { icon: BarChart3, title: "Clear reports", desc: "See revenue, occupancy, and busy routes at a glance." },
  { icon: Route, title: "Nationwide routes", desc: "Coverage across divisions, districts, and major stops." },
  { icon: Shield, title: "Role access", desc: "Separate spaces for admins, drivers, and passengers." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbfd] text-foreground">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="container mx-auto flex h-16 md:h-[4.5rem] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-primary">
              <Bus className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-[1.15rem]">Bugos</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium uppercase tracking-[0.12em] text-white/90">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#fleet" className="hover:text-white transition-colors">Bus</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/operators" className="hover:text-white transition-colors">Operators</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton href="/login" className="bg-white text-[#1a1a1a] hover:bg-white/90 hidden sm:inline-flex rounded-md">
              Sign in
            </LinkButton>
            <LinkButton href="/register" className="bg-primary text-white hover:bg-[#1647D5] border-0 rounded-md">
              Contact Us
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="relative min-h-[86vh] flex items-end md:items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1544620341-1adc1baa1c40?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 bugos-hero-overlay" />
        <div className="container relative z-10 mx-auto px-4 pb-28 pt-28 md:py-24">
          <div className="max-w-xl space-y-5 text-white">
            <p className="text-sm font-medium text-white/80">Bus charter and digital ticketing</p>
            <h1 className="text-[2.35rem] md:text-[3.4rem] font-bold leading-[1.12] tracking-[-0.02em]">
              Reliable bus charter and rental service
            </h1>
            <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-md">
              {APP_TAGLINE}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <LinkButton href="/search" size="lg" className="bg-primary text-white hover:bg-[#1647D5] border-0 px-7 rounded-md">
                Get Started <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/login?demo=1" size="lg" className="bg-white text-[#1a1a1a] hover:bg-white/90 border-0 px-7 rounded-md">
                View Demo
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 container mx-auto px-4 -mt-14 md:-mt-16">
        <form
          action="/search"
          className="rounded-xl bg-white p-4 md:p-5 shadow-soft-lg border border-[#e8eaef] grid gap-3 md:grid-cols-6"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Travel From</label>
            <input name="from" placeholder="Dhaka" className="w-full rounded-md bg-[#f2f2f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Travel To</label>
            <input name="to" placeholder="Chittagong" className="w-full rounded-md bg-[#f2f2f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Select Date</label>
            <input name="date" type="date" className="w-full rounded-md bg-[#f2f2f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Passengers</label>
            <input name="passengers" type="number" min={1} defaultValue={1} className="w-full rounded-md bg-[#f2f2f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button type="submit" className="w-full rounded-md bg-primary text-white font-semibold py-2.5 hover:bg-[#1647D5] transition-colors">
              Book Now
            </button>
          </div>
        </form>
      </section>

      <section id="about" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10 space-y-3">
          <p className="bugos-section-label">About Us</p>
          <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight text-[#1a1a1a]">
            Built for Bangladesh bus travel
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-[15px] leading-relaxed">
            {APP_NAME} helps operators and passengers book seats, track buses, and stay safer on the road.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {COVERAGE_STATS.map((s) => (
            <div key={s.label} className="rounded-lg bg-white border border-[#e8eaef] p-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <p className="bugos-section-label">Services</p>
            <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight">What we offer</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.title} className="rounded-lg bg-[#fafbfd] border border-[#e8eaef] p-6 space-y-3">
                <div className="h-10 w-10 rounded-md bg-primary text-white flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[1.05rem] text-[#1a1a1a]">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <Link href="/search" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                  Learn more <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fleet" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10 space-y-3">
          <p className="bugos-section-label">Our Bus</p>
          <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight">Popular bus classes</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {fleet.map((bus) => (
            <div key={bus.name} className="rounded-lg border border-[#e8eaef] bg-white overflow-hidden">
              <div className="h-36 bg-[#eef2fb] flex items-center justify-center">
                <Bus className="h-14 w-14 text-primary/60" />
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary font-medium">★ {bus.rating}</span>
                  <span className="text-muted-foreground">{bus.seats} seats</span>
                </div>
                <h3 className="font-semibold text-[#1a1a1a]">{bus.name}</h3>
                <p className="text-primary font-bold">{bus.price}</p>
                <LinkButton href="/search" className="w-full bg-primary text-white hover:bg-[#1647D5] border-0 rounded-md">
                  Book Now
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <p className="bugos-section-label">Features</p>
            <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight">Tools that help every trip</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-[#e8eaef] bg-[#fafbfd] p-6 space-y-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[1.05rem]">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="routes" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10 space-y-3">
          <p className="bugos-section-label">Popular Routes</p>
          <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight">Travel across Bangladesh</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {POPULAR_ROUTES.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              href="/search"
              className="rounded-lg border border-[#e8eaef] bg-white p-4 space-y-1.5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {r.from} to {r.to}
              </div>
              <p className="text-xs text-muted-foreground pl-6">{r.distance}, {r.duration}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8eaef] bg-white py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {[...MAJOR_OPERATORS, ...MAJOR_OPERATORS].map((name, i) => (
            <span key={`${name}-${i}`} className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" /> {name}
            </span>
          ))}
        </div>
      </section>

      <section className="relative py-16 md:py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-[#0b1f5c]/78" />
        <div className="container relative z-10 mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
          <div className="space-y-2 max-w-lg">
            <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight leading-tight">
              Ready to book your bus today?
            </h2>
            <p className="text-white/80 text-[15px] leading-relaxed">
              Tickets, tracking, SOS, and seat tips in one simple place.
            </p>
          </div>
          <LinkButton href="/register" size="lg" className="bg-primary text-white hover:bg-[#1647D5] border-0 px-8 rounded-md shrink-0">
            Get Started
          </LinkButton>
        </div>
      </section>

      <section id="payments" className="container mx-auto px-4 py-14">
        <div className="rounded-xl bg-primary p-8 md:p-10 text-white text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pay the way you already do</h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {PAYMENT_METHODS.map((p) => (
              <span key={p.name} className="bg-white/15 px-4 py-2 rounded-md text-sm font-medium">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <p className="bugos-section-label">Pricing</p>
            <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight">Plans for every operator</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-6 space-y-4 bg-[#fafbfd] ${
                  plan.highlighted ? "border-2 border-primary" : "border border-[#e8eaef]"
                }`}
              >
                {plan.highlighted && <Badge className="bg-primary rounded-md">Most Popular</Badge>}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-3xl font-bold text-primary">
                  ৳{plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <LinkButton
                  href="/register-company"
                  className={`w-full rounded-md ${plan.highlighted ? "bg-primary text-white hover:bg-[#1647D5] border-0" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Get Started
                </LinkButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-primary text-white">
        <div className="container mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Bus className="h-5 w-5" /> Bugos
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {APP_NAME} for booking, fleet tools, and safer road travel.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3">Quick links</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><Link href="/search" className="hover:text-white">Book ticket</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">Support</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-white">Passenger signup</Link></li>
              <li><Link href="/register-company" className="hover:text-white">Register company</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3">Coverage</p>
            <p className="text-sm text-white/80 flex items-start gap-2 leading-relaxed">
              <Users className="h-4 w-4 mt-0.5 shrink-0" />
              8 divisions, 64 districts, and 486+ operators
            </p>
          </div>
        </div>
        <div className="border-t border-white/20 py-4 text-center text-sm text-white/70">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
