/**
 * Schoolinfo (학교알리미) API Service Module
 * 
 * Fetches high school data for all 25 districts of Seoul using the official Schoolinfo Open API.
 * Never leaks the API key to client or logs.
 */

export const SEOUL_DISTRICTS = [
  { name: "종로구", code: "11110" },
  { name: "중구", code: "11140" },
  { name: "용산구", code: "11170" },
  { name: "성동구", code: "11200" },
  { name: "광진구", code: "11215" },
  { name: "동대문구", code: "11230" },
  { name: "중랑구", code: "11260" },
  { name: "성북구", code: "11290" },
  { name: "강북구", code: "11305" },
  { name: "도봉구", code: "11320" },
  { name: "노원구", code: "11350" },
  { name: "은평구", code: "11380" },
  { name: "서대문구", code: "11410" },
  { name: "마포구", code: "11440" },
  { name: "양천구", code: "11470" },
  { name: "강서구", code: "11500" },
  { name: "구로구", code: "11530" },
  { name: "금천구", code: "11545" },
  { name: "영등포구", code: "11560" },
  { name: "동작구", code: "11590" },
  { name: "관악구", code: "11620" },
  { name: "서초구", code: "11650" },
  { name: "강남구", code: "11680" },
  { name: "송파구", code: "11710" },
  { name: "강동구", code: "11740" }
];

export const DISTRICT_TO_EDU_OFFICE: Record<string, string> = {
  "동대문구": "동부교육지원청",
  "중랑구": "동부교육지원청",
  "은평구": "서부교육지원청",
  "서대문구": "서부교육지원청",
  "마포구": "서부교육지원청",
  "영등포구": "남부교육지원청",
  "구로구": "남부교육지원청",
  "금천구": "남부교육지원청",
  "노원구": "북부교육지원청",
  "도봉구": "북부교육지원청",
  "종로구": "중부교육지원청",
  "중구": "중부교육지원청",
  "용산구": "중부교육지원청",
  "강동구": "강동송파교육지원청",
  "송파구": "강동송파교육지원청",
  "강서구": "강서양천교육지원청",
  "양천구": "강서양천교육지원청",
  "강남구": "강남서초교육지원청",
  "서초구": "강남서초교육지원청",
  "동작구": "동작관악교육지원청",
  "관악구": "동작관악교육지원청",
  "성동구": "성동광진교육지원청",
  "광진구": "성동광진교육지원청",
  "성북구": "성북강북교육지원청",
  "강북구": "성북강북교육지원청"
};

export type SchoolType = "일반고" | "자사고" | "특목고" | "영재고" | "특성화고" | "학력인정고" | "기타";
export type GenderType = "남학교" | "여학교" | "남녀공학" | "기타";
export type FoundationType = "공립" | "사립" | "국립" | "기타";

export interface School {
  schoolCode: string;
  schoolName: string;
  district: string;
  eduOffice: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
  phone: string;
  homepage: string;
  genderType: GenderType;
  foundationType: FoundationType;
  schoolType: SchoolType;
  rawSchoolType?: string;
  studentCount?: number | null;
  classCount?: number | null;
  teacherCount?: number | null;
  disclosureYear?: string | null;
}

export interface SchoolsApiResponse {
  success: boolean;
  totalCount: number;
  locationCount: number;
  noLocationCount: number;
  successfulDistrictsCount: number;
  failedDistricts: string[];
  schools: School[];
  timestamp: string;
}

export interface SchoolDetailData {
  schoolCode: string;
  schoolName: string;
  infoUrl: string;
  year: string;
  // Student counts
  students?: {
    total?: number;
    male?: number;
    female?: number;
    grade1?: number;
    grade2?: number;
    grade3?: number;
  };
  // Class counts
  classes?: {
    total?: number;
    grade1?: number;
    grade2?: number;
    grade3?: number;
    studentsPerClass?: number;
  };
  // Teachers
  teachers?: {
    total?: number;
    male?: number;
    female?: number;
    studentTeacherRatio?: number;
  };
  // Admissions info
  admissions?: {
    status?: string;
    details?: string;
    documentUrl?: string;
    documentTitle?: string;
  };
  // Curriculum
  curriculum?: {
    summary?: string;
    tracks?: string[];
    subjects?: string[];
    documentUrl?: string;
  };
  // Specialty / Clubs
  specialties?: {
    programs?: string[];
    clubs?: string[];
    afterSchool?: string;
    facilities?: string;
  };
  // Career / Graduates
  career?: {
    disclosureYear?: string;
    universityRate?: number; // 4-year
    collegeRate?: number; // 2-year
    employmentRate?: number;
    otherRate?: number;
    rawText?: string;
  };
  rawItems?: Record<string, unknown>[];
  hasOfficialData: boolean;
  fetchError?: string;
}

function getField(obj: Record<string, unknown>, keys: string[]): string {
  if (!obj) return "";
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return String(obj[k]).trim();
    }
    const lowerKey = k.toLowerCase();
    for (const prop in obj) {
      if (prop.toLowerCase() === lowerKey && obj[prop] !== undefined && obj[prop] !== null) {
        return String(obj[prop]).trim();
      }
    }
  }
  return "";
}

export function classifySchoolType(raw: string): SchoolType {
  if (!raw) return "기타";
  const str = raw.trim();
  if (str.includes("자율형사립고") || str.includes("자율형 사립고") || str.includes("자사고")) {
    return "자사고";
  }
  if (
    str.includes("특수목적고") ||
    str.includes("외국어고") ||
    str.includes("국제고") ||
    str.includes("과학고") ||
    str.includes("예술고") ||
    str.includes("체육고") ||
    str.includes("마이스터고")
  ) {
    return "특목고";
  }
  if (str.includes("영재학교") || str.includes("영재고")) {
    return "영재고";
  }
  if (str.includes("특성화고") || str.includes("직업고")) {
    return "특성화고";
  }
  if (str.includes("학력인정") || str.includes("평생교육")) {
    return "학력인정고";
  }
  if (
    str.includes("일반고") ||
    str.includes("일반고등학교") ||
    str.includes("자율형공립고") ||
    str.includes("자율형 공립고") ||
    str.includes("보통과")
  ) {
    return "일반고";
  }
  return "기타";
}

export function classifyGender(raw: string): GenderType {
  if (!raw) return "기타";
  const str = raw.trim();
  if (str === "남" || str === "남학교" || str === "남자고등학교" || str.includes("남고")) {
    return "남학교";
  }
  if (str === "여" || str === "여학교" || str === "여자고등학교" || str.includes("여고")) {
    return "여학교";
  }
  if (
    str.includes("남여공학") ||
    str.includes("남녀공학") ||
    str.includes("공학") ||
    str === "남여" ||
    str === "남녀"
  ) {
    return "남녀공학";
  }
  return "기타";
}

export function classifyFoundation(raw: string): FoundationType {
  if (!raw) return "기타";
  const str = raw.trim();
  if (str.includes("국립")) return "국립";
  if (str.includes("공립") || str.includes("시립")) return "공립";
  if (str.includes("사립")) return "사립";
  return "기타";
}

export function validateCoordinates(rawLat: string, rawLon: string): {
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
} {
  const latNum = Number(rawLat);
  const lonNum = Number(rawLon);

  const isValid =
    Number.isFinite(latNum) &&
    Number.isFinite(lonNum) &&
    latNum !== 0 &&
    lonNum !== 0 &&
    latNum >= 37.3 &&
    latNum <= 37.8 &&
    lonNum >= 126.6 &&
    lonNum <= 127.4;

  if (isValid) {
    return { latitude: latNum, longitude: lonNum, hasLocation: true };
  }
  return { latitude: null, longitude: null, hasLocation: false };
}

// In-memory cache for schools list (TTL: 15 minutes)
let cachedSchoolsResponse: SchoolsApiResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function fetchDistrictSchools(
  apiKey: string,
  districtName: string,
  sggCode: string
): Promise<School[]> {
  const url = new URL("https://www.schoolinfo.go.kr/openApi.do");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("apiType", "0");
  url.searchParams.set("sidoCode", "11");
  url.searchParams.set("sggCode", sggCode);
  url.searchParams.set("schulKndCode", "04");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "SeoulHighSchoolMap/1.0",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON returned from Schoolinfo API");
    }

    if (data.resultCode === "fail") {
      throw new Error(`Schoolinfo API: ${data.resultMsg || "조회 실패"}`);
    }

    const list = Array.isArray(data.list) ? data.list : [];
    const schools: School[] = [];

    for (const item of list as Record<string, unknown>[]) {
      const schoolCode = getField(item, ["SCHUL_CODE", "schulCode", "schul_code", "SH_CODE"]);
      const schoolName = getField(item, ["SCHUL_NM", "schulNm", "schul_nm", "SH_NM"]);
      if (!schoolCode || !schoolName) continue;

      const rawLat = getField(item, ["LA", "LAT", "latitude", "la", "lat"]);
      const rawLon = getField(item, ["LO", "LNT", "LON", "longitude", "lo", "lng"]);
      const { latitude, longitude, hasLocation } = validateCoordinates(rawLat, rawLon);

      const rawSchoolType = getField(item, [
        "HS_GNRL_BUSNS_SC_NM",
        "HS_KND_SC_NM",
        "SCHUL_KND_SC_NM",
        "schulKndScNm",
        "schulCrseScNm",
        "schulType"
      ]);
      const rawGender = getField(item, ["FOAS_MEMO", "COEDU_SC_NM", "cddcScNm", "sexdstnScNm", "gender"]);
      const rawFoundation = getField(item, ["FOND_SC_NM", "fondScNm", "fondType", "foundationType"]);

      const address = getField(item, ["ADRES", "adres", "adresDtl", "ADRES_DTL"]);
      const phone = getField(item, ["USER_TELNO", "telno", "userTelno", "tel"]);
      const homepage = getField(item, ["HMPG_ADRES", "hmpgAdres", "homepage"]);
      const disclosureYear = getField(item, ["DISCLOSURE_YR", "disclosureYear", "year"]);

      schools.push({
        schoolCode,
        schoolName,
        district: districtName,
        eduOffice: DISTRICT_TO_EDU_OFFICE[districtName] || "서울특별시교육청",
        address,
        latitude,
        longitude,
        hasLocation,
        phone,
        homepage,
        genderType: classifyGender(rawGender),
        foundationType: classifyFoundation(rawFoundation),
        schoolType: classifySchoolType(rawSchoolType),
        rawSchoolType,
        disclosureYear: disclosureYear || null,
      });
    }

    return schools;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch all 25 districts of Seoul concurrently in batches.
 * Preserves partial results if any district fails.
 */
export async function getAllSeoulSchools(forceRefresh = false): Promise<SchoolsApiResponse> {
  const apiKey = process.env.SCHOOLINFO_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    const err = new Error("SCHOOLINFO_API_KEY_MISSING");
    (err as unknown as { code: string }).code = "SCHOOLINFO_API_KEY_MISSING";
    throw err;
  }

  const now = Date.now();
  if (!forceRefresh && cachedSchoolsResponse && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSchoolsResponse;
  }

  const successfulSchools: School[] = [];
  const failedDistricts: string[] = [];
  let successfulDistrictsCount = 0;

  // Process in chunks of 5 to avoid overloading the public API
  const CHUNK_SIZE = 5;
  for (let i = 0; i < SEOUL_DISTRICTS.length; i += CHUNK_SIZE) {
    const chunk = SEOUL_DISTRICTS.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map((district) => fetchDistrictSchools(apiKey.trim(), district.name, district.code))
    );

    results.forEach((res, index) => {
      const district = chunk[index];
      if (res.status === "fulfilled") {
        successfulDistrictsCount++;
        successfulSchools.push(...res.value);
        console.log(`${district.name}: ${res.value.length}개`);
      } else {
        failedDistricts.push(district.name);
        console.warn(`${district.name} 조회 실패:`, res.reason?.message || "Timeout or Network error");
      }
    });
  }

  // Deduplicate by schoolCode
  const schoolMap = new Map<string, School>();
  for (const s of successfulSchools) {
    if (!schoolMap.has(s.schoolCode)) {
      schoolMap.set(s.schoolCode, s);
    }
  }

  const uniqueSchools = Array.from(schoolMap.values());
  const locationCount = uniqueSchools.filter((s) => s.hasLocation).length;
  const noLocationCount = uniqueSchools.length - locationCount;

  // Server console summary as permitted in prompt
  console.log(`성공 지역: ${successfulDistrictsCount}/25`);
  console.log(`실패 지역: ${failedDistricts.length}/25`);
  console.log(`전체 학교: ${uniqueSchools.length}개`);
  console.log(`좌표 있는 학교: ${locationCount}개`);
  console.log(`좌표 없는 학교: ${noLocationCount}개`);

  const response: SchoolsApiResponse = {
    success: successfulDistrictsCount > 0,
    totalCount: uniqueSchools.length,
    locationCount,
    noLocationCount,
    successfulDistrictsCount,
    failedDistricts,
    schools: uniqueSchools,
    timestamp: new Date().toISOString(),
  };

  if (successfulDistrictsCount > 0) {
    cachedSchoolsResponse = response;
    cacheTimestamp = now;
  }

  return response;
}

/**
 * Fetch detailed school disclosure data for a specific schoolCode.
 */
export async function getSchoolDetail(schoolCode: string): Promise<SchoolDetailData> {
  const apiKey = process.env.SCHOOLINFO_API_KEY;
  const infoUrl = `https://www.schoolinfo.go.kr/ei/ss/PbanListInfo.do?schulCode=${encodeURIComponent(schoolCode)}`;
  const currentYear = new Date().getFullYear().toString();

  if (!apiKey || apiKey.trim() === "") {
    return {
      schoolCode,
      schoolName: "",
      infoUrl,
      year: currentYear,
      hasOfficialData: false,
      fetchError: "SCHOOLINFO_API_KEY_MISSING",
    };
  }

  try {
    // Schoolinfo detail query
    const url = new URL("https://www.schoolinfo.go.kr/openApi.do");
    url.searchParams.set("apiKey", apiKey.trim());
    url.searchParams.set("apiType", "0");
    url.searchParams.set("schulCode", schoolCode);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "SeoulHighSchoolMap/1.0",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        schoolCode,
        schoolName: "",
        infoUrl,
        year: currentYear,
        hasOfficialData: false,
        fetchError: `학교알리미 응답 오류 (HTTP ${res.status})`,
      };
    }

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON
    }

    const list = Array.isArray(data.list) ? (data.list as Record<string, unknown>[]) : [];
    const item = list[0] || {};
    const schoolName = getField(item, ["SCHUL_NM", "schulNm", "SH_NM"]);

    // Extract student and teacher counts if present
    const rawTotalStudents = getField(item, ["COL_SUM_SUM", "TOT_STDNT_CO", "stdntCo", "studentCount"]);
    const rawTotalClasses = getField(item, ["CLS_CNT", "CLASS_CO", "classCount"]);
    const rawTotalTeachers = getField(item, ["TCHR_CO", "teacherCount"]);

    const totalStudents = rawTotalStudents ? parseInt(rawTotalStudents, 10) : undefined;
    const totalClasses = rawTotalClasses ? parseInt(rawTotalClasses, 10) : undefined;
    const totalTeachers = rawTotalTeachers ? parseInt(rawTotalTeachers, 10) : undefined;

    let studentsPerClass: number | undefined;
    if (totalStudents && totalClasses && totalClasses > 0) {
      studentsPerClass = Math.round((totalStudents / totalClasses) * 10) / 10;
    }

    return {
      schoolCode,
      schoolName: schoolName || "",
      infoUrl,
      year: currentYear,
      hasOfficialData: list.length > 0,
      students: totalStudents ? { total: totalStudents } : undefined,
      classes: totalClasses ? { total: totalClasses, studentsPerClass } : undefined,
      teachers: totalTeachers ? { total: totalTeachers } : undefined,
      admissions: {
        status: "학교알리미 공식 공시자료 확인 가능",
        documentUrl: infoUrl,
        documentTitle: `${schoolName || "학교"} 공시자료 바로가기`,
      },
      rawItems: list,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "상세자료 조회 중 오류가 발생했습니다";
    return {
      schoolCode,
      schoolName: "",
      infoUrl,
      year: currentYear,
      hasOfficialData: false,
      fetchError: errorMsg,
    };
  }
}
