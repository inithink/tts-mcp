import { TypecastClient } from '@neosapience/typecast-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type { TTSAdapter, TTSOptions, TTSResult, Voice } from './base.js';

function getAudioDuration(filePath: string): number {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(result.trim());
  } catch {
    return 0;
  }
}

export class TypecastAdapter implements TTSAdapter {
  readonly name = 'typecast';
  private client: TypecastClient;

  constructor(apiKey: string) {
    this.client = new TypecastClient({ apiKey });
  }

  async synthesize(
    text: string,
    voiceId: string,
    modelId: string,
    options?: TTSOptions
  ): Promise<TTSResult> {
    const format = options?.format || 'mp3';
    const outputDir = options?.outputDir || tmpdir();
    const outputName = options?.outputName || `tts_${Date.now()}`;
    const filePath = join(outputDir, `${outputName}.${format}`);

    // 디렉토리 생성
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // TTS 요청
    const audio = await this.client.textToSpeech({
      text,
      model: modelId as 'ssfm-v21',
      voice_id: voiceId,
      prompt: {
        emotion_preset: (options?.emotion as any) || 'normal',
        emotion_intensity: options?.emotion_intensity,
      },
      output: {
        audio_format: format,
        volume: options?.volume,
        audio_pitch: options?.pitch,
        audio_tempo: options?.tempo,
      },
    } as any);

    // 파일 저장
    await writeFile(filePath, Buffer.from(audio.audioData));

    // 길이 측정
    const duration = getAudioDuration(filePath);

    return {
      filePath,
      duration,
      format,
    };
  }

  async getVoices(modelId?: string): Promise<Voice[]> {
    const model = modelId || 'ssfm-v21';
    const voices = await this.client.getVoices(model);

    return voices.map((v) => ({
      id: v.voice_id,
      name: v.voice_name,
      model: v.model,
      emotions: v.emotions,
    }));
  }

  async getVoiceById(voiceId: string, modelId?: string): Promise<Voice | null> {
    const model = modelId || 'ssfm-v21';
    const voices = await this.client.getVoiceById(voiceId, model);

    if (voices.length === 0) return null;

    const v = voices[0];
    return {
      id: v.voice_id,
      name: v.voice_name,
      model: v.model,
      emotions: v.emotions,
    };
  }
}
