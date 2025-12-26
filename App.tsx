
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RadioStation, CategoryInfo, ViewMode, ThemeName, BaseTheme, Language, UserProfile, VisualizerVariant, VisualizerSettings } from './types';
import { GENRES, ERAS, MOODS, DEFAULT_VOLUME, TRANSLATIONS } from './constants';
import { fetchStationsByTag, fetchStationsByUuids } from './services/radioService';
import AudioVisualizer from './components/AudioVisualizer';
import DancingAvatar from './components/DancingAvatar';
import ToolsPanel from './components/ToolsPanel';
import ChatPanel from './components/ChatPanel';
import ManualModal from './components/ManualModal';
import TutorialOverlay from './components/TutorialOverlay';
import { 
  PauseIcon, 
  VolumeIcon, 
  LoadingIcon, 
  MusicNoteIcon, 
  HeartIcon, 
  MenuIcon, 
  AdjustmentsIcon,
  PlayIcon,
  ChatBubbleIcon,
  NextIcon,
  PreviousIcon,
  MaximizeIcon,
  XMarkIcon,
  PlusIcon
} from './components/Icons';

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
  scaleX: 1.0,
  scaleY: 1.0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  opacity: 1.0,
  speed: 1.0,
  autoIdle: true,
  performanceMode: true
};

// Optimized Pipeline configuration for 50-station limit
const INITIAL_CHUNK = 5; 
const TRICKLE_STEP = 5;
const AUTO_TRICKLE_LIMIT = 15; // Auto-show first 15 smoothly
const PAGE_SIZE = 10; // Load 10 more on click
const MAX_STATIONS_PER_CAT = 50;

const StationCard = React.memo(({ 
  station, isSelected, isFavorite, onPlay, onToggleFavorite, index 
}: { 
  station: RadioStation; isSelected: boolean; isFavorite: boolean; 
  onPlay: (s: RadioStation) => void; onToggleFavorite: (id: string) => void; index: number;
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      onClick={() => onPlay(station)} 
      className={`group relative rounded-[2rem] p-5 cursor-pointer transition-all border-2 animate-in fade-in slide-in-from-bottom-3 duration-500 ${isSelected ? 'bg-[var(--selected-item-bg)] border-primary shadow-2xl shadow-primary/20 scale-[1.02]' : 'glass-card border-[var(--panel-border)] hover:border-white/20 hover:bg-white/5'}`}
      style={{ animationDelay: `${(index % 5) * 50}ms` }}
    >
      <div className="flex justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-800/50 relative shadow-inner">
          {!imgLoaded && !imgError && <div className="absolute inset-0 skeleton-loader" />}
          {station.favicon && !imgError ? (
            <img 
              src={station.favicon} 
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`} 
            />
          ) : (
            <MusicNoteIcon className="w-6 h-6 text-slate-600" />
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(station.stationuuid); }} 
          className={`p-2 rounded-full transition-all active:scale-150 ${isFavorite ? 'text-secondary bg-secondary/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          <HeartIcon className="w-5 h-5" filled={isFavorite} />
        </button>
      </div>
      <h3 className="font-bold truncate text-[var(--text-base)] text-sm group-hover:text-primary transition-colors">{station.name}</h3>
      <p className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-widest">{station.codec || 'MP3'} • {station.bitrate || 128}K</p>
    </div>
  );
});

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('genres');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(GENRES[0]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_CHUNK);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [baseTheme, setBaseTheme] = useState<BaseTheme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [visualizerVariant, setVisualizerVariant] = useState<VisualizerVariant>('galaxy');
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>(DEFAULT_VIZ_SETTINGS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isIdleView, setIsIdleView] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'me', name: 'Listener', avatar: null, age: 25, country: 'World', city: 'Somewhere', gender: 'other', status: 'online', safetyLevel: 'green', blockedUsers: [], bio: 'Music is life.', hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const sleepIntervalRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);

  const t = TRANSLATIONS[language];

  // Pipeline Render logic - Background trickle for smooth appearance
  useEffect(() => {
    if (!isLoading && stations.length > visibleCount && visibleCount < AUTO_TRICKLE_LIMIT) {
      trickleTimerRef.current = window.setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + TRICKLE_STEP, stations.length));
      }, 180); // Slightly slower trickle for better perceived "loading while enjoying" effect
    }
    return () => { if (trickleTimerRef.current) clearTimeout(trickleTimerRef.current); };
  }, [isLoading, stations.length, visibleCount]);

  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = window.setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 1) {
            if (audioRef.current) audioRef.current.pause();
            if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 60000);
    } else {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    }
    return () => { if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current); };
  }, [sleepTimer]);

  const resetIdleTimer = useCallback(() => {
    if (!vizSettings.autoIdle) {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      return;
    }
    setIsIdleView(prev => prev ? false : prev);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (isPlaying && !isBuffering && !toolsOpen && !chatOpen && !mobileMenuOpen) {
      idleTimerRef.current = window.setTimeout(() => setIsIdleView(true), 15000);
    }
  }, [isPlaying, isBuffering, toolsOpen, chatOpen, mobileMenuOpen, vizSettings.autoIdle]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handler));
    resetIdleTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    const colors = THEME_COLORS[currentTheme];
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
  }, [currentTheme]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048; 
        analyserNodeRef.current = analyser;
        if (audioRef.current) {
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
        }
    } catch (e) {}
  }, []);

  const handlePlayStation = useCallback((station: RadioStation) => {
    initAudioContext();
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
    setCurrentStation(station);
    setIsPlaying(true);
    setIsBuffering(true);
    if (audioRef.current) {
        audioRef.current.src = station.url_resolved;
        audioRef.current.crossOrigin = "anonymous";
        audioRef.current.play().catch(() => {});
    }
  }, [initAudioContext]);

  const loadCategory = useCallback(async (category: CategoryInfo | null, mode: ViewMode, autoPlay: boolean = false) => { 
    setViewMode(mode); 
    setSelectedCategory(category); 
    setIsLoading(true); 
    setMobileMenuOpen(false);
    setVisibleCount(INITIAL_CHUNK);
    try {
      let data: RadioStation[] = [];
      if (mode === 'favorites') {
        const savedFavs = localStorage.getItem('streamflow_favorites');
        const favUuids = savedFavs ? JSON.parse(savedFavs) : [];
        data = favUuids.length ? await fetchStationsByUuids(favUuids) : [];
      } else if (category) {
        // Fetching up to 50 as requested for the limit
        data = await fetchStationsByTag(category.id, MAX_STATIONS_PER_CAT); 
      }
      setStations(data); 
      setIsLoading(false); 
      if (data.length > 0 && autoPlay) handlePlayStation(data[0]);
    } catch (e) { setIsLoading(false); }
  }, [handlePlayStation]);

  const handleNextStation = useCallback(() => {
    if (!stations.length) return;
    const currentIndex = currentStation ? stations.findIndex(s => s.stationuuid === currentStation.stationuuid) : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % stations.length;
    handlePlayStation(stations[nextIndex]);
  }, [stations, currentStation, handlePlayStation]);

  const handlePreviousStation = useCallback(() => {
    if (!stations.length) return;
    const currentIndex = currentStation ? stations.findIndex(s => s.stationuuid === currentStation.stationuuid) : -1;
    const prevIndex = currentIndex === -1 ? stations.length - 1 : (currentIndex - 1 + stations.length) % stations.length;
    handlePlayStation(stations[prevIndex]);
  }, [stations, currentStation, handlePlayStation]);

  useEffect(() => {
    const savedFavs = localStorage.getItem('streamflow_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    // Updated language initialization logic for ru, kk, ky, en
    const bl = navigator.language.toLowerCase();
    const browserLang: Language = bl.startsWith('ru') ? 'ru' 
                                : bl.startsWith('kk') ? 'kk' 
                                : bl.startsWith('ky') ? 'ky' 
                                : 'en';
    setLanguage(browserLang);
    loadCategory(GENRES[0], 'genres', false);
  }, [loadCategory]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(p => p.includes(id) ? p.filter(fid => fid !== id) : [...p, id]);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !currentStation) {
      if (stations.length) handlePlayStation(stations[0]);
      return;
    }
    if (isPlaying) audioRef.current.pause();
    else {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      audioRef.current.play().catch(() => {});
    }
  };

  const getLocalizedCategoryName = (cat: CategoryInfo | null) => {
    if (!cat) return '';
    const localizedMap: Record<string, string> = { 
      jazz: 'Jazz', rock: 'Rock', classical: 'Classical', electronic: 'Electronic', hiphop: 'Hip Hop', pop: 'Pop', 
      chill: language === 'ru' ? 'Спокойное' : language === 'ky' ? 'Жайлуу' : language === 'kk' ? 'Жайлы' : 'Chill', 
      energy: language === 'ru' ? 'Энергия' : language === 'ky' ? 'Энергия' : language === 'kk' ? 'Энергия' : 'Energy', 
      focus: language === 'ru' ? 'Фокус' : language === 'ky' ? 'Фокус' : language === 'kk' ? 'Фокус' : 'Focus', 
      romantic: language === 'ru' ? 'Романтика' : language === 'ky' ? 'Романтика' : language === 'kk' ? 'Романтика' : 'Romantic', 
      dark: language === 'ru' ? 'Клубное' : language === 'ky' ? 'Клубтук' : language === 'kk' ? 'Клубтық' : 'Club' 
    };
    if (localizedMap[cat.id]) return localizedMap[cat.id];
    return cat.name;
  };

  const visibleStations = useMemo(() => stations.slice(0, visibleCount), [stations, visibleCount]);

  return (
    <div className={`relative flex h-screen font-sans overflow-hidden bg-[var(--base-bg)] text-[var(--text-base)] transition-all duration-700`}>
      <audio ref={audioRef} onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }} onPause={() => setIsPlaying(false)} onWaiting={() => setIsBuffering(true)} />

      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-all duration-500 md:relative glass-panel flex flex-col bg-[var(--panel-bg)] ${isIdleView ? '-translate-x-full opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-3"><h1 className="text-2xl font-black tracking-tighter">StreamFlow</h1><DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-9 h-9" /></div>
           <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="px-4 pb-4 space-y-2">
            <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--panel-border)] gap-1">
                {(['genres', 'eras', 'moods'] as const).map(m => (
                    <button key={m} onClick={() => loadCategory(m === 'genres' ? GENRES[0] : m === 'eras' ? ERAS[0] : MOODS[0], m, false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${viewMode === m ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400'}`}>{t[m]}</button>
                ))}
            </div>
            <button onClick={() => loadCategory(null, 'favorites', false)} className={`w-full py-3 rounded-2xl text-xs font-black border transition-all ${viewMode === 'favorites' ? 'bg-secondary border-secondary text-white' : 'bg-[var(--input-bg)] text-slate-400'}`}>
                <HeartIcon className="w-4 h-4 inline mr-2" filled={viewMode === 'favorites'} /> {t.favorites}
            </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 no-scrollbar">
          {(viewMode === 'genres' ? GENRES : viewMode === 'eras' ? ERAS : MOODS).map((cat) => (
            <button key={cat.id} onClick={() => loadCategory(cat, viewMode, false)} className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all ${selectedCategory?.id === cat.id ? 'bg-[var(--selected-item-bg)] font-black' : 'text-slate-400 hover:text-[var(--text-base)]'}`}>{getLocalizedCategoryName(cat)}</button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-20 flex items-center px-6 md:px-10 justify-between shrink-0 transition-all duration-500 z-10 ${isIdleView ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="text-slate-400 text-sm font-medium tracking-wide shrink-0">{t.listeningTo} <span className="text-[var(--text-base)] font-black uppercase tracking-widest ml-1">{viewMode === 'favorites' ? t.favorites : getLocalizedCategoryName(selectedCategory)}</span></div>
          <div className="flex items-center gap-4"><button onClick={() => setChatOpen(!chatOpen)} className="p-2 rounded-full relative text-primary hover:scale-110 transition-transform"><ChatBubbleIcon className="w-6 h-6" /></button><button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-[var(--text-base)]"><MenuIcon className="w-7 h-7" /></button></div>
        </header>

        <div className={`flex-1 overflow-y-auto px-6 md:px-10 pb-32 no-scrollbar transition-all duration-500 ${isIdleView ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              
              {/* HEADER BANNER WITH VISUALIZER */}
              {selectedCategory && viewMode !== 'favorites' && (
                <div className="mb-10 p-10 h-56 rounded-[2.5rem] glass-panel relative overflow-hidden flex flex-col justify-end animate-in fade-in zoom-in duration-700">
                    <div className={`absolute inset-0 bg-gradient-to-r ${selectedCategory.color} opacity-20 mix-blend-overlay`}></div>
                    <div className="absolute inset-x-0 bottom-0 top-0 z-0 opacity-40">
                      <AudioVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} variant={visualizerVariant} settings={vizSettings} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-[5]"></div>
                    <div className="relative z-10 pointer-events-none">
                        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase">{getLocalizedCategoryName(selectedCategory)}</h2>
                        <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-60 mt-2">{stations.length} STATIONS AVAILABLE</p>
                    </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-[1.2] rounded-[2rem] skeleton-loader"></div>) : (
                  <>
                    {visibleStations.map((station, index) => (
                      <StationCard 
                        key={station.stationuuid}
                        station={station}
                        index={index}
                        isSelected={currentStation?.stationuuid === station.stationuuid}
                        isFavorite={favorites.includes(station.stationuuid)}
                        onPlay={handlePlayStation}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </>
                )}
              </div>

              {!isLoading && stations.length > visibleCount && (
                <div className="mt-12 flex justify-center pb-10">
                  <button 
                    onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, stations.length))}
                    className="flex items-center gap-3 px-12 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 hover:border-primary/50 transition-all shadow-2xl active:scale-95"
                  >
                    <PlusIcon className="w-5 h-5" /> {language === 'ru' ? 'Загрузить еще' : language === 'ky' ? 'Дагы жүктөө' : language === 'kk' ? 'Тағы жүктеу' : 'Load More Stations'}
                  </button>
                </div>
              )}
        </div>

        {isIdleView && (
           <div className="fixed inset-0 z-0 animate-in fade-in duration-1000 bg-black">
              <div className="absolute inset-0 w-full h-full"><AudioVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} variant={visualizerVariant} settings={vizSettings} /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none"></div>
              <button onClick={() => setIsIdleView(false)} className="absolute top-10 right-10 z-50 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white"><XMarkIcon className="w-8 h-8" /></button>
           </div>
        )}

        <div className={`absolute bottom-8 left-0 right-0 px-4 md:px-10 pointer-events-none transition-all duration-700 ease-in-out z-20 ${chatOpen ? 'md:pr-[420px] lg:pr-[470px]' : ''} ${isIdleView ? 'bottom-12' : ''}`}>
           <div className={`pointer-events-auto max-w-5xl mx-auto rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl border-2 border-[var(--panel-border)] transition-all duration-500 ${isIdleView ? 'scale-110 bg-black/90 backdrop-blur-3xl' : 'bg-[var(--player-bar-bg)]'}`}>
               <div className="flex items-center gap-4 flex-1 min-w-0 z-10"><DancingAvatar isPlaying={isPlaying && !isBuffering} className="w-12 h-12" /><div className="min-w-0"><h4 className="font-black text-sm md:text-base truncate">{currentStation?.name || 'Radio Stream'}</h4><p className="text-[10px] text-primary font-black uppercase tracking-widest">{isBuffering ? 'Buffering...' : 'LIVE'}</p></div></div>
               <div className="flex items-center gap-3 md:gap-6 z-10 mx-4">
                  <button onClick={handlePreviousStation} className="p-2 text-slate-400 hover:text-white transition-colors"><PreviousIcon className="w-6 h-6" /></button>
                  <button onClick={togglePlay} className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white text-black shadow-xl hover:scale-105 active:scale-95 transition-all">{isBuffering ? <LoadingIcon className="animate-spin w-6 h-6" /> : isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}</button>
                  <button onClick={handleNextStation} className="p-2 text-slate-400 hover:text-white transition-colors"><NextIcon className="w-6 h-6" /></button>
               </div>
               <div className="flex-1 flex justify-end items-center gap-2 md:gap-5 z-10">
                  <button onClick={() => setIsIdleView(true)} className={`p-2.5 text-[var(--text-base)] hover:text-primary transition-colors ${isIdleView ? 'hidden' : ''}`}><MaximizeIcon className="w-6 h-6" /></button>
                  <button onClick={() => setToolsOpen(!toolsOpen)} className={`p-2.5 text-[var(--text-base)] hover:text-primary transition-colors ${isIdleView ? 'hidden' : ''}`}><AdjustmentsIcon className="w-6 h-6" /></button>
                  <div className="hidden md:flex items-center gap-3"><VolumeIcon className="w-5 h-5 text-slate-400" /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 accent-primary cursor-pointer h-1.5 bg-slate-400/30 rounded-full" /></div>
               </div>
           </div>
        </div>

        <ToolsPanel 
          isOpen={toolsOpen} onClose={() => setToolsOpen(false)} 
          eqGains={eqGains} setEqGain={(i, v) => { const n = [...eqGains]; n[i] = v; setEqGains(n); }} 
          sleepTimer={sleepTimer} setSleepTimer={setSleepTimer} 
          currentTheme={currentTheme} setTheme={setCurrentTheme} 
          baseTheme={baseTheme} setBaseTheme={setBaseTheme} 
          language={language} setLanguage={setLanguage} 
          visualizerVariant={visualizerVariant} setVisualizerVariant={setVisualizerVariant} 
          vizSettings={vizSettings} setVizSettings={setVizSettings}
          onStartTutorial={() => { setToolsOpen(false); setTutorialOpen(true); }} 
          onOpenManual={() => { setToolsOpen(false); setManualOpen(true); }} 
        />

        <ManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} language={language} />
        <TutorialOverlay isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} language={language} />
      </main>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} language={language} currentUser={currentUser} onUpdateCurrentUser={setCurrentUser} />
    </div>
  );
}
