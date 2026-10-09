import { createContext, useContext, useState } from 'react';

const SearchContext = createContext({ query: '', setQuery: () => {} });

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}

/** Utility: returns true if a threat matches the search query */
export function matchesThreatSearch(threat, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    (threat.item_name || '').toLowerCase().includes(q) ||
    (threat.platform || '').toLowerCase().includes(q) ||
    (threat.threat_level || '').toLowerCase().includes(q) ||
    (threat.item_url || '').toLowerCase().includes(q) ||
    (threat.item_developer || '').toLowerCase().includes(q) ||
    (threat.item_description || '').toLowerCase().includes(q)
  );
}
