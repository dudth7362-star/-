import React from 'react';
import { FilterState, SchoolType, GenderType, FoundationType, School } from '../types';
import { Search, RotateCcw, Star, MapPin } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChangeFilters: (updater: (prev: FilterState) => FilterState) => void;
  onResetFilters: () => void;
  schools: School[];
  totalSchoolCount: number;
  filteredCount: number;
}

const DISTRICT_LIST = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
  "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
  "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
  "서초구", "강남구", "송파구", "강동구"
];

const SCHOOL_TYPES: (SchoolType | "all")[] = [
  "all", "일반고", "자사고", "특목고", "영재고", "특성화고", "학력인정고", "기타"
];

const GENDER_TYPES: (GenderType | "all")[] = [
  "all", "남학교", "여학교", "남녀공학"
];

const FOUNDATION_TYPES: (FoundationType | "all")[] = [
  "all", "공립", "사립", "국립", "기타"
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  schools,
  totalSchoolCount,
  filteredCount,
}) => {
  // Compute school counts per district based on current full schools data (never hardcoded)
  const districtCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of DISTRICT_LIST) {
      counts[d] = 0;
    }
    for (const s of schools) {
      if (counts[s.district] !== undefined) {
        counts[s.district]++;
      }
    }
    return counts;
  }, [schools]);

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.district !== 'all' ||
    filters.schoolType !== 'all' ||
    filters.genderType !== 'all' ||
    filters.foundationType !== 'all' ||
    filters.onlyFavorites;

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
      {/* Primary search + District & Quick Filters row */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between mb-2.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              onChangeFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="학교명 검색 (예: 대원외고, 서울고, 휘문고...)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* District Dropdown Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filters.district}
              onChange={(e) =>
                onChangeFilters((prev) => ({ ...prev, district: e.target.value }))
              }
              className="text-xs md:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="all">서울 전체 (25개 자치구)</option>
              {DISTRICT_LIST.map((dist) => (
                <option key={dist} value={dist}>
                  {dist} ({districtCounts[dist] || 0}개교)
                </option>
              ))}
            </select>
          </div>

          {/* Favorites Filter Tab */}
          <button
            type="button"
            onClick={() =>
              onChangeFilters((prev) => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))
            }
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filters.onlyFavorites
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.onlyFavorites ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>관심학교만</span>
          </button>
        </div>
      </div>

      {/* Secondary filter chips row: School Type, Gender, Foundation */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs pt-1 border-t border-slate-100">
        {/* School Type */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium shrink-0">유형:</span>
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {SCHOOL_TYPES.map((type) => {
              const label = type === 'all' ? '전체' : type;
              const isActive = filters.schoolType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    onChangeFilters((prev) => ({ ...prev, schoolType: type }))
                  }
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gender */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium shrink-0">남녀:</span>
          <div className="flex items-center gap-1">
            {GENDER_TYPES.map((g) => {
              const label = g === 'all' ? '전체' : g;
              const isActive = filters.genderType === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    onChangeFilters((prev) => ({ ...prev, genderType: g }))
                  }
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Foundation */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium shrink-0">설립:</span>
          <div className="flex items-center gap-1">
            {FOUNDATION_TYPES.map((f) => {
              const label = f === 'all' ? '전체' : f;
              const isActive = filters.foundationType === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    onChangeFilters((prev) => ({ ...prev, foundationType: f }))
                  }
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary & Reset Button */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-600 text-xs">
            조건 결과 <strong className="text-blue-600 font-bold">{filteredCount}</strong>개교
            {totalSchoolCount > 0 && (
              <span className="text-slate-400 ml-1">/ 전체 {totalSchoolCount}개교</span>
            )}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50 rounded transition font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
