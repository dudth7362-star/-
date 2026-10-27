import React, { useEffect, useState } from 'react';
import { School, SchoolDetailData } from '../types';
import {
  X,
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  GraduationCap,
  Users,
  BookOpen,
  Sparkles,
  FileText,
  Star,
  Scale,
  Check,
  RefreshCw,
  Building,
  School as SchoolIcon,
  HelpCircle,
} from 'lucide-react';

interface SchoolDetailModalProps {
  school: School | null;
  onClose: () => void;
  isFavorite: boolean;
  isInComparison: boolean;
  onToggleFavorite: (schoolCode: string) => void;
  onToggleComparison: (school: School) => void;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({
  school,
  onClose,
  isFavorite,
  isInComparison,
  onToggleFavorite,
  onToggleComparison,
}) => {
  const [detailData, setDetailData] = useState<SchoolDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!school) {
      setDetailData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/schools/${school.schoolCode}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SchoolDetailData) => {
        if (isMounted) {
          setDetailData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || '상세 공시정보를 불러오지 못했습니다');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [school]);

  if (!school) return null;

  const officialInfoUrl = `https://www.schoolinfo.go.kr/ei/ss/PbanListInfo.do?schulCode=${encodeURIComponent(
    school.schoolCode
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Strip */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 mb-1.5 font-medium">
              <span className="text-blue-700 font-semibold">{school.schoolType}</span>
              <span aria-hidden="true">·</span>
              <span>{school.district}</span>
              <span aria-hidden="true">·</span>
              <span>{school.genderType}</span>
              <span aria-hidden="true">·</span>
              <span>{school.foundationType}</span>
              <span aria-hidden="true">·</span>
              <span>{school.eduOffice}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              {school.schoolName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compare Toggle */}
            <button
              type="button"
              onClick={() => onToggleComparison(school)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isInComparison
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isInComparison ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>비교함 담김</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>비교함에 추가</span>
                </>
              )}
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={() => onToggleFavorite(school.schoolCode)}
              aria-label={isFavorite ? '관심학교 해제' : '관심학교 추가'}
              className={`p-2 rounded-lg border transition ${
                isFavorite
                  ? 'bg-amber-50 border-amber-300 text-amber-500'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6">
          {/* Quick Contact & Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">학교 주소</span>
                <span>{school.address || '주소 정보 없음'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">전화번호</span>
                <span>{school.phone || '전화번호 미등록'}</span>
              </div>
            </div>

            {school.homepage && (
              <div className="flex items-start gap-2 md:col-span-2">
                <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="truncate">
                  <span className="font-semibold text-slate-700 block mb-0.5">홈페이지</span>
                  <a
                    href={school.homepage.startsWith('http') ? school.homepage : `http://${school.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">{school.homepage}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Loading / Error states for dynamic details */}
          {loading && (
            <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>학교알리미 상세 공시정보를 조회하고 있습니다…</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
              <span>자료를 불러오지 못했습니다: {error}</span>
              <a
                href={officialInfoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold ml-2 hover:text-rose-900"
              >
                학교알리미 직접 확인
              </a>
            </div>
          )}

          {/* Section: 학생 및 학급 현황 */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>학생 및 학급 현황</span>
              <span className="text-[11px] font-normal text-slate-400 ml-auto">
                공시자료 기준 계산값
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">전체 학생 수</span>
                <strong className="text-lg font-bold text-slate-900 tabular-nums">
                  {detailData?.students?.total || school.studentCount
                    ? `${(detailData?.students?.total || school.studentCount)?.toLocaleString()}명`
                    : '공시 확인 필요'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">전체 학급 수</span>
                <strong className="text-lg font-bold text-slate-900 tabular-nums">
                  {detailData?.classes?.total || school.classCount
                    ? `${detailData?.classes?.total || school.classCount}학급`
                    : '공시 확인 필요'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">학급당 학생 수</span>
                <strong className="text-lg font-bold text-blue-700 tabular-nums">
                  {detailData?.classes?.studentsPerClass
                    ? `${detailData.classes.studentsPerClass}명`
                    : school.studentCount && school.classCount
                    ? `${(school.studentCount / school.classCount).toFixed(1)}명`
                    : '확인 필요'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">교원 수</span>
                <strong className="text-lg font-bold text-slate-900 tabular-nums">
                  {detailData?.teachers?.total || school.teacherCount
                    ? `${detailData?.teachers?.total || school.teacherCount}명`
                    : '공시 확인 필요'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section: 입학 정보 (Career counselor priority) */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>입학 및 신입생 전형 안내</span>
              </h4>
              <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                진로진학 핵심정보
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              고교 신입생 모집 요강, 전형 시기(전기/후기 고교), 정원 및 지원 자격 등 상세 입학 안내는 학교알리미 공식 공시 원문에서 열람 및 파일 다운로드가 가능합니다.
            </p>

            <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">
              <span className="text-indigo-950 font-medium">공식 입학전형 및 모집요강 공시자료</span>
              <a
                href={officialInfoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium flex items-center gap-1.5 shrink-0"
              >
                <span>입학전형 자료 보기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Section: 교육과정 편성·운영 */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>학교교육과정 및 개설과목</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              학년별 교과 편성표, 일반선택 및 진로선택 과목 개설 현황, 중점과정(과학·인문·예술 등) 운영 계획을 확인할 수 있습니다.
            </p>
            <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs">
              <span className="text-emerald-950 font-medium">교육과정 편성·운영 계획 원문</span>
              <a
                href={officialInfoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition font-medium flex items-center gap-1.5 shrink-0"
              >
                <span>교육과정 원문 보기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Section: 학교 특색사업 및 동아리 */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>학교 특색 및 학생활동</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">교육운영 특색사업</span>
                <span className="text-slate-600">
                  학교 자체 특색 프로그램, 창의인재 육성, 국제교류 및 지역연계 프로젝트
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">동아리 활동 및 방과후학교</span>
                <span className="text-slate-600">
                  학술·진로·예술체육 정규/자율동아리 개설 현황 및 교과/특기적성 방과후 프로그램
                </span>
              </div>
            </div>
          </div>

          {/* Section: 졸업생의 진로 현황 */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-700" />
              <span>졸업생의 진로 현황 (진학 및 취업)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              기준: 학교정보공시 공시연도 기준 최신 졸업생 통계
            </p>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
              <span className="text-slate-700 font-medium">
                4년제 대학교, 전문대학, 해외대학 진학 및 취업 현황 공시
              </span>
              <a
                href={officialInfoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition font-medium flex items-center gap-1.5 shrink-0"
              >
                <span>진로 현황 상세 보기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Official Full Page Action Button */}
          <div className="pt-2">
            <a
              href={officialInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>학교알리미 공식 공시정보 원문 전체 확인</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              * 학교알리미(학교정보공시)의 공식 데이터 및 원본 첨부파일(PDF/HWP)을 바로 조회할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
