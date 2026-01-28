# TTS MCP Server

Text-to-Speech MCP (Model Context Protocol) 서버. 어댑터 패턴으로 다양한 TTS 서비스를 지원합니다.

## 지원 TTS 서비스

- **Typecast** - [Neosapience](https://typecast.ai/) TTS API

## 설치

```bash
npm install
npm run build
```

## 환경 변수

`.env` 파일 생성:

```env
TYPECAST_API_KEY=your_api_key_here
```

## Claude Code에 연결

```bash
claude mcp add tts-mcp -t stdio -s user \
  -e TYPECAST_API_KEY=your_api_key \
  -- node /path/to/tts-mcp/dist/index.js
```

## 도구 (Tools)

### `tts_synthesize`

텍스트를 음성 파일로 변환합니다.

**Parameters:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `text` | ✅ | 음성화할 텍스트 |
| `voice_id` | ✅ | 음성 ID (예: `tc_xxx`) |
| `model_id` | ❌ | 모델 ID (기본: `ssfm-v21`) |
| `adapter` | ❌ | TTS 어댑터 (기본: `typecast`) |
| `options` | ❌ | 추가 옵션 (아래 참조) |

**Options:**

| 옵션 | 타입 | 설명 |
|-----|------|------|
| `emotion` | string | 감정 프리셋 (`normal`, `happy`, `sad` 등) |
| `emotion_intensity` | number | 감정 강도 (0.0 ~ 2.0) |
| `volume` | number | 볼륨 (0 ~ 200, 기본: 100) |
| `pitch` | number | 피치 조절 (-12 ~ 12) |
| `tempo` | number | 템포 조절 (0.5 ~ 2.0) |
| `format` | string | 출력 형식 (`mp3` 또는 `wav`) |
| `outputDir` | string | 출력 디렉토리 |
| `outputName` | string | 출력 파일명 (확장자 제외) |

**Response:**

```json
{
  "filePath": "/path/to/output.mp3",
  "duration": 3.5,
  "format": "mp3"
}
```

### `tts_list_voices`

사용 가능한 음성 목록을 조회합니다.

**Parameters:**

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `adapter` | ❌ | TTS 어댑터 (기본: `typecast`) |
| `model_id` | ❌ | 모델 ID |

**Response:**

```json
[
  {
    "id": "tc_xxx",
    "name": "Voice Name",
    "model": "ssfm-v21",
    "emotions": ["normal", "happy", "sad"]
  }
]
```

## 사용 예시

### Claude Code에서 사용

```
# 음성 목록 조회
"typecast에서 사용 가능한 음성 목록 보여줘"

# TTS 생성
"'안녕하세요'를 tc_xxx 음성으로 변환해줘"

# 옵션 포함
"'반갑습니다'를 happy 감정으로, tempo 1.2로 변환해서 /output 폴더에 저장해줘"
```

## 어댑터 확장

새로운 TTS 서비스를 추가하려면 `TTSAdapter` 인터페이스를 구현하세요:

```typescript
// src/adapters/my-tts.ts
import type { TTSAdapter, TTSOptions, TTSResult, Voice } from './base.js';

export class MyTTSAdapter implements TTSAdapter {
  readonly name = 'my-tts';

  async synthesize(
    text: string,
    voiceId: string,
    modelId: string,
    options?: TTSOptions
  ): Promise<TTSResult> {
    // 구현
  }

  async getVoices(modelId?: string): Promise<Voice[]> {
    // 구현
  }
}
```

그리고 `src/index.ts`에서 어댑터 등록:

```typescript
import { MyTTSAdapter } from './adapters/my-tts.js';

const adapters: Record<string, TTSAdapter> = {
  typecast: new TypecastAdapter(TYPECAST_API_KEY),
  'my-tts': new MyTTSAdapter(API_KEY),
};
```

## PM2로 실행

```bash
pm2 start ecosystem.config.cjs
```

## 라이선스

MIT
