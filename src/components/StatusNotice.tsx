import React, { useState } from 'react';
import { KeyRound, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';

interface KeyMissingNoticeProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export const KeyMissingNotice: React.FC<KeyMissingNoticeProps> = ({ onRetry, isRetrying }) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="p-6 my-auto text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs border border-amber-200">
        <KeyRound className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-2">
        학교알리미 인증키 설정 필요
      </h3>

      <p className="text-xs text-slate-600 leading-relaxed mb-4 whitespace-pre-line text-balance">
        학교알리미 인증키(SCHOOLINFO_API_KEY)가 설정되지 않았습니다.
        AI Studio의 Settings &gt; Secrets(또는 배포 사이트의 환경변수)에 키를 추가하면 학교 목록이 나타납니다.
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>키 설정 확인 및 다시 조회</span>
      </button>

      {/* Accordion Guide */}
      <div className="w-full mt-6 text-left border-t border-slate-200/80 pt-4">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>학교알리미 Open API 인증키 발급 방법</span>
          </span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showGuide && (
          <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p>1. <strong>학교알리미(schoolinfo.go.kr)</strong> 포털에 접속 후 회원가입 및 로그인합니다.</p>
            <p>2. <strong>Open API &gt; 인증키 신청</strong> 메뉴에서 서비스명과 용도를 기재하여 무료로 키를 신청합니다.</p>
            <p>3. 발급받은 인증키를 AI Studio 우측 상단의 <strong>Settings &gt; Secrets</strong>에 <code>SCHOOLINFO_API_KEY</code> 이름으로 등록합니다.</p>
            <p className="text-[11px] text-slate-400 pt-1">
              * 지도(OpenStreetMap)는 인증키 없이도 자유롭게 탐색할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface PartialFailureNoticeProps {
  failedDistricts: string[];
}

export const PartialFailureNotice: React.FC<PartialFailureNoticeProps> = ({ failedDistricts }) => {
  const [open, setOpen] = useState(false);
  if (failedDistricts.length === 0) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>일부 지역({failedDistricts.length}개 자치구) 조회 실패</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[11px] underline text-amber-700 hover:text-amber-900"
        >
          {open ? '접기' : '실패 지역 보기'}
        </button>
      </div>

      {open && (
        <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 text-[11px] text-amber-800">
          <span>실패 자치구: {failedDistricts.join(', ')}</span>
          <span className="block text-amber-700/80 mt-0.5">
            * 학교알리미 공공서버의 일시적 지연일 수 있습니다. 나머지 성공한 지역의 학교는 정상 표시됩니다.
          </span>
        </div>
      )}
    </div>
  );
};
