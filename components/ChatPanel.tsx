
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    XMarkIcon, PaperAirplaneIcon, UsersIcon, 
    MicrophoneIcon, FaceSmileIcon, PaperClipIcon, 
    PlayIcon, PauseIcon, CameraIcon, SearchIcon, NoSymbolIcon
} from './Icons';
import { ChatMessage, UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserProfile;
  onUpdateCurrentUser: (user: UserProfile) => void;
}

const EMOJIS = [
    '😊', '😂', '❤️', '🔥', '✨', '👍', '🎵', '📻', '🎧', '😎', 
    '🤩', '😮', '🥺', '😭', '🤯', '🙏', '💯', '🚀', '⭐', '🌈',
    '🍕', '🍺', '💃', '🕺', '🎉', '🎁', '👋', '💋', '😈', '🔞',
    '🥵', '🥶', '🤔', '👀', '🤫', '🤝', '💪', '🦁', '🛸', '💎'
];

interface Participant {
  name: string;
  login: string;
  avatar: string;
  age: number;
  country: string;
  city: string;
  isSimulated?: boolean;
}

const MOCK_POOL: Participant[] = [
  { name: 'CyberPunk', login: 'cyber_p', avatar: 'https://i.pravatar.cc/100?u=1', age: 24, country: 'USA', city: 'San Francisco' },
  { name: 'GrooveMaster', login: 'groove_m', avatar: 'https://i.pravatar.cc/100?u=2', age: 31, country: 'UK', city: 'London' },
  { name: 'MelodyHunter', login: 'melody_h', avatar: 'https://i.pravatar.cc/100?u=3', age: 19, country: 'France', city: 'Paris' },
  { name: 'BassHead', login: 'bass_h', avatar: 'https://i.pravatar.cc/100?u=4', age: 27, country: 'Germany', city: 'Berlin' },
  { name: 'SynthWave', login: 'synth_w', avatar: 'https://i.pravatar.cc/100?u=5', age: 22, country: 'Canada', city: 'Toronto' },
  { name: 'TechnoQueen', login: 'techno_q', avatar: 'https://i.pravatar.cc/100?u=6', age: 29, country: 'Spain', city: 'Madrid' },
  { name: 'ChillVibes', login: 'chill_v', avatar: 'https://i.pravatar.cc/100?u=7', age: 21, country: 'Kazakhstan', city: 'Almaty' },
  { name: 'RadioStar', login: 'radio_s', avatar: 'https://i.pravatar.cc/100?u=8', age: 35, country: 'Russia', city: 'Moscow' },
  { name: 'NightDrive', login: 'night_d', avatar: 'https://i.pravatar.cc/100?u=9', age: 26, country: 'Italy', city: 'Rome' },
  { name: 'ElectricSoul', login: 'elec_s', avatar: 'https://i.pravatar.cc/100?u=10', age: 23, country: 'Japan', city: 'Tokyo' },
  { name: 'BeatMaker', login: 'beat_m', avatar: 'https://i.pravatar.cc/100?u=11', age: 30, country: 'Brazil', city: 'Rio' },
  { name: 'SonicWave', login: 'sonic_w', avatar: 'https://i.pravatar.cc/100?u=12', age: 20, country: 'Australia', city: 'Sydney' },
  { name: 'NeonLight', login: 'neon_l', avatar: 'https://i.pravatar.cc/100?u=13', age: 28, country: 'Russia', city: 'Kazan' },
  { name: 'DeepHouse', login: 'deep_h', avatar: 'https://i.pravatar.cc/100?u=14', age: 33, country: 'Kazakhstan', city: 'Astana' },
  { name: 'JazzLover', login: 'jazz_l', avatar: 'https://i.pravatar.cc/100?u=15', age: 40, country: 'France', city: 'Lyon' },
  { name: 'IberianDJ', login: 'iber_dj', avatar: 'https://i.pravatar.cc/100?u=16', age: 25, country: 'Spain', city: 'Barcelona' },
  { name: 'Nomad', login: 'nomad_k', avatar: 'https://i.pravatar.cc/100?u=17', age: 28, country: 'Kyrgyzstan', city: 'Bishkek' },
];

const isEmojiOnly = (text: string) => {
  if (!text) return false;
  const nonEmojiRegex = /[a-zA-Z0-9\u0400-\u04FF]/; 
  const isPure = !nonEmojiRegex.test(text);
  const charCount = [...text.trim()].length;
  return isPure && charCount > 0 && charCount <= 3;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ 
    isOpen, onClose, language, 
    currentUser, onUpdateCurrentUser
}) => {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys-init', senderId: 'system', text: language === 'ru' ? '🌍 Глобальный чат StreamFlow активен!' : '🌍 Global Hub is Active!', timestamp: new Date(Date.now() - 3600000), read: true }
  ]);

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ query: '', age: '', location: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [listenersCount, setListenersCount] = useState(1394);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [onlineParticipants, setOnlineParticipants] = useState<Participant[]>([]);
  const [activePartner, setActivePartner] = useState<Participant | null>(null);
  const [blockedLogins, setBlockedLogins] = useState<string[]>([]);
  
  const hasSentWelcomeRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(scrollToBottom, 100);
  }, [messages, isOpen, scrollToBottom, activePartner]);

  // Initial Join
  useEffect(() => {
    if (!hasSentWelcomeRef.current && currentUser.name) {
      setOnlineParticipants([{ 
        name: currentUser.name, login: currentUser.name.toLowerCase(), 
        avatar: currentUser.avatar || `https://i.pravatar.cc/100?u=me`,
        age: currentUser.age, country: currentUser.country, city: currentUser.city
      }]);
      hasSentWelcomeRef.current = true;
    }
  }, [currentUser.name]);

  // Presence Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setListenersCount(p => p + (Math.random() > 0.5 ? 8 : -3));
      if (!showSearch && Math.random() > 0.7) {
        const mock = MOCK_POOL[Math.floor(Math.random() * MOCK_POOL.length)];
        
        // Use functional update to check existence, removing dependency on 'onlineParticipants'
        setOnlineParticipants(prev => {
            const alreadyOnline = prev.some(p => p.login === mock.login);
            if (!alreadyOnline) {
                return [mock, ...prev].slice(0, 15);
            } else {
                return prev.filter(p => p.login !== mock.login);
            }
        });
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [showSearch]); // Fixed: removed onlineParticipants from dependency array

  // Search/Filters
  const filteredParticipants = showSearch 
    ? MOCK_POOL.filter(p => {
        const q = searchFilters.query.toLowerCase();
        const loc = searchFilters.location.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q) || p.login.toLowerCase().includes(q);
        const matchAge = searchFilters.age ? p.age.toString() === searchFilters.age : true;
        const matchLoc = p.country.toLowerCase().includes(loc) || p.city.toLowerCase().includes(loc);
        return matchName && matchAge && matchLoc;
      })
    : onlineParticipants;

  const handleInvite = (p: Participant) => {
    if (p.login === currentUser.name.toLowerCase()) return;
    
    // Check if blocked
    if (blockedLogins.includes(p.login)) {
        alert(language === 'ru' ? "Этот пользователь заблокирован." : "This user is blocked.");
        return;
    }

    setActivePartner(p);
    
    // Simulated agreement
    setMessages(prev => [...prev, {
      id: 'invite-' + Date.now(),
      senderId: 'system',
      text: language === 'ru' 
        ? `Вы начали диалог с @${p.name}. Приветствуйте собеседника!`
        : `You started a dialog with @${p.name}. Say hi!`,
      timestamp: new Date(),
      read: true
    }]);
  };

  const toggleBlock = (login: string) => {
    if (!login) return;
    setBlockedLogins(prev => {
        if (prev.includes(login)) {
            return prev.filter(l => l !== login);
        } else {
            return [...prev, login];
        }
    });
    // If we block the current partner, exit chat
    if (activePartner?.login === login) {
        setActivePartner(null);
    }
  };

  const startRecording = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
        mediaRecorder.onstop = () => {
            if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => sendMessage(undefined, undefined, reader.result as string);
            }
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setRecordingTime(0);
        };
        mediaRecorder.start(200);
        setIsRecording(true);
        recordingIntervalRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) {}
  };

  const stopRecording = (e: React.PointerEvent) => {
    e.preventDefault();
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const sendMessage = (text?: string, image?: string, audio?: string) => {
    if (!text && !image && !audio) return;
    const newMessage: ChatMessage & { recipientId?: string } = {
        id: Date.now().toString(),
        senderId: 'me',
        text, image, audioBase64: audio,
        timestamp: new Date(),
        read: true,
        isUserMessage: true,
        recipientId: activePartner?.login
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const visibleMessages = messages.filter(m => {
      // System messages are global
      if (m.senderId === 'system') return !activePartner;
      // In private chat, only show messages related to current partner
      if (activePartner) {
          return (m as any).recipientId === activePartner.login || (m.senderId === activePartner.login);
      }
      // In global hub, only show global messages (no recipientId)
      return !(m as any).recipientId;
  });

  if (!isOpen) return null;

  return (
    <aside className="w-full md:w-[450px] lg:w-[480px] flex flex-col glass-panel border-l border-[var(--panel-border)] shadow-2xl animate-in slide-in-from-right duration-500 bg-[var(--panel-bg)] z-50">
        <header className="h-20 flex items-center px-6 border-b border-[var(--panel-border)] bg-black/10 shrink-0">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {activePartner ? (
                        <button onClick={() => setActivePartner(null)} className="p-1 -ml-1 text-primary hover:text-white transition-colors">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <UsersIcon className="w-5 h-5 text-primary" />
                    )}
                    <h3 className="font-black text-lg tracking-tight">
                        {activePartner ? `@${activePartner.name}` : 'Global Hub'}
                    </h3>
                </div>
                {!activePartner && (
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {listenersCount} {language === 'ru' ? 'СЛУШАТЕЛЕЙ' : 'LISTENERS'}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => { setShowSearch(!showSearch); setActivePartner(null); }} 
                    className={`p-2 rounded-full transition-all border ${showSearch ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-slate-400'}`}
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full border border-white/5">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </header>

        {showSearch && !activePartner && (
            <div className="p-4 bg-black/20 border-b border-[var(--panel-border)] animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="text" 
                        placeholder={language === 'ru' ? "Логин / Имя" : "Login / Name"}
                        value={searchFilters.query}
                        onChange={e => setSearchFilters(prev => ({...prev, query: e.target.value}))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-white"
                    />
                    <input 
                        type="number" 
                        placeholder={language === 'ru' ? "Возраст" : "Age"}
                        value={searchFilters.age}
                        onChange={e => setSearchFilters(prev => ({...prev, age: e.target.value}))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-white"
                    />
                    <input 
                        type="text" 
                        placeholder={language === 'ru' ? "Страна / Город" : "Country / City"}
                        value={searchFilters.location}
                        onChange={e => setSearchFilters(prev => ({...prev, location: e.target.value}))}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-white"
                    />
                </div>
            </div>
        )}

        <div className="flex-1 overflow-hidden relative flex">
            {/* Participant Sidebar (Only in Global/Search view) */}
            {!activePartner && (
                <div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col items-center py-4 gap-3 z-20 pointer-events-none overflow-y-auto no-scrollbar">
                    {filteredParticipants.map((p, idx) => (
                        <div key={p.login + idx} className="relative group animate-in zoom-in fade-in duration-500 pointer-events-auto">
                            <button 
                                onClick={() => handleInvite(p)}
                                className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${p.name === currentUser.name ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/5 bg-slate-800'}`}
                            >
                                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            </button>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1e293b] rounded-full"></div>
                            <div className="absolute left-full ml-3 px-2 py-1 bg-black/90 text-[9px] font-black text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] border border-white/10 flex flex-col gap-0.5 shadow-2xl">
                                <span className="text-primary">@{p.login}</span>
                                <span>{p.name}, {p.age}</span>
                                <span className="opacity-60">{p.city}, {p.country}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Chat Feed */}
            <div className={`flex-1 overflow-y-auto pr-6 py-6 space-y-5 no-scrollbar bg-black/5 flex flex-col relative z-10 transition-all ${!activePartner ? 'pl-16' : 'pl-6'}`}>
                {visibleMessages.length === 0 && activePartner && (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-10">
                        <UsersIcon className="w-16 h-16 mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">{language === 'ru' ? 'Начните общение' : 'Start conversation'}</p>
                    </div>
                )}
                {visibleMessages.map((msg) => {
                    const isEmoji = msg.text ? isEmojiOnly(msg.text) : false;
                    const isTransparent = (!!msg.image && !msg.text && !msg.audioBase64) || (isEmoji && !msg.image && !msg.audioBase64);

                    return (
                        <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                            {msg.senderId === 'system' ? (
                                <div className="w-full flex justify-center my-1">
                                    <span className="px-4 py-1.5 rounded-full bg-black/30 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] border border-white/5 text-center leading-tight">{msg.text}</span>
                                </div>
                            ) : (
                                <div className={`relative max-w-[95%] p-4 rounded-3xl transition-all duration-300 ${
                                    isTransparent 
                                        ? 'bg-transparent border-transparent shadow-none' 
                                        : `shadow-xl border ${msg.senderId === 'me' ? 'bg-primary text-white border-primary/50 rounded-tr-none' : 'glass-card border-[var(--panel-border)] text-[var(--text-base)] rounded-tl-none'}`
                                }`}>
                                    {msg.text && (
                                    <p className={`font-black leading-relaxed break-words transition-all duration-300 ${isEmojiOnly(msg.text) ? 'text-6xl py-3 drop-shadow-xl' : 'text-sm'}`}>
                                        {msg.text}
                                    </p>
                                    )}
                                    {msg.image && <img src={msg.image} className={`rounded-xl w-full max-h-64 object-cover ${msg.text ? 'mt-2 border border-white/10' : ''}`} />}
                                    {msg.audioBase64 && (
                                        <div className="flex items-center gap-3 py-1 min-w-[180px]">
                                            <button 
                                                onClick={() => {
                                                    if (playingAudioId === msg.id) { currentAudioRef.current?.pause(); setPlayingAudioId(null); }
                                                    else { if (currentAudioRef.current) currentAudioRef.current.pause(); const a = new Audio(msg.audioBase64!); currentAudioRef.current = a; a.onended = () => setPlayingAudioId(null); a.play(); setPlayingAudioId(msg.id); }
                                                }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${msg.senderId === 'me' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/20 hover:bg-primary/30 text-primary'}`}
                                            >
                                                {playingAudioId === msg.id ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                            </button>
                                            <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                <div className={`h-full bg-current transition-all duration-300 ${playingAudioId === msg.id ? 'bg-white/60 animate-shimmer w-full' : 'bg-white/30 w-1/3'}`}></div>
                                            </div>
                                            <span className="text-[9px] font-black uppercase opacity-60">VOICE</span>
                                        </div>
                                    )}
                                    <div className={`flex justify-end items-center gap-1.5 mt-2 transition-opacity ${isTransparent ? 'opacity-30' : 'opacity-50'}`}>
                                        <span className="text-[9px] font-bold uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {msg.senderId === 'me' && <span className="text-xs">✓✓</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>

        <div className="p-4 bg-[var(--player-bar-bg)] border-t border-[var(--panel-border)] relative shrink-0">
            {isRecording && (
                <div className="absolute top-0 left-0 right-0 -translate-y-full p-3 bg-red-600/95 backdrop-blur-xl flex items-center justify-between animate-in slide-in-from-bottom-2 border-t border-red-400/20">
                   <div className="flex items-center gap-3 px-4">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">{language === 'ru' ? 'ЗАПИСЬ...' : 'RECORDING...'} {recordingTime}s</span>
                   </div>
                   <button onPointerUp={stopRecording} className="px-5 py-2 bg-white/30 rounded-full text-[10px] font-black text-white uppercase hover:bg-white/40 active:scale-95 transition-all backdrop-blur-md">{language === 'ru' ? 'Отправить' : 'Send'}</button>
                </div>
            )}

            {showEmojiPicker && (
                <div className="absolute bottom-24 left-4 right-4 glass-panel p-6 rounded-[3rem] grid grid-cols-6 gap-3 z-50 animate-in slide-in-from-bottom-2 border-primary/40 shadow-2xl">
                    {EMOJIS.map(e => (
                        <button key={e} onClick={() => { setInputText(p => p + e); setShowEmojiPicker(false); }} className="text-3xl hover:scale-150 transition-transform p-2 hover:bg-white/5 rounded-2xl flex items-center justify-center">{e}</button>
                    ))}
                </div>
            )}
            
            <div className="flex items-center gap-2 mb-3 px-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 text-slate-400 hover:text-primary transition-all rounded-2xl border border-white/10"><PaperClipIcon className="w-6 h-6" /></button>
                <button onClick={() => cameraInputRef.current?.click()} className="p-3 bg-white/5 text-slate-400 hover:text-primary transition-all rounded-2xl border border-white/10"><CameraIcon className="w-6 h-6" /></button>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 transition-all rounded-2xl border ${showEmojiPicker ? 'bg-primary/20 text-primary border-primary' : 'bg-white/5 text-slate-400 border-white/10'}`}><FaceSmileIcon className="w-6 h-6" /></button>
                {activePartner && (
                    <button 
                        onClick={() => toggleBlock(activePartner.login)}
                        className={`p-3 transition-all rounded-2xl border ${blockedLogins.includes(activePartner.login) ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-white/5 text-slate-400 border-white/10 hover:border-red-500/50'}`}
                    >
                        <NoSymbolIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center bg-[var(--input-bg)] rounded-[2rem] px-1 border border-[var(--input-border)] focus-within:border-primary transition-all">
                    <textarea 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder={activePartner ? (language === 'ru' ? 'Сообщение...' : 'Message...') : (language === 'ru' ? "Напишите миру..." : "Say something...")}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none py-4 px-5 text-sm text-[var(--text-base)] font-bold resize-none max-h-32 placeholder:opacity-50"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
                    />
                </div>

                {inputText.trim() ? (
                    <button onClick={() => sendMessage(inputText)} className="w-14 h-14 bg-primary text-white rounded-[1.5rem] hover:scale-105 active:scale-90 shadow-lg flex items-center justify-center transition-all"><PaperAirplaneIcon className="w-7 h-7" /></button>
                ) : (
                    <button 
                        onPointerDown={startRecording} 
                        onPointerUp={stopRecording} 
                        onPointerLeave={isRecording ? stopRecording : undefined}
                        className={`w-14 h-14 transition-all rounded-[1.5rem] shadow-lg flex items-center justify-center touch-none ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary text-white shadow-secondary/20'}`}
                    >
                        <MicrophoneIcon className="w-7 h-7" />
                    </button>
                )}
            </div>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) { const reader = new FileReader(); reader.onload = () => sendMessage(undefined, reader.result as string); reader.readAsDataURL(file); }
        }} />
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) { const reader = new FileReader(); reader.onload = () => sendMessage(undefined, reader.result as string); reader.readAsDataURL(file); }
        }} />
    </aside>
  );
};

export default ChatPanel;

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
    );
}
