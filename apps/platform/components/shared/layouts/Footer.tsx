import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import Link from 'next/link'

const footerLinks = {
  Platform: [
    { label: 'Browse Properties', href: '/properties' },
    { label: 'List a Property', href: '/properties/create' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
  ],
  'For Agents': [
    { label: 'Agent Dashboard', href: '/dashboard' },
    { label: 'Referral Program', href: '/referrals' },
    { label: 'Verification', href: '/profile/verification' },
    { label: 'Property Marking', href: '/marking-service' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

const socials = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        {/* Top: Brand + Links */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NewCondo</span>
            </div>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-gray-400">
              Nigeria&apos;s most trusted rental platform connecting renters, agents, and property owners with verified listings.
            </p>
            {/* Contact */}
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>hello@newcondo.ng</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>+234 800 NEWCONDO</span>
              </div>
            </div>
            {/* Socials */}
            <div className="mt-5 flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-all hover:bg-emerald-500 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-400 transition-colors hover:text-emerald-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} NewCondo. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-emerald-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}