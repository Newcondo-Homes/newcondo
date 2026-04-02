'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, LinkedIn, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@newcondo/ui/';
import { Input } from '@newcondo/ui/';
import { Separator } from '@newcondo/ui/';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About Us' },
        { href: '/careers', label: 'Careers' },
        { href: '/press', label: 'Press' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Support',
      links: [
        { href: '/help', label: 'Help Center' },
        { href: '/safety', label: 'Safety Information' },
        { href: '/cancellation', label: 'Cancellation Options' },
        { href: '/disability-support', label: 'Disability Support' },
      ],
    },
    {
      title: 'Hosting',
      links: [
        { href: '/host', label: 'List Your Property' },
        { href: '/host/resources', label: 'Hosting Resources' },
        { href: '/host/community', label: 'Community Forum' },
        { href: '/host/responsible', label: 'Responsible Hosting' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/terms', label: 'Terms of Service' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/cookies', label: 'Cookie Policy' },
        { href: '/disclaimer', label: 'Disclaimer' },
      ],
    },
  ];

  const socialLinks = [
    { href: 'https://facebook.com/newcondo', icon: Facebook, label: 'Facebook' },
    { href: 'https://twitter.com/newcondo', icon: Twitter, label: 'Twitter' },
    { href: 'https://instagram.com/newcondo', icon: Instagram, label: 'Instagram' },
    { href: 'https://linkedin.com/company/newcondo', icon: LinkedIn, label: 'LinkedIn' },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle newsletter subscription
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    console.log('Newsletter subscription:', email);
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Stay Updated with Newcondo
            </h3>
            <p className="text-gray-400 mb-6">
              Get the latest property listings, market insights, and exclusive deals delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="relative h-8 w-8">
                <Image
                  src="/images/logos/newcondo-icon-white.svg"
                  alt="Newcondo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold">Newcondo</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              Nigeria's leading property rental platform. Find your perfect home or list your property with ease and confidence.
            </p>
            <div className="flex space-x-4 mb-8">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <span className="sr-only">{link.label}</span>
                  <link.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-1" />
                <span>support@newcondo.ng</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-1" />
                <span>+234 812 345 6789</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1" />
                <span>123 Property St, Lekki, Lagos, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="md:col-span-1">
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-800" />

      {/* Copyright and Legal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
        <p>&copy; {currentYear} Newcondo. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/sitemap" className="hover:text-white">Sitemap</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;