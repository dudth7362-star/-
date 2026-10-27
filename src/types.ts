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

export interface FilterState {
  searchQuery: string;
  district: string; // "all" or specific district name
  schoolType: SchoolType | "all";
  genderType: GenderType | "all";
  foundationType: FoundationType | "all";
  eduOffice: string; // "all" or specific eduOffice
  onlyFavorites: boolean;
  onlyWithLocation: boolean;
}

export interface SchoolDetailData {
  schoolCode: string;
  schoolName: string;
  infoUrl: string;
  year: string;
  students?: {
    total?: number;
    male?: number;
    female?: number;
    grade1?: number;
    grade2?: number;
    grade3?: number;
  };
  classes?: {
    total?: number;
    grade1?: number;
    grade2?: number;
    grade3?: number;
    studentsPerClass?: number;
  };
  teachers?: {
    total?: number;
    male?: number;
    female?: number;
    studentTeacherRatio?: number;
  };
  admissions?: {
    status?: string;
    details?: string;
    documentUrl?: string;
    documentTitle?: string;
  };
  curriculum?: {
    summary?: string;
    tracks?: string[];
    subjects?: string[];
    documentUrl?: string;
  };
  specialties?: {
    programs?: string[];
    clubs?: string[];
    afterSchool?: string;
    facilities?: string;
  };
  career?: {
    disclosureYear?: string;
    universityRate?: number;
    collegeRate?: number;
    employmentRate?: number;
    otherRate?: number;
    rawText?: string;
  };
  rawItems?: Record<string, unknown>[];
  hasOfficialData: boolean;
  fetchError?: string;
}
