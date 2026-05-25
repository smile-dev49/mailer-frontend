import { useEffect, useRef, useState } from "react";
import type { UserFilterOptions, UserFilters } from "../types";

type Props = {
  filters: UserFilters;
  options: UserFilterOptions;
  onFiltersChange: (filters: UserFilters) => void;
  disabled?: boolean;
};

const TEXT_DEBOUNCE_MS = 400;

export function UserLocationFilters({
  filters,
  options,
  onFiltersChange,
  disabled,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locationText, setLocationText] = useState(filters.location ?? "");

  useEffect(() => {
    setLocationText(filters.location ?? "");
  }, [filters.location]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function applyNow(next: UserFilters) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    onFiltersChange(next);
  }

  function applyTextDebounced(next: UserFilters) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onFiltersChange(next);
    }, TEXT_DEBOUNCE_MS);
  }

  return (
    <div className="filter-bar">
      <div className="row">
        <div className="field">
          <label>Scrape country</label>
          <select
            value={filters.scrape_country ?? ""}
            onChange={(e) =>
              applyNow({
                ...filters,
                scrape_country: e.target.value || undefined,
              })
            }
            disabled={disabled}
          >
            <option value="">All countries</option>
            {options.scrape_countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Search location (query)</label>
          <select
            value={filters.search_location ?? ""}
            onChange={(e) =>
              applyNow({
                ...filters,
                search_location: e.target.value || undefined,
              })
            }
            disabled={disabled}
          >
            <option value="">All search locations</option>
            {options.search_locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Profile / location contains</label>
          <input
            type="text"
            placeholder="e.g. London, US, Tokyo"
            value={locationText}
            onChange={(e) => {
              const value = e.target.value;
              setLocationText(value);
              applyTextDebounced({
                ...filters,
                location: value || undefined,
              });
            }}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
