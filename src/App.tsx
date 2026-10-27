import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { School, FilterState, SchoolsApiResponse } from './types';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { SchoolCard } from './components/SchoolCard';
import { SchoolMap } from './map/SchoolMap';
import { SchoolDetailModal } from './components/SchoolDetailModal';
import { ComparisonModal } from './components/ComparisonModal';
import { KeyMissingNotice, PartialFailureNotice } from './components/StatusNotice';
import { RefreshCw, SearchX, MapPinOff, AlertTriangle, Info } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  district: 'all',
  schoolType: 'all',
  genderType: 'all',
  foundationType: 'all',
  eduOffice: 'all',
  onlyFavorites: false,
  onlyWithLocation: false,
};

export default function App() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [failedDistricts, setFailedDistricts] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Selected school for detail view and map sync
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Favorites (persisted in localStorage per Section 37)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('seoul_highschools_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Comparison drawer (up to 4 schools per Section 36)
  const [comparisonList, setComparisonList] = useState<School[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Mobile layout tab
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('list');

  // Toast notice for location-less school
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Ref to school card items for scrolling to active school
  const schoolCardsContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Fetch school data from /api/schools
  const loadSchools = useCallback(async (refresh = false) => {
    setLoading(true);
    setHasError(false);
    setIsKeyMissing(false);

    try {
      const res = await fetch(`/api/schools${refresh ? '?refresh=true' : ''}`);

      if (res.status === 503) {
        setIsKeyMissing(true);
        setSchools([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SchoolsApiResponse = await res.json();
      setSchools(data.schools || []);
      setFailedDistricts(data.failedDistricts || []);
      setIsKeyMissing(false);
    } catch (err: unknown) {
      console.warn('Failed to load schools from server:', err);
      setHasError(true);
      setSchools([]);
    } finally {
      // Always end loading state (Section 13)
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  // Persist favorites to localStorage
  const handleToggleFavorite = useCallback((schoolCode: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(schoolCode)) {
        next.delete(schoolCode);
      } else {
        next.add(schoolCode);
      }
      try {
        localStorage.setItem('seoul_highschools_favorites', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn('Failed to save favorites to localStorage', e);
      }
      return next;
    });
  }, []);

  // Comparison drawer management
  const handleToggleComparison = useCallback((school: School) => {
    setComparisonList((prev) => {
      const exists = prev.some((s) => s.schoolCode === school.schoolCode);
      if (exists) {
        return prev.filter((s) => s.schoolCode !== school.schoolCode);
      }
      if (prev.length >= 4) {
        showToast('비교함에는 최대 4개 학교까지만 추가할 수 있습니다.');
        return prev;
      }
      showToast(`${school.schoolName}을(를) 비교함에 추가했습니다.`);
      return [...prev, school];
    });
  }, [showToast]);

  const handleRemoveFromComparison = useCallback((schoolCode: string) => {
    setComparisonList((prev) => prev.filter((s) => s.schoolCode !== schoolCode));
  }, []);

  const handleClearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  // Filter schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // 1. Search query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.trim().toLowerCase();
        const matchName = school.schoolName.toLowerCase().includes(query);
        const matchDistrict = school.district.toLowerCase().includes(query);
        const matchType = school.schoolType.toLowerCase().includes(query);
        if (!matchName && !matchDistrict && !matchType) return false;
      }

      // 2. District filter
      if (filters.district !== 'all' && school.district !== filters.district) {
        return false;
      }

      // 3. School Type filter
      if (filters.schoolType !== 'all' && school.schoolType !== filters.schoolType) {
        return false;
      }

      // 4. Gender filter
      if (filters.genderType !== 'all' && school.genderType !== filters.genderType) {
        return false;
      }

      // 5. Foundation filter
      if (filters.foundationType !== 'all' && school.foundationType !== filters.foundationType) {
        return false;
      }

      // 6. Favorites only
      if (filters.onlyFavorites && !favorites.has(school.schoolCode)) {
        return false;
      }

      return true;
    });
  }, [schools, filters, favorites]);

  // Handle select school (from card or map marker)
  const handleSelectSchool = useCallback(
    (school: School) => {
      setSelectedSchool(school);
      setIsDetailOpen(true);

      if (!school.hasLocation) {
        showToast('이 학교는 위치정보가 없어 지도에 표시되지 않습니다.');
      }
    },
    [showToast]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* 1. Header (Top Bar Contract) */}
      <Header
        totalCount={schools.length}
        loading={loading}
        isKeyMissing={isKeyMissing}
        hasError={hasError}
        partialFailureCount={failedDistricts.length}
        comparisonCount={comparisonList.length}
        onOpenComparison={() => setIsComparisonOpen(true)}
        activeMobileTab={mobileTab}
        onSwitchMobileTab={setMobileTab}
        onRefreshData={() => loadSchools(true)}
      />

      {/* 2. Filter Bar */}
      <FilterBar
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={handleResetFilters}
        schools={schools}
        totalSchoolCount={schools.length}
        filteredCount={filteredSchools.length}
      />

      {/* Partial failure notice if any district had issues */}
      <PartialFailureNotice failedDistricts={failedDistricts} />

      {/* 3. Main Workspace Split: Left ~35% List, Right ~65% Map */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: School List (~35%) */}
        <section
          className={`w-full md:w-[38%] lg:w-[35%] h-full flex flex-col bg-white border-r border-slate-200 z-10 ${
            mobileTab === 'map' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Content */}
          <div ref={schoolCardsContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {/* Case: Key missing notice */}
            {isKeyMissing ? (
              <KeyMissingNotice onRetry={() => loadSchools(true)} isRetrying={loading} />
            ) : loading ? (
              /* Case: Loading skeleton */
              <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="font-medium text-slate-700">서울 고등학교 조회 중입니다…</span>
                <span className="text-[11px] text-slate-400">
                  학교알리미 Open API에서 25개 자치구 데이터를 취합하고 있습니다.
                </span>
              </div>
            ) : hasError ? (
              /* Case: Complete failure */
              <div className="p-8 my-auto text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  학교알리미 연결 실패
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs text-balance">
                  학교알리미 Open API 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => loadSchools(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 시도</span>
                </button>
              </div>
            ) : filteredSchools.length === 0 ? (
              /* Case: Filter result is empty (Section 6 ⑦) */
              <div className="p-8 my-auto text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  조건에 맞는 학교가 없습니다
                </h3>
                <p className="text-xs text-slate-500 mb-4 text-balance">
                  필터를 줄이거나 초기화해 보세요.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              /* Normal list rendering */
              filteredSchools.map((school) => (
                <SchoolCard
                  key={school.schoolCode}
                  school={school}
                  isSelected={selectedSchool?.schoolCode === school.schoolCode}
                  isFavorite={favorites.has(school.schoolCode)}
                  isInComparison={comparisonList.some((s) => s.schoolCode === school.schoolCode)}
                  onSelect={handleSelectSchool}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleComparison={handleToggleComparison}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Panel: Leaflet Map (~65%) */}
        <section
          className={`flex-1 h-full relative ${
            mobileTab === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <SchoolMap
            schools={filteredSchools}
            selectedSchool={selectedSchool}
            onSelectSchool={handleSelectSchool}
            selectedDistrict={filters.district}
          />
        </section>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-xl text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* School Detail Modal */}
      {isDetailOpen && selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          onClose={() => setIsDetailOpen(false)}
          isFavorite={favorites.has(selectedSchool.schoolCode)}
          isInComparison={comparisonList.some((s) => s.schoolCode === selectedSchool.schoolCode)}
          onToggleFavorite={handleToggleFavorite}
          onToggleComparison={handleToggleComparison}
        />
      )}

      {/* Comparison Modal */}
      {isComparisonOpen && (
        <ComparisonModal
          schools={comparisonList}
          onClose={() => setIsComparisonOpen(false)}
          onRemoveSchool={handleRemoveFromComparison}
          onSelectSchool={handleSelectSchool}
          onClearComparison={handleClearComparison}
        />
      )}
    </div>
  );
}
