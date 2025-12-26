
import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, LoadingIcon, MusicNoteIcon, PlayIcon, PauseIcon } from './Icons';
import { Track, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface MusicDownloaderProps {
  language: Language;
}

const MusicDownloader: React.FC<MusicDownloaderProps> = ({ language }) => {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [previewedTrackIds, setPreviewedTrackIds] = useState<Set<string>>(new Set());
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = TRANSLATIONS[language];

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const searchManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchStatus('Поиск временно ограничен');
    
    setTimeout(() => {
        setIsSearching(false);
        setSearchStatus('Функция поиска находится на техническом обслуживании');
    }, 1500);
  };

  const togglePreview = (track: Track) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = track.audio;
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      setPlayingTrackId(track.id);
      setPreviewedTrackIds(prev => new Set(prev).add(track.id));
    }
  };

  const downloadTrack = async (track: Track) => {
    setDownloadingIds(prev => new Set(prev).add(track.id));
    
    try {
      const link = document.createElement('a');
      link.href = track.audio;
      link.setAttribute('download', `${track.artist_name} - ${track.name}.mp3`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(track.audio, '_blank');
    } finally {
      setTimeout(() => {
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="mb-8 p-10 rounded-[3rem] glass-panel relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-30"></div>
        
        <h2 className="text-4xl font-black mb-6 relative z-10 text-white tracking-tighter uppercase">
          {t.downloader}
        </h2>
        
        <form onSubmit={searchManual} className="relative z-10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-6 py-5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-white shadow-2xl"
              disabled
            />
          </div>
          <button 
            type="submit"
            disabled={true}
            className="px-10 py-5 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 cursor-not-allowed"
          >
            {t.search}
          </button>
        </form>

        {isSearching && (
          <div className="mt-6 flex items-center gap-3 animate-pulse relative z-10">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {searchStatus}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-4 pb-10">
        {!isSearching && tracks.length === 0 && query && (
             <div className="text-center py-20 opacity-50">
                 <MusicNoteIcon className="w-12 h-12 mx-auto mb-4" />
                 <p className="font-bold uppercase tracking-widest text-xs">Поиск песен временно недоступен. Пожалуйста, используйте каталог радиостанций.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default MusicDownloader;
