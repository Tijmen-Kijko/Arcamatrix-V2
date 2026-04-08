/**
 * Mock Sages API — no backend needed.
 * Swap to real endpoints once S-01 is complete.
 */

import type { SagesMessage } from '../stores/sagesStore';

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export interface SagesSessionResponse {
  session_id: string;
  tts_voice: string;
}

export interface SagesSpeakResponse {
  response_text: string;
  response_audio_url: string | null;
}

export interface SagesEndResponse {
  duration_seconds: number;
  transcript: SagesMessage[];
}

const MOCK_RESPONSES = [
  'Ik heb je vraag ontvangen. Laat me even nadenken over het beste antwoord.',
  'Goed punt! Ik zou aanraden om dit stap voor stap aan te pakken.',
  'Dat is een interessante vraag. Op basis van de context denk ik het volgende.',
  'Ik begrijp wat je bedoelt. Hier is mijn analyse.',
  'Laten we dit samen bekijken. Ik zie een paar mogelijkheden.',
];

let responseCounter = 0;

export async function startSagesSession(
  _mode: 'voice' | 'video',
  _workspaceId: string,
): Promise<SagesSessionResponse> {
  await delay(600);
  return {
    session_id: `sages-${Date.now()}`,
    tts_voice: 'nova',
  };
}

export async function sagesSpeak(
  _sessionId: string,
  transcript: string,
): Promise<SagesSpeakResponse> {
  // Simulate Hermes processing + TTS generation
  await delay(1200 + Math.random() * 800);
  const idx = responseCounter++ % MOCK_RESPONSES.length;
  const text = `${MOCK_RESPONSES[idx]}\n\n_(Reactie op: "${transcript.slice(0, 50)}")_`;
  return {
    response_text: text,
    response_audio_url: null, // Mock — no real audio in MVP stub
  };
}

export async function sagesTts(
  _text: string,
  _voice: string,
): Promise<ArrayBuffer | null> {
  // Mock — return null (no real audio). Components handle gracefully.
  await delay(200);
  return null;
}

export async function endSagesSession(
  _sessionId: string,
): Promise<SagesEndResponse> {
  await delay(300);
  return {
    duration_seconds: 0, // Caller computes actual duration
    transcript: [],       // Caller uses local transcript
  };
}
