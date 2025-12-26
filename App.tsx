// App.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  RadioStation, CategoryInfo, ViewMode, ThemeName,
  BaseTheme, Language, UserProfile, VisualizerVariant, VisualizerSettings
} from './types';
import { GENRES, ERAS, MOODS, DEFAULT_VOLUME, TRANSLATIONS } from './constants';
import { fetchStationsByTag, fetchStationsByUuids } from './services/radioService';

import AudioVisualizer from './components/AudioVisualizer';
import DancingAvatar from './components/DancingAvatar';
import ToolsPanel from './components/ToolsPanel';
import ChatPanel from './components/ChatPanel';
import ManualModal from './components/ManualModal';
import TutorialOverlay from './components/TutorialOverlay';

import {
  PauseIcon, VolumeIcon, LoadingIcon, MusicNoteIcon,
  HeartIcon, MenuIcon, AdjustmentsIcon, PlayIcon,
  ChatBubbleIcon, NextIcon, PreviousIcon, MaximizeIcon,
  XMarkIcon, PlusIcon
} from './components/Icons';

/* ===========================
   CONFIG
=========================== */

const THEME_COLORS: Record<ThemeName, { primary: string; secondary: string }> = {
  default: { primary: '#bc6ff1', secondary: '#f038ff' },
  emerald: { primary: '#00ff9f', secondary: '#00b8ff' },
  midnight: { primary: '#4d4dff', secondary: '#a64dff' },
  cyber: { primary: '#ff00ff', secondary: '#00ffff' },
  volcano: { primary: '#ff3c00', secondary: '#ffcc00' },
  ocean: { primary: '#00d2ff', secondary: '#3a7bd5' },
  sakura: { primary: '#ff758c', secondary: '#ff7eb3' },
  gold: { primary: '#ffcc33', secondary: '#cc9900' },
  frost: { primary: '#74ebd5', secondary: '#acb6e5' },
  forest: { primary: '#a8ff78', secondary: '#78ffd6' },
};

const DEFAULT_VIZ_SETTINGS: VisualizerSettings = {
  scaleX: 1,
  scaleY: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  opacity: 1,
  speed: 1,
  autoIdle: true,
  performanceMode: true
};

const INITIAL_CHUNK = 5;
const PAGE_SIZE = 10;
const MAX_STATIONS = 50;

/* ===========================
   COMPONENT
=========================== */

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [visibleCount, setVisibleCount] = useState(INITIAL_CHUNK);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  /* ===== INIT AUDIO ===== */
  const initAudio = () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    if (audioRef.current) {
      const src = ctx.createMediaElementSource(audioRef.current);
      src.connect(analyser);
      analyser.connect(ctx.destination);
    }
  };

  const playStation = (s: RadioStation) => {
    initAudio();
    setCurrentStation(s);
    setIsBuffering(true);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = s.url_resolved;
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  };

  useEffect(() => {
    fetchStationsByTag('jazz', MAX_STATIONS).then(setStations);
  }, []);

  /* ===========================
     RENDER
  =========================== */

  return (
    <div className="relative h-screen bg-slate-950 text-white overflow-hidden">

      <audio
        ref={audioRef}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
      />

      {/* ===== MAIN ===== */}
      <main className="h-full overflow-y-auto pb-40 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
          {stations.slice(0, visibleCount).map(s => (
            <div
              key={s.stationuuid}
              onClick={() => playStation(s)}
              className="cursor-pointer p-5 rounded-2xl border border-white/10 bg-white/5 hover:border-white/30 transition"
            >
              <div className="font-bold text-sm truncate">{s.name}</div>
              <div className="text-xs opacity-50">{s.codec} · {s.bitrate}k</div>
            </div>
          ))}
        </div>

        {visibleCount < stations.length && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 transition"
            >
              Load more
            </button>
          </div>
        )}
      </main>

      {/* ===========================
          🎧 PLAYER (FIXED)
      =========================== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-50">
        <div className="
          flex items-center justify-between
          bg-slate-900
          border border-white/20
          rounded-2xl
          px-6 py-4
          shadow-[0_20px_50px_rgba(0,0,0,0.8)]
        ">
          <div className="flex items-center gap-4 min-w-0">
            <DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-10 h-10" />
            <div className="min-w-0">
              <div className="font-bold truncate">
                {currentStation?.name || 'Radio Stream'}
              </div>
              <div className="text-xs text-purple-400 font-bold">
                {isBuffering ? 'BUFFERING…' : 'LIVE'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition">
              {isBuffering ? <LoadingIcon className="w-5 h-5 animate-spin" />
                : isPlaying ? <PauseIcon className="w-5 h-5" />
                  : <PlayIcon className="w-5 h-5 ml-0.5" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <VolumeIcon className="w-5 h-5 opacity-60" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-24 accent-purple-500"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
