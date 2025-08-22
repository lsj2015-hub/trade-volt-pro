// ====== API 응답 기본 타입 ======
export interface ApiResponseBase {
  success: boolean;
  error?: {
    code: string;
    message: string;
    path?: string;
  };
}

// ====== 에러 응답 타입 ======
export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
    path: string;
  };
}

// ====== 환경 변수 타입 ======
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
    }
  }
}
