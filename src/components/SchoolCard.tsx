import React from 'react';
import { School } from '../types';
import { Star, MapPinOff, ArrowRight, Scale, Check } from 'lucide-react';

interface SchoolCardProps {
  school: School;
  isSelected: boolean;
  isFavorite: boolean;
  isInComparison: boolean;
  onSelect: (school: School) => void;
  onToggleFavorite: (schoolCode: string) => void;
  onToggleComparison: (school: School) => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
  school,
  isSelected,
  isFavorite,
  isInComparison,
  onSelect,
  onToggleFavorite,
  onToggleComparison,
}) => {
  return (
    <div
      onClick={() => onSelect(school)}
      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer bg-white text-left ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top Tag Strip */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 font-medium">
          <span className="text-blue-700 font-semibold">{school.schoolType}</span>
          <span aria-hidden="true">·</span>
          <span>{school.district}</span>
          <span aria-hidden="true">·</span>
          <span>{school.genderType}</span>
          <span aria-hidden="true">·</span>
          <span>{school.foundationType}</span>
          {!school.hasLocation && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-normal">
                <MapPinOff className="w-3 h-3" />
                위치정보 없음
              </span>
            </>
          )}
        </div>

        {/* Favorite Star Button */}
        <button
          type="button"
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(school.schoolCode);
          }}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            isFavorite
              ? 'text-amber-500 hover:bg-amber-50'
              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* School Name */}
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {school.schoolName}
        </h3>
        <span className="text-[11px] text-slate-400 shrink-0">{school.eduOffice}</span>
      </div>

      {/* Address */}
      {school.address && (
        <p className="text-xs text-slate-500 truncate mb-3" title={school.address}>
          {school.address}
        </p>
      )}

      {/* Bottom Action & Status Strip */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-slate-600 font-medium">
          {school.studentCount ? (
            <span>
              총 학생 <strong className="text-slate-900">{school.studentCount.toLocaleString()}</strong>명
              {school.classCount && (
                <span className="text-slate-400 ml-1.5">
                  (학급당 {(school.studentCount / school.classCount).toFixed(1)}명)
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">공시정보 상세 확인</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComparison(school);
            }}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
              isInComparison
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isInComparison ? (
              <>
                <Check className="w-3 h-3" />
                <span>비교중</span>
              </>
            ) : (
              <>
                <Scale className="w-3 h-3" />
                <span>비교함</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(school);
            }}
            className="p-1 text-slate-400 hover:text-blue-600 transition"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
