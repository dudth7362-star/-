import React from 'react';
import { Map, List, Scale, School as SchoolIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  loading: boolean;
  isKeyMissing: boolean;
  hasError: boolean;
  partialFailureCount: number;
  comparisonCount: number;
  onOpenComparison: () => void;
  activeMobileTab: 'map' | 'list';
  onSwitchMobileTab: (tab: 'map' | 'list') => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  loading,
  isKeyMissing,
  hasError,
  partialFailureCount,
  comparisonCount,
  onOpenComparison,
  activeMobileTab,
  onSwitchMobileTab,
  onRefreshData,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <SchoolIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
              서울 고교 지도
            </h1>
            {/* Status Text (Section 13) */}
            <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
              <span aria-hidden="true">·</span>
              {loading ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  서울 고등학교 조회 중
                </span>
              ) : isKeyMissing ? (
                <span className="text-amber-600">학교알리미 인증키 설정 필요</span>
              ) : hasError ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  학교알리미 연결 실패
                </span>
              ) : partialFailureCount > 0 ? (
                <span className="text-amber-700">
                  서울 고등학교 <strong className="text-slate-900">{totalCount}</strong>개교 · 일부 지역 조회 실패
                </span>
              ) : (
                <span>
                  서울 고등학교 <strong className="text-blue-700 font-bold">{totalCount}</strong>개교
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            지도에서 찾고, 공시정보로 비교하는 서울 고등학교 안내
          </p>
        </div>
      </div>

      {/* Center mobile tabs */}
      <div className="flex md:hidden items-center p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => onSwitchMobileTab('list')}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
            activeMobileTab === 'list'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>목록</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchMobileTab('map')}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
            activeMobileTab === 'map'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>지도</span>
        </button>
      </div>

      {/* Action Zone */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Comparison Drawer Button */}
        <button
          type="button"
          onClick={onOpenComparison}
          disabled={comparisonCount === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            comparisonCount > 0
              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>비교함</span>
          {comparisonCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-blue-700 text-[10px] flex items-center justify-center font-bold">
              {comparisonCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
