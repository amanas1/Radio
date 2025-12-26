// App.tsx — FINAL FIX (Google AI Studio layout)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadioStation } from './types';
import { GENRES, DEFAULT_VOLUME } from './constants';
import { fetchStationsByTag } from './services/radioService';

import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PreviousIcon,
  VolumeIcon,
} from './components/Icons';

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchStationsByTag(GENRES[0].id, 20).then(setStations);
  }, []);

  const playStation = useCallback((station: RadioStation) => {
    if (!audioRef.current) return;
    audioRef.current.src = station.url_resolved;
    audioRef.current.play().catch(() => {});
    setCurrentStation(station);
    setIsPlaying(true);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  };

  const next = () => {
    if (!currentStation || !stations.length) return;
    const i = stations.findIndex(s => s.stationuuid === currentStation.stationuuid);
    playStation(stations[(i + 1) % stations.length]);
  };

  const prev = () => {
    if (!currentStation || !stations.length) return;
    const i = stations.findIndex(s => s.stationuuid === currentStation.stationuuid);
    playStation(stations[(i - 1 + stations.length) % stations.length]);
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-white">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* MAIN CONTENT */}
      <main className="px-10 py-8 pb-40">
        <h1 className="text-3xl font-black mb-8">StreamFlow</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {stations.map(station => (
            <div
              key={station.stationuuid}
              onClick={() => playStation(station)}
              className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
            >
              <h3 className="font-bold truncate">{station.name}</h3>
              <p className="text-xs opacity-60 mt-1">
                {station.codec || 'MP3'} • {station.bitrate || 128}K
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* PLAYER BAR — ВНЕ MAIN (КЛЮЧЕВО) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-[9999]">
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl">
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">
              {currentStation?.name || 'Select a station'}
            </p>
            <p className="text-xs text-primary font-black">
              {isPlaying ? 'LIVE' : 'PAUSED'}
            </p>
          </div>

          <button onClick={prev}><PreviousIcon className="w-6 h-6" /></button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button onClick={next}><NextIcon className="w-6 h-6" /></button>

          <div className="flex items-center gap-2">
            <VolumeIcon className="w-5 h-5" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => {
                const v = Number(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
