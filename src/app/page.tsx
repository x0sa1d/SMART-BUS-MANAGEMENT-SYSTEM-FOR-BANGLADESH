import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, APP_TAGLINE, PRICING_PLANS } from "@/constants";
import { MAJOR_OPERATORS, POPULAR_ROUTES, COVERAGE_STATS, PAYMENT_METHODS } from "@/constants/operators";
import { getDistricts } from "@/actions/location.actions";
import { calendarDateKey } from "@/lib/calendar-date";
import { FALLBACK_PASSENGER_CITIES } from "@/lib/district-search";
import { HomeSearchForm } from "@/features/home/home-search-form";
import { LandingMobileNav } from "@/features/home/landing-mobile-nav";
import {
  Bus, Route, Ticket, MapPin, BarChart3, CreditCard, Users,
  Building2, ArrowRight, CheckCircle2, Shield, Sparkles, Siren, PackageSearch, QrCode, Brain, Star,
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

const BUS_IMAGES = {
  hero: "/images/buses/hanif-volvo.jpg?v=6",
  cta: "/images/buses/greenline-2.jpg",
} as const;

const fleet = [
  { name: "Green Line Paribahan", type: "AC", coach: "Scania", seats: 36, price: "From ৳900", rating: "4.9", image: "/images/buses/greenline-1.jpg?v=6" },
  { name: "Hanif Enterprise", type: "AC", coach: "Hino", seats: 40, price: "From ৳850", rating: "4.8", image: "/images/buses/hanif-volvo.jpg?v=6" },
  { name: "Ena Transport", type: "AC", coach: "Hyundai Universe", seats: 40, price: "From ৳780", rating: "4.8", image: "/images/buses/ena.jpg?v=6" },
  { name: "Desh Travels", type: "AC", coach: "Hyundai Universe", seats: 40, price: "From ৳720", rating: "4.7", image: "/images/buses/desh.jpg?v=6" },
  { name: "Saint Martin Paribahan", type: "AC", coach: "Hyundai AC", seats: 40, price: "From ৳800", rating: "4.6", image: "/images/buses/saintmartin.jpg?v=6" },
  { name: "Royal Coach", type: "AC", coach: "Touring AC", seats: 36, price: "From ৳650", rating: "4.6", image: "/images/buses/royal.jpg?v=6" },
  { name: "Saudia Paribahan", type: "AC", coach: "AC coach", seats: 40, price: "From ৳700", rating: "4.6", image: "/images/buses/saudia.jpg?v=6" },
  { name: "Shah Fateh Ali Paribahan", type: "AC", coach: "Business Class", seats: 40, price: "From ৳550", rating: "4.5", image: "/images/buses/shah-fote-ali.jpg?v=6" },
  { name: "Shyamoli Paribahan", type: "AC", coach: "Hyundai", seats: 40, price: "From ৳650", rating: "4.6", image: "/images/buses/shyamoli.jpg?v=6" },
  { name: "Shohagh Paribahan", type: "AC", coach: "Scania Elite", seats: 36, price: "From ৳850", rating: "4.7", image: "/images/buses/shohagh.jpg?v=6" },
] as const;

const TRENDING_DESTINATIONS = [
  { name: "Barishal", spot: "Kuakata Beach", image: "/images/destinations/barishal.jpg?v=8", query: "Barishal" },
  { name: "Chattogram", spot: "Cox's Bazar", image: "/images/destinations/chattogram.jpg?v=8", query: "Cox's Bazar" },
  { name: "Dhaka", spot: "Lalbagh Fort", image: "/images/destinations/dhaka.jpg?v=8", query: "Dhaka" },
  { name: "Khulna", spot: "Sixty Dome Mosque", image: "/images/destinations/khulna.jpg?v=8", query: "Khulna" },
  { name: "Mymensingh", spot: "Shashi Lodge", image: "/images/destinations/mymensingh.jpg?v=8", query: "Mymensingh" },
  { name: "Rajshahi", spot: "Puthia Temples", image: "/images/destinations/rajshahi.jpg?v=8", query: "Rajshahi" },
  { name: "Rangpur", spot: "Tajhat Palace", image: "/images/destinations/rangpur.jpg?v=8", query: "Rangpur" },
  { name: "Sylhet", spot: "Ratargul Forest", image: "/images/destinations/sylhet.jpg?v=8", query: "Sylhet" },
] as const;

const services = [
  { icon: Building2, title: "Operator tools", desc: "Run your fleet, drivers, and schedules from one place." },
  { icon: Ticket, title: "Online booking", desc: "Choose seats on a clear map and pay in a few steps." },
  { icon: CreditCard, title: "Local payments", desc: "bKash, Nagad, Rocket, and card options built in." },
  { icon: BarChart3, title: "Clear reports", desc: "See revenue, occupancy, and busy routes at a glance." },
  { icon: Route, title: "Nationwide routes", desc: "Coverage across divisions, districts, and major stops." },
  { icon: Shield, title: "Role access", desc: "Separate spaces for admins, drivers, and passengers." },
];

export default async function LandingPage() {
  const districts = await getDistricts();
  const destinations = Array.from(
    new Set([
      ...districts.map((district) => district.name),
      ...FALLBACK_PASSENGER_CITIES,
    ])
  ).sort((a, b) => a.localeCompare(b));
  const today = calendarDateKey();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-50 site-header text-white">
        <div className="container mx-auto flex h-16 md:h-[4.5rem] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-bd-green shadow-soft">
              <Bus className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight text-[1.35rem]">Bugos</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/85">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#destinations" className="hover:text-white transition-colors">Destinations</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#fleet" className="hover:text-white transition-colors">Bus</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/operators" className="hover:text-white transition-colors">Operators</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LandingMobileNav />
            <LinkButton href="/login" className="bg-white/10 text-white hover:bg-white/20 border border-white/25 hidden sm:inline-flex">
              Sign in
            </LinkButton>
            <LinkButton href="/register" className="bg-accent text-white hover:bg-accent/90 border-0 shadow-soft text-sm px-4 sm:px-5">
              Contact Us
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="relative min-h-[88vh] flex items-end md:items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 animate-float"
          style={{ backgroundImage: `url('${BUS_IMAGES.hero}')`, animationDuration: "14s" }}
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="container relative z-10 mx-auto px-4 pb-28 pt-28 md:py-24">
          <div className="max-w-2xl space-y-5 text-white">
            <p className="animate-fade-up text-[2.6rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Bugos
            </p>
            <h1 className="animate-fade-up-delay text-[1.55rem] md:text-[2.35rem] font-bold leading-[1.2] tracking-[-0.02em] text-white/95">
              Reliable bus charter and rental across Bangladesh
            </h1>
            <p className="animate-fade-up-delay text-base md:text-lg text-white/85 leading-relaxed max-w-md">
              {APP_TAGLINE}
            </p>
            <div className="animate-fade-up-delay flex flex-wrap gap-3 pt-1">
              <LinkButton href="/search" size="lg" className="bg-accent text-white hover:bg-accent/90 border-0 px-7 shadow-soft-lg">
                Book a Ticket <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="#destinations" size="lg" className="bg-white text-bd-green hover:bg-white/90 border-0 px-7">
                Explore Destinations
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 container mx-auto px-4 -mt-14 md:-mt-16">
        <HomeSearchForm destinations={destinations} today={today} />
      </section>

      <section id="destinations" className="bg-card py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-10 space-y-2">
            <p className="section-label">Eight divisions</p>
            <h2 className="text-3xl md:text-[2.45rem] font-extrabold tracking-tight text-ink">
              Discover Trending Destinations
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-[15px] leading-relaxed">
              Famous spots across all 8 divisions of Bangladesh — tap a city to search buses.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {TRENDING_DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                href={`/search?destination=${encodeURIComponent(dest.query)}`}
                className="dest-card group block aspect-[4/3]"
              >
                <img
                  src={dest.image}
                  alt={`${dest.spot} in ${dest.name} Division`}
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-16 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    {dest.spot}
                  </p>
                  <h3 className="text-xl font-bold text-white tracking-tight">{dest.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10 space-y-3">
          <p className="section-label">About Us</p>
          <h2 className="text-3xl md:text-[2.35rem] font-bold tracking-tight text-ink">
            Built for Bangladesh bus travel
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-[15px] leading-relaxed">
            {APP_NAME} helps operators and passengers book seats, track buses, and stay safer on the road.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {COVERAGE_STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center shadow-soft">
              <p className="text-2xl font-extrabold text-bd-green">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-card py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <p className="section-label">Services</p>
            <h2 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight text-ink">What we offer</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.title} className="rounded-xl bg-background border border-border p-6 space-y-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-bd-green/30">
                <div className="h-10 w-10 rounded-full bg-bd-green text-white flex items-center justify-center shadow-soft">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[1.05rem] text-ink">{s.title}</h3>
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
          <p className="section-label">Our Bus</p>
          <h2 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight text-ink">Popular operators</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-[15px] leading-relaxed">
            Top AC and Non-AC coaches on Bangladesh highways — Hanif, Ena, Green Line, Shyamoli and more.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {fleet.map((bus) => (
            <article
              key={bus.name}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-bd-green/30 hover:shadow-soft-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                <img
                  src={bus.image}
                  alt={`${bus.name} ${bus.type} coach`}
                  className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-ink/5"
                  aria-hidden
                />
                <span
                  className={`absolute left-3 top-3 inline-flex min-h-6 min-w-11 items-center justify-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    bus.type === "AC"
                      ? "bg-primary text-white"
                      : "bg-white text-ink"
                  }`}
                >
                  {bus.type}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-accent">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                    {bus.rating}
                  </span>
                  <span className="text-muted-foreground">{bus.seats} seats</span>
                </div>
                <h3 className="min-h-[2.6rem] font-bold leading-snug text-ink line-clamp-2">{bus.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{bus.coach}</p>
                <p className="mt-2 text-accent font-extrabold">{bus.price}</p>
                <div className="mt-auto pt-3">
                  <LinkButton href="/search" className="w-full min-h-12">
                    Book Now
                  </LinkButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="bg-card py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <p className="section-label">Features</p>
            <h2 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight text-ink">Tools that help every trip</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-6 space-y-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-bd-green/30">
                <div className="h-10 w-10 rounded-full bg-bd-green/12 text-bd-green flex items-center justify-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[1.05rem] text-ink">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="routes" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10 space-y-3">
          <p className="section-label">Popular Routes</p>
          <h2 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight text-ink">Travel across Bangladesh</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {POPULAR_ROUTES.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              href="/search"
              className="rounded-lg border border-border bg-white p-4 space-y-1.5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {r.from} to {r.to}
              </div>
              <p className="text-xs text-muted-foreground pl-6">{r.distance}, {r.duration}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white py-4 overflow-hidden">
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
          style={{ backgroundImage: `url('${BUS_IMAGES.cta}')` }}
        />
        <div className="absolute inset-0 bg-bd-green/85" />
        <div className="container relative z-10 mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
          <div className="space-y-2 max-w-lg">
            <h2 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight leading-tight text-white">
              Ready to book your bus today?
            </h2>
            <p className="text-white/80 text-[15px] leading-relaxed">
              Tickets, tracking, SOS, and seat tips in one simple place.
            </p>
          </div>
          <LinkButton href="/register" size="lg" className="bg-accent text-white hover:bg-accent/90 border-0 px-8 shrink-0">
            Get Started
          </LinkButton>
        </div>
      </section>

      <section id="payments" className="container mx-auto px-4 py-14">
        <div className="rounded-xl gradient-primary p-8 md:p-10 text-white text-center space-y-5 shadow-soft-lg">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Pay the way you already do</h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {PAYMENT_METHODS.map((p) => (
              <span key={p.name} className="bg-white/15 px-4 py-2 rounded-full text-sm font-medium">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-card py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 space-y-3">
            <p className="section-label">Pricing</p>
            <h2 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight text-ink">Plans for every operator</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-6 space-y-4 bg-background ${
                  plan.highlighted ? "border-2 border-accent" : "border border-border"
                }`}
              >
                {plan.highlighted && <Badge className="bg-accent text-white">Most Popular</Badge>}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-3xl font-bold text-accent">
                  ৳{plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-bd-green shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <LinkButton
                  href="/register-company"
                  className={`w-full ${plan.highlighted ? "bg-primary text-white hover:bg-primary/90 border-0" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Get Started
                </LinkButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer text-white">
        <div className="container mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-extrabold text-lg text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-bd-green">
                <Bus className="h-4 w-4" />
              </span>
              Bugos
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {APP_NAME} for booking, fleet tools, and safer road travel.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-white">Quick links</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#destinations" className="hover:text-white">Destinations</a></li>
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><Link href="/search" className="hover:text-white">Book ticket</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-white">Support</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-white">Passenger signup</Link></li>
              <li><Link href="/register-company" className="hover:text-white">Register company</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-white">Coverage</p>
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
