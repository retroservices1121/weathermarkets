'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Search, SlidersHorizontal, Bookmark, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MARKET_CATEGORIES, type MarketCategory, type TrendingTag } from '@/types';
import { apiClient } from '@/lib/api';

export interface TrendingBarProps {
  activeCategory: MarketCategory;
  onCategoryChange: (category: MarketCategory) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  activeTopic?: string;
  onTopicChange?: (topic: string) => void;
  onSearch?: (query: string) => void;
  showSearchBar?: boolean; // New prop to control search bar visibility
}

const PRIMARY_TABS = ['Trending', 'Breaking', 'New'];
// Use broad category keywords that will work with search/filtering
const CATEGORY_TABS = [
  'All',
  'Politics',
  'Sports',
  'Crypto',
  'AI',
  'Business',
  'Entertainment'
];

export function TrendingBar({
  activeCategory,
  onCategoryChange,
  activeTab: externalActiveTab,
  onTabChange,
  activeTopic: externalActiveTopic,
  onTopicChange,
  onSearch,
  showSearchBar = true // Default to true for backward compatibility
}: TrendingBarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('Trending');
  const [internalActiveTopic, setInternalActiveTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTopics, setTrendingTopics] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  const activeTab = externalActiveTab || internalActiveTab;
  const activeTopic = externalActiveTopic || internalActiveTopic;

  // Handler functions
  const handleTabClick = (tab: string) => {
    // Reset topic when switching tabs
    if (onTopicChange) {
      onTopicChange('All');
    } else {
      setInternalActiveTopic('All');
    }

    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handleCategoryClick = (category: MarketCategory) => {
    // Reset topic when switching categories
    if (onTopicChange) {
      onTopicChange('All');
    } else {
      setInternalActiveTopic('All');
    }

    onCategoryChange(category);
  };

  const handleTopicClick = (topic: string) => {
    if (onTopicChange) {
      onTopicChange(topic);
    } else {
      setInternalActiveTopic(topic);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Clear search when tabs or categories change
  useEffect(() => {
    if (searchQuery) {
      setSearchQuery('');
      if (onSearch) {
        onSearch('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeCategory]);

  // Fetch trending tags on mount and refresh every 5 minutes
  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        setLoading(true);
        const tags = await apiClient.getTrendingTags(20);

        // Extract tag names and prepend 'All'
        const topicNames = tags.map(t => t.tag);
        setTrendingTopics(['All', ...topicNames]);
      } catch (error) {
        console.error('Failed to fetch trending tags:', error);
        // Keep 'All' even if fetch fails
        setTrendingTopics(['All']);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTags();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTrendingTags, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-16 z-40 bg-[#1a1d26]/80 backdrop-blur-sm border-b border-gray-800">
      {/* First Row - Category Tabs */}
      <div className={cn("overflow-hidden", showSearchBar && "border-b border-gray-800")}>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 pl-4 sm:pl-4 lg:pl-6 pr-4 sm:pr-4 lg:pr-6">
              {/* Primary Tabs */}
              {PRIMARY_TABS.map((tab, idx) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={cn(
                      'flex items-center gap-1.5 py-3 sm:py-3 text-base sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap',
                      isActive
                        ? 'text-white border-blue-500'
                        : 'text-gray-400 border-transparent hover:text-gray-300'
                    )}
                  >
                    {tab === 'Trending' && <TrendingUp className="w-4 h-4 sm:w-4 sm:h-4" />}
                    {tab}
                  </button>
                );
              })}

              <div className="h-6 w-px bg-gray-700" />

              {/* Category Tabs */}
              {CATEGORY_TABS.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category as MarketCategory)}
                    className={cn(
                      'py-3 sm:py-3 text-base sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap',
                      isActive
                        ? 'text-white border-blue-500'
                        : 'text-gray-400 border-transparent hover:text-gray-300'
                    )}
                  >
                    {category}
                  </button>
                );
              })}

              <button className="flex items-center gap-1 py-3 sm:py-3 text-base sm:text-base font-medium text-gray-400 hover:text-gray-300 transition-colors border-b-2 border-transparent whitespace-nowrap">
                More
                <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
          </div>
        </div>
      </div>

      {/* Second Row - Search and Topic Pills */}
      {showSearchBar && (
      <div className="bg-[#0f1117] overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-2 lg:gap-3 py-2.5">
          {/* Left side with padding */}
          <div className="flex items-center gap-2 sm:gap-2 lg:gap-3 pl-4 sm:pl-4 lg:pl-6 flex-shrink-0">
            {/* Search Bar */}
            <div className="relative w-32 sm:w-32 lg:w-48">
              <Search className="absolute left-3 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-3.5 sm:w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#1a1d26] border border-gray-800 rounded-md pl-9 sm:pl-9 pr-3 sm:pr-3 py-2 sm:py-2 text-sm sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Icons */}
            <button className="p-1.5 sm:p-1.5 hover:bg-[#1f2330] rounded transition-colors">
              <SlidersHorizontal className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500" />
            </button>

            <button className="p-1.5 sm:p-1.5 hover:bg-[#1f2330] rounded transition-colors">
              <Bookmark className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500" />
            </button>

            <div className="h-5 sm:h-5 w-px bg-gray-700" />
          </div>

          {/* Topic Pills - Full width scrollable without right padding */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 sm:gap-2 pr-4 sm:pr-4 lg:pr-6">
              {loading ? (
                // Loading skeleton for topic pills
                <>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="px-3 sm:px-3 py-1.5 rounded-full bg-gray-700 animate-pulse whitespace-nowrap flex-shrink-0"
                      style={{ width: `${60 + (i * 5)}px` }}
                    >
                      &nbsp;
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {trendingTopics.map((topic) => {
                    const isActive = activeTopic === topic;
                    return (
                      <button
                        key={topic}
                        onClick={() => handleTopicClick(topic)}
                        className={cn(
                          'px-3.5 sm:px-4 py-1.5 sm:py-1.5 rounded-full text-sm sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-[#1a1d26] text-gray-400 border border-gray-800 hover:bg-[#1f2330] hover:text-white'
                        )}
                      >
                        {topic}
                      </button>
                    );
                  })}
                  <button className="p-1 sm:p-1 hover:bg-[#1f2330] rounded transition-colors flex-shrink-0">
                    <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-500" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
