'use client'

import { useState, useEffect } from 'react'
import { MapPin, Shield, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const stats = [
  { label: 'Verified Listings', value: '12,000+', icon: Shield },
  { label: 'Happy Renters', value: '8,500+', icon: Star },
  { label: 'Cities Covered', value: '24', icon: MapPin },
  { label: 'Agents Active', value: '3,200+', icon: TrendingUp },
]

const slides = [
  {
    heading: 'Find Your Perfect',
    highlight: 'Home in Nigeria',
    sub: 'Browse thousands of verified rental properties from trusted agents and owners.',
    bg: 'from-emerald-900 via-teal-800 to-cyan-900',
  },
  {
    heading: 'List Your Property,',
    highlight: 'Reach More Renters',
    sub: 'Connect with thousands of renters actively looking for homes like yours.',
    bg: 'from-slate-900 via-emerald-900 to-teal-800',
  },
  {
    heading: 'Verified Agents,',
    highlight: 'Trusted Listings',
    sub: 'Every agent and listing goes through our thorough verification process.',
    bg: 'from-teal-900 via-cyan-900 to-emerald-900',
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setAnimating(false)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const slide = slides[current]

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br ${slide.bg} transition-all duration-700`}
      style={{ minHeight: '420px' }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/5 blur-2xl" />
      </div>

      {/* Grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Nigeria&apos;s Trusted Rental Platform
          </div>

          {/* Headline */}
          <div
            className={`transition-all duration-400 ${animating ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'}`}
          >
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              {slide.heading}{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                {slide.highlight}
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-slate-300/90 leading-relaxed">
              {slide.sub}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
            <Link
              href="#properties"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-0.5"
            >
              Browse Properties
            </Link>
          </div>

          {/* Slide dots */}
          <div className="mt-8 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? 'w-8 bg-emerald-400'
                    : 'w-3 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20">
                <Icon className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}