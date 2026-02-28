'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { BuySpreddButton } from '@/components/ui/BuySpreddButton';
import { useRouter, usePathname } from 'next/navigation';

export interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // If we're on the homepage and have an onSearch callback, use it
      if (pathname === '/' && onSearch) {
        onSearch(searchQuery);
      } else {
        // Otherwise redirect to homepage with search query
        router.push(`/?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0f1117]/95 backdrop-blur-sm border-b border-gray-800 shadow-sm">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
          {/* Logo */}
          <Logo />

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1d26] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </form>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* <BuySpreddButton /> */}
            <div className="relative">
              <button className="px-5 py-2.5 bg-blue-500 text-white text-base font-semibold rounded-lg">
                Connect Wallet
              </button>
              <div className="absolute inset-0 bg-[#1a1d26]/70 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm font-semibold">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              <form onSubmit={handleSearch} className="px-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1a1d26] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </form>
              <div className="flex flex-col space-y-2 pt-2 px-2 items-center">
                {/* <BuySpreddButton /> */}
                <div className="relative w-full">
                  <button className="w-full px-5 py-2.5 bg-blue-500 text-white text-base font-semibold rounded-lg">
                    Connect Wallet
                  </button>
                  <div className="absolute inset-0 bg-[#1a1d26]/70 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm font-semibold">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
