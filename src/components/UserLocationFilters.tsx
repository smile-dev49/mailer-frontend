import type { UserFilterOptions, UserFilters } from "../types";

type Props = {
  filters: UserFilters;
  options: UserFilterOptions;
  onChange: (filters: UserFilters) => void;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function UserLocationFilters({
  filters,
  options,
  onChange,
  onApply,
  onClear,
  disabled,
}: Props) {
  return (
    <div className="filter-bar">
      <div className="row">
        <div className="field">
          <label>Scrape country</label>
          <select
            value={filters.scrape_country ?? ""}
            onChange={(e) =>
              onChange({ ...filters, scrape_country: e.target.value || undefined })
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
              onChange({ ...filters, search_location: e.target.value || undefined })
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
            value={filters.location ?? ""}
            onChange={(e) =>
              onChange({ ...filters, location: e.target.value || undefined })
            }
            disabled={disabled}
          />
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onApply} disabled={disabled}>
          Apply filters
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={disabled}>
          Clear
        </button>
      </div>
    </div>
  );
}
