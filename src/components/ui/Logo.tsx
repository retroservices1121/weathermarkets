import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      {/* Logo Icon - Bigger */}
      <div className="relative w-10 h-10">
        <Image
          src="/logo.png"
          alt="Weather Markets"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Text - WEATHER (blue) + MARKETS (white) */}
      <div className="flex items-center gap-1.5 text-lg sm:text-xl font-bold">
        <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
          WEATHER
        </span>
        <span className="text-gray-300">
          MARKETS
        </span>
      </div>
    </Link>
  );
}
