/**
 * TTS 어댑터 인터페이스
 * 다양한 TTS 서비스를 추상화하여 동일한 인터페이스로 사용 가능
 */

export interface TTSOptions {
  /** 감정 프리셋 (예: normal, happy, sad) */
  emotion?: string;
  /** 감정 강도 (0.0 ~ 2.0) */
  emotion_intensity?: number;
  /** 볼륨 (0 ~ 200, 기본: 100) */
  volume?: number;
  /** 피치 조절 (-12 ~ 12) */
  pitch?: number;
  /** 템포 조절 (0.5 ~ 2.0) */
  tempo?: number;
  /** 출력 형식 */
  format?: 'mp3' | 'wav';
  /** 언어 코드 (ISO 639-3) */
  language?: string;
  /** 출력 디렉토리 */
  outputDir?: string;
  /** 출력 파일명 (확장자 제외) */
  outputName?: string;
  /** 추가 옵션 (어댑터별 확장) */
  [key: string]: unknown;
}

export interface TTSResult {
  /** 생성된 파일 경로 */
  filePath: string;
  /** 음성 길이 (초) */
  duration: number;
  /** 파일 형식 */
  format: string;
}

export interface Voice {
  /** 음성 ID */
  id: string;
  /** 음성 이름 */
  name: string;
  /** 지원 모델 */
  model: string;
  /** 지원 감정 목록 */
  emotions?: string[];
  /** 언어 */
  language?: string;
}

export interface TTSAdapter {
  /** 어댑터 이름 */
  readonly name: string;

  /**
   * 텍스트를 음성으로 변환
   * @param text 음성화할 텍스트
   * @param voiceId 음성 ID
   * @param modelId 모델 ID
   * @param options 추가 옵션
   */
  synthesize(
    text: string,
    voiceId: string,
    modelId: string,
    options?: TTSOptions
  ): Promise<TTSResult>;

  /**
   * 사용 가능한 음성 목록 조회
   * @param modelId 모델 ID (선택)
   */
  getVoices(modelId?: string): Promise<Voice[]>;

  /**
   * 음성 ID로 음성 정보 조회
   * @param voiceId 음성 ID
   * @param modelId 모델 ID (선택)
   */
  getVoiceById?(voiceId: string, modelId?: string): Promise<Voice | null>;
}
