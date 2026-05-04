import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CitySearch({ value, onChange, placeholder = "Search city..." }: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3 || !showDropdown) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&featuretype=city`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("City search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, showDropdown]);

  const handleSelect = (item: any) => {
    const city = item.address.city || item.address.town || item.address.village || item.address.suburb || item.display_name.split(',')[0];
    const country = item.address.country;
    const fullText = `${city}, ${country}`;
    setQuery(fullText);
    onChange(fullText);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-amber-500 font-sans text-sm"
          placeholder={placeholder}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden"
          >
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-start gap-3 border-b border-neutral-50 last:border-none transition-colors"
              >
                <MapPin className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-neutral-800">
                    {item.address.city || item.address.town || item.address.village || 'Location'}
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider truncate">
                    {item.display_name}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
