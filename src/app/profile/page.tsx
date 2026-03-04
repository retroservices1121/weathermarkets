'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, Copy, Check, LogOut } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const [copied, setCopied] = useState(false);

  const walletAddress = user?.wallet?.address || (user as any)?.embeddedWallet?.address;

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDisconnect = async () => {
    await logout();
    router.push('/');
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">Profile</h1>

        {/* Wallet Card */}
        <div className="bg-[#12141a] border border-gray-800/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold font-mono">
                  {walletAddress ? truncateAddress(walletAddress) : 'No wallet connected'}
                </span>
                {walletAddress && (
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <span className="text-sm text-gray-400">Base Network</span>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Disconnect Wallet</span>
          </button>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-[#12141a] border border-gray-800/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p className="text-gray-400">
            Portfolio tracking, positions, and trade history coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
