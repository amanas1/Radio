
export interface RadioStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  type?: 'genre' | 'era' | 'mood';
  description?: string;
}

export type ViewMode = 'genres' | 'eras' | 'moods' | 'favorites';
export type VisualizerVariant = 'segmented' | 'rainbow-lines' | 'galaxy' | 'mixed-rings' | 'bubbles' | 'stage-dancer' | 'trio-dancers' | 'viz-journey';

export interface VisualizerSettings {
  scaleX: number;
  scaleY: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  opacity: number;
  speed: number;
  autoIdle: boolean;
  performanceMode: boolean;
  danceArmIntensity?: number;
  danceLegIntensity?: number;
  danceHeadIntensity?: number;
}

export type ThemeName = 
  | 'default' 
  | 'emerald' 
  | 'midnight' 
  | 'cyber' 
  | 'volcano' 
  | 'ocean' 
  | 'sakura' 
  | 'gold' 
  | 'frost' 
  | 'forest';

export type BaseTheme = 'dark' | 'light' | 'auto';
export type Language = 'en' | 'ru' | 'kk' | 'ky';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  age: number;
  country: string;
  city: string;
  gender: 'male' | 'female' | 'other';
  status: 'online' | 'offline';
  safetyLevel: 'green' | 'yellow' | 'red';
  blockedUsers: string[];
  bio: string;
  hasAgreedToRules: boolean;
  filters: {
    minAge: number;
    maxAge: number;
    countries: string[];
    languages: string[];
    genders: (string | 'any')[];
    soundEnabled: boolean;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  image?: string;
  audioBase64?: string;
  timestamp: Date;
  read: boolean;
  isUserMessage?: boolean;
}

export interface ChatSession {
  id: string;
  partnerId: string;
  lastMessage: string;
  lastMessageTime: Date;
}

export type ChatActiveView = 'community_chats' | 'my_messages' | 'profile' | 'room';

export interface Track {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  audio: string;
  image: string;
}
