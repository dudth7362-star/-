import React from 'react';
import { School } from '../types';
import { X, ExternalLink, Trash2, Scale, ArrowRight } from 'lucide-react';

interface ComparisonModalProps {
  schools: School[];
  onClose: () => void;
  onRemoveSchool: (schoolCode: string) => void;
  onSelectSchool: (school: School) => void;
  onClearComparison: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  schools,
  onClose,
  onRemoveSchool,
  onSelectSchool,
  onClearComparison,
}) => {
  if (schools.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                학교 공시정보 비교함 ({schools.length}/4)
              </h2>
              <p className="text-xs text-slate-500">
                선택한 고등학교의 주요 항목을 한눈에 나란히 비교합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearComparison}
              className="text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded hover:bg-slate-100 transition"
            >
              전체 비우기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-4 md:p-6 overflow-auto flex-1">
          <div className="min-w-[640px]">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-500 border-b border-slate-200 w-36 bg-slate-50/50">
                    비교 항목
                  </th>
                  {schools.map((s) => (
                    <th
                      key={s.schoolCode}
                      className="p-3 text-left font-bold text-slate-900 border-b border-slate-200 bg-blue-50/20 relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            onClick={() => {
                              onSelectSchool(s);
                              onClose();
                            }}
                            className="hover:text-blue-600 hover:underline text-left block font-bold text-sm"
                          >
                            {s.schoolName}
                          </button>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {s.district}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveSchool(s.schoolCode)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="비교함에서 제거"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">학교유형</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 font-semibold text-blue-700">
                      {s.schoolType}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">남녀구분</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-700 font-medium">
                      {s.genderType}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">설립구분</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-700 font-medium">
                      {s.foundationType}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">지역 (구)</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-700">
                      {s.district}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">관할 교육지원청</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-700">
                      {s.eduOffice}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">전체 학생 수</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 font-bold text-slate-900 tabular-nums">
                      {s.studentCount ? `${s.studentCount.toLocaleString()}명` : '공시 확인 필요'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">전체 학급 수</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-800 tabular-nums">
                      {s.classCount ? `${s.classCount}학급` : '공시 확인 필요'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">학급당 학생 수</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 font-semibold text-blue-600 tabular-nums">
                      {s.studentCount && s.classCount
                        ? `${(s.studentCount / s.classCount).toFixed(1)}명`
                        : '확인 필요'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">교원 수</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-800 tabular-nums">
                      {s.teacherCount ? `${s.teacherCount}명` : '공시 확인 필요'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">주소</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-600 text-xs">
                      {s.address || '정보 없음'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">전화번호</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3 text-slate-600 text-xs">
                      {s.phone || '미등록'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-500 bg-slate-50/30">상세 링크</td>
                  {schools.map((s) => (
                    <td key={s.schoolCode} className="p-3">
                      <a
                        href={`https://www.schoolinfo.go.kr/ei/ss/PbanListInfo.do?schulCode=${encodeURIComponent(
                          s.schoolCode
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        <span>공시정보 원문</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
