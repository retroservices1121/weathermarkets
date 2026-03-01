'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Search, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useRouter, usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { truncateAddress } from '@/lib/utils';

export interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  let privyReady = false;
  let authenticated = false;
  let login: (() => void) | undefined;
  let logout: (() => Promise<void>) | undefined;
  let user: any = null;

  try {
    const privy = usePrivy();
    privyReady = privy.ready;
    authenticated = privy.authenticated;
    login = privy.login;
    logout = privy.logout;
    user = privy.user;
  } catch {
    // Privy provider not available (no app ID configured)
  }

  const walletAddress = user?.wallet?.address || user?.embeddedWallet?.address;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (pathname === '/' && onSearch) {
        onSearch(searchQuery);
      } else {
        router.push(`/?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleConnectClick = () => {
    if (login) {
      login();
    }
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
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
            {privyReady && authenticated && walletAddress ? (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2.5 bg-[#1a1d26] border border-gray-700 rounded-lg">
                  <span className="text-white text-sm font-semibold">
                    {truncateAddress(walletAddress)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-[#1a1d26] border border-gray-700 rounded-lg hover:bg-[#2a3142] transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectClick}
                disabled={!privyReady}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            )}
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
                {privyReady && authenticated && walletAddress ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 px-4 py-2.5 bg-[#1a1d26] border border-gray-700 rounded-lg text-center">
                      <span className="text-white text-sm font-semibold">
                        {truncateAddress(walletAddress)}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 bg-[#1a1d26] border border-gray-700 rounded-lg hover:bg-[#2a3142] transition-colors"
                      title="Disconnect"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectClick}
                    disabled={!privyReady}
                    className="w-full px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold rounded-lg transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
