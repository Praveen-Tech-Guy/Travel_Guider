
export enum View {
  LANDING = 'LANDING',
  PLANNER = 'PLANNER',
  VOICE = 'VOICE',
  STUDIO = 'STUDIO',
}

export type ModelMode = 'fast' | 'balanced' | 'deep';

export type TripType = 'Adventure' | 'Relaxation' | 'Business' | 'Family' | 'Cultural' | 'General';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  country?: string;
}

export interface Attachment {
  type: 'image' | 'video';
  mimeType: string;
  data: string; // base64
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  groundingLinks?: string[];
  costData?: CostItem[];
  currency?: Currency;
  attachments?: Attachment[];
}

export interface CostItem {
  category: string;
  amount: number;
}

export interface VideoGenerationState {
  isGenerating: boolean;
  progress: string;
  videoUrl?: string;
  error?: string;
}

export interface VoiceState {
  isConnected: boolean;
  isSpeaking: boolean;
  volume: number;
}

export interface ChatSession {
  id: string;
  title: string;
  type?: TripType;
  messages: ChatMessage[];
  updatedAt: Date;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: Date;
}

export type ImageModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
export type ImageResolution = '1K' | '2K' | '4K';
export type ImageAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
