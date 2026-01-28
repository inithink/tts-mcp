#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { TypecastAdapter } from './adapters/index.js';
import type { TTSAdapter, TTSOptions } from './adapters/base.js';

// 환경변수 로드
config();

const TYPECAST_API_KEY = process.env.TYPECAST_API_KEY;

if (!TYPECAST_API_KEY) {
  console.error('TYPECAST_API_KEY is required');
  process.exit(1);
}

// 어댑터 초기화
const adapters: Record<string, TTSAdapter> = {
  typecast: new TypecastAdapter(TYPECAST_API_KEY),
};

// MCP 서버 생성
const server = new Server(
  {
    name: 'tts-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'tts_synthesize',
      description: '텍스트를 음성 파일로 변환합니다',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '음성화할 텍스트',
          },
          voice_id: {
            type: 'string',
            description: '음성 ID (예: tc_xxx 또는 음성 이름)',
          },
          model_id: {
            type: 'string',
            description: '모델 ID (기본: ssfm-v21)',
            default: 'ssfm-v21',
          },
          adapter: {
            type: 'string',
            description: 'TTS 어댑터 (기본: typecast)',
            default: 'typecast',
          },
          options: {
            type: 'object',
            description: '추가 옵션 (emotion, format, outputDir 등)',
            properties: {
              emotion: { type: 'string' },
              emotion_intensity: { type: 'number' },
              volume: { type: 'number' },
              pitch: { type: 'number' },
              tempo: { type: 'number' },
              format: { type: 'string', enum: ['mp3', 'wav'] },
              outputDir: { type: 'string' },
              outputName: { type: 'string' },
            },
          },
        },
        required: ['text', 'voice_id'],
      },
    },
    {
      name: 'tts_list_voices',
      description: '사용 가능한 음성 목록을 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          adapter: {
            type: 'string',
            description: 'TTS 어댑터 (기본: typecast)',
            default: 'typecast',
          },
          model_id: {
            type: 'string',
            description: '모델 ID (선택)',
          },
        },
      },
    },
  ],
}));

// 도구 실행
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'tts_synthesize') {
      const {
        text,
        voice_id,
        model_id = 'ssfm-v21',
        adapter: adapterName = 'typecast',
        options = {},
      } = args as {
        text: string;
        voice_id: string;
        model_id?: string;
        adapter?: string;
        options?: TTSOptions;
      };

      const adapter = adapters[adapterName];
      if (!adapter) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown adapter: ${adapterName}` }),
            },
          ],
        };
      }

      const result = await adapter.synthesize(text, voice_id, model_id, options);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    }

    if (name === 'tts_list_voices') {
      const { adapter: adapterName = 'typecast', model_id } = args as {
        adapter?: string;
        model_id?: string;
      };

      const adapter = adapters[adapterName];
      if (!adapter) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown adapter: ${adapterName}` }),
            },
          ],
        };
      }

      const voices = await adapter.getVoices(model_id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(voices),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
    };
  }
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TTS MCP Server running on stdio');
}

main().catch(console.error);
