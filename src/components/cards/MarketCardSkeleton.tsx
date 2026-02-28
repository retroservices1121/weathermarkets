export function MarketCardSkeleton() {
  return (
    <div className="bg-[#1a1d26] border border-gray-800 rounded-xl p-4 h-full animate-pulse">
      {/* Header with Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-700 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
        </div>
      </div>

      {/* Outcomes */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-700 rounded w-20" />
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-700 rounded w-12" />
            <div className="h-6 bg-gray-700 rounded w-12" />
            <div className="h-6 bg-gray-700 rounded w-12" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-700 rounded w-20" />
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-700 rounded w-12" />
            <div className="h-6 bg-gray-700 rounded w-12" />
            <div className="h-6 bg-gray-700 rounded w-12" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="h-3 bg-gray-700 rounded w-16" />
        <div className="h-3 bg-gray-700 rounded w-16" />
      </div>
    </div>
  );
}
