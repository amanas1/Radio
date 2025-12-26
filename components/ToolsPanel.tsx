
import React, { useState, useRef } from 'react';
import { AdjustmentsIcon, PaletteIcon, MoonIcon, XMarkIcon, ClockIcon, PlayIcon, MusicNoteIcon } from './Icons';
import { ThemeName, Language, BaseTheme, VisualizerVariant, VisualizerSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  eqGains: number[];
  setEqGain: (index: number, value: number) => void;
  sleepTimer: number | null;
  setSleepTimer: (minutes: number | null) => void;
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  baseTheme: BaseTheme;
  setBaseTheme: (base: BaseTheme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  visualizerVariant: VisualizerVariant;
  setVisualizerVariant: (v: VisualizerVariant) => void;
  vizSettings: VisualizerSettings;
  setVizSettings: React.Dispatch<React.SetStateAction<VisualizerSettings>>;
  onStartTutorial: () => void;
  onOpenManual: () => void;
}

const THEMES: { id: ThemeName; name: string; color: string; label: string }[] = [
  { id: 'default', name: 'Amethyst', color: 'bg-gradient-to-br from-violet-600 to-pink-500', label: 'DEFAULT' },
  { id: 'emerald', name: 'Emerald', color: 'bg-gradient-to-br from-emerald-500 to-blue-600', label: 'MAGIC' },
  { id: 'midnight', name: 'Midnight', color: 'bg-gradient-to-br from-indigo-600 to-purple-800', label: 'DEEP' },
  { id: 'cyber', name: 'Cyberpunk', color: 'bg-gradient-to-br from-fuchsia-500 to-cyan-400', label: 'NEON' },
  { id: 'volcano', name: 'Volcano', color: 'bg-gradient-to-br from-rose-500 to-amber-500', label: 'HEAT' },
  { id: 'ocean', name: 'Ocean', color: 'bg-gradient-to-br from-sky-500 to-teal-500', label: 'BREEZE' },
  { id: 'sakura', name: 'Sakura', color: 'bg-gradient-to-br from-pink-400 to-rose-700', label: 'SOFT' },
  { id: 'gold', name: 'Luxury', color: 'bg-gradient-to-br from-yellow-500 to-amber-700', label: 'GOLD' },
  { id: 'frost', name: 'Frost', color: 'bg-gradient-to-br from-cyan-300 to-blue-500', label: 'ICE' },
  { id: 'forest', name: 'Forest', color: 'bg-gradient-to-br from-lime-500 to-stone-700', label: 'NATURE' },
];

const VIZ_OPTIONS: { id: VisualizerVariant; labelKey: string; color: string }[] = [
    { id: 'galaxy', labelKey: 'vizGalaxy', color: 'from-blue-900 to-purple-900' },
    { id: 'mixed-rings', labelKey: 'vizRings', color: 'from-cyan-500 to-fuchsia-500' },
    { id: 'bubbles', labelKey: 'vizBubbles', color: 'from-teal-400 to-blue-400' },
    { id: 'rainbow-lines', labelKey: 'vizLines', color: 'from-red-500 via-green-500 to-blue-500' },
    { id: 'segmented', labelKey: 'vizBars', color: 'from-slate-700 to-slate-900' },
    { id: 'stage-dancer', labelKey: 'vizDancer', color: 'from-orange-500 to-yellow-500' },
    { id: 'trio-dancers', labelKey: 'vizTrio', color: 'from-emerald-500 to-teal-600' },
    { id: 'viz-journey', labelKey: 'vizJourney', color: 'from-indigo-900 via-slate-900 to-black' },
];

const FREQUENCIES = ['60Hz', '250Hz', '1kHz', '4kHz', '12kHz'];

const VerticalSlider: React.FC<{ value: number; onChange: (val: number) => void; label: string }> = ({ value, onChange, label }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        let percentage = (rect.bottom - e.clientY) / rect.height;
        percentage = Math.max(0, Math.min(1, percentage));
        onChange(Math.round((percentage * 20) - 10));
    };
    const fillPercent = ((value + 10) / 20) * 100;
    return (
        <div className="flex flex-col items-center gap-2 h-full w-full group select-none touch-none">
            <div ref={trackRef} className="relative flex-1 w-6 bg-slate-400/20 rounded-full overflow-hidden cursor-pointer" onPointerDown={handlePointerMove} onPointerMove={(e) => e.buttons === 1 && handlePointerMove(e)}>
                <div className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-75" style={{ height: `${fillPercent}%` }}></div>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">{label}</span>
        </div>
    );
};

const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  isOpen, onClose, eqGains, setEqGain, sleepTimer, setSleepTimer, 
  currentTheme, setTheme, baseTheme, setBaseTheme, language, setLanguage,
  visualizerVariant, setVisualizerVariant, vizSettings, setVizSettings,
  onStartTutorial, onOpenManual
}) => {
  const [activeTab, setActiveTab] = useState<'eq' | 'theme' | 'viz' | 'sleep' | 'help'>('eq');
  const t = TRANSLATIONS[language];

  const updateViz = (key: keyof VisualizerSettings, val: any) => {
    setVizSettings(prev => ({ ...prev, [key]: val }));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 bottom-28 md:bottom-24 z-50 px-4 md:px-10 pointer-events-none flex justify-center">
      <div className="pointer-events-auto w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
        
        <div className="flex items-center justify-between p-1 bg-black/5">
            <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('eq')} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'eq' ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400 hover:text-[var(--text-base)]'}`}><AdjustmentsIcon className="w-4 h-4" /> {t.eq}</button>
                <button onClick={() => setActiveTab('viz')} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'viz' ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400 hover:text-[var(--text-base)]'}`}><MusicNoteIcon className="w-4 h-4" /> {t.visualizer}</button>
                <button onClick={() => setActiveTab('theme')} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'theme' ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400 hover:text-[var(--text-base)]'}`}><PaletteIcon className="w-4 h-4" /> {t.look}</button>
                <button onClick={() => setActiveTab('sleep')} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'sleep' ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400 hover:text-[var(--text-base)]'}`}><MoonIcon className="w-4 h-4" /> {t.sleep}</button>
                <button onClick={() => setActiveTab('help')} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'help' ? 'bg-[var(--selected-item-bg)] text-[var(--text-base)]' : 'text-slate-400 hover:text-[var(--text-base)]'}`}><ClockIcon className="w-4 h-4 rotate-180" /> {t.help}</button>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-[var(--text-base)] ml-2"><XMarkIcon className="w-5 h-5" /></button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto no-scrollbar">
            {activeTab === 'eq' && (
                <div className="space-y-4">
                    <h3 className="text-[var(--text-base)] font-black uppercase tracking-widest text-xs opacity-60">5-Band Equalizer</h3>
                    <div className="flex justify-between gap-3 h-40 pb-2 relative">
                        {eqGains.map((gain, i) => (
                            <VerticalSlider key={i} value={gain} onChange={(val) => setEqGain(i, val)} label={FREQUENCIES[i]} />
                        ))}
                    </div>
                    <div className="flex justify-center"><button onClick={() => { [0,0,0,0,0].forEach((v, i) => setEqGain(i, v)) }} className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-[var(--text-base)] transition-colors">{t.resetFlat}</button></div>
                </div>
            )}

            {activeTab === 'viz' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[var(--text-base)] font-black uppercase tracking-widest text-xs opacity-60 mb-3">{t.visualizer}</h3>
                        <div className="grid grid-cols-8 gap-2">
                            {VIZ_OPTIONS.map(opt => (
                                <button key={opt.id} onClick={() => setVisualizerVariant(opt.id)} className={`flex items-center justify-center p-2 rounded-xl border-2 transition-all ${visualizerVariant === opt.id ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${opt.color}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Advanced Tuning</h4>
                          <div className="flex gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Auto Idle</span>
                                <button onClick={() => updateViz('autoIdle', !vizSettings.autoIdle)} className={`w-10 h-5 rounded-full transition-all relative ${vizSettings.autoIdle ? 'bg-primary' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${vizSettings.autoIdle ? 'left-6' : 'left-1'}`}></div></button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase">FPS++</span>
                                <button onClick={() => updateViz('performanceMode', !vizSettings.performanceMode)} className={`w-10 h-5 rounded-full transition-all relative ${vizSettings.performanceMode ? 'bg-emerald-500' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${vizSettings.performanceMode ? 'left-6' : 'left-1'}`}></div></button>
                              </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                            <VizSlider label="Speed / Reactivity" min={0.1} max={3.0} step={0.1} value={vizSettings.speed} onChange={(v) => updateViz('speed', v)} />
                            <VizSlider label="Scale Width (X)" min={0.5} max={2.0} step={0.1} value={vizSettings.scaleX} onChange={(v) => updateViz('scaleX', v)} />
                            <VizSlider label="Scale Height (Y)" min={0.5} max={2.0} step={0.1} value={vizSettings.scaleY} onChange={(v) => updateViz('scaleY', v)} />
                            {(visualizerVariant === 'stage-dancer' || visualizerVariant === 'trio-dancers') && (
                              <>
                                <div className="border-t border-white/5 pt-3 mt-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-3">Dance Controls</h4>
                                  <VizSlider label="Arm Movement" min={0} max={2.0} step={0.1} value={vizSettings.danceArmIntensity ?? 1.0} onChange={(v) => updateViz('danceArmIntensity', v)} />
                                  <VizSlider label="Leg Movement" min={0} max={2.0} step={0.1} value={vizSettings.danceLegIntensity ?? 1.0} onChange={(v) => updateViz('danceLegIntensity', v)} />
                                  <VizSlider label="Head Movement" min={0} max={2.0} step={0.1} value={vizSettings.danceHeadIntensity ?? 1.0} onChange={(v) => updateViz('danceHeadIntensity', v)} />
                                </div>
                              </>
                            )}
                            <VizSlider label="Brightness" min={0} max={200} step={1} value={vizSettings.brightness} onChange={(v) => updateViz('brightness', v)} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'theme' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[var(--text-base)] font-black uppercase tracking-widest text-xs mb-3 opacity-60">{t.appAppearance}</h3>
                        <div className="flex bg-[var(--input-bg)] rounded-xl p-1 mb-5 border border-[var(--panel-border)]">
                            <button onClick={() => setBaseTheme('light')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${baseTheme === 'light' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Light</button>
                            <button onClick={() => setBaseTheme('dark')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${baseTheme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>Dark</button>
                        </div>
                        <div className="grid grid-cols-5 gap-3 p-1">
                            {THEMES.map(theme => (
                                <button key={theme.id} onClick={() => setTheme(theme.id)} className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${currentTheme === theme.id ? 'border-primary bg-primary/10' : 'border-transparent'}`}>
                                    <div className={`w-8 h-8 rounded-full ${theme.color}`}></div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-8">
                            <h3 className="text-[var(--text-base)] font-black uppercase tracking-widest text-xs mb-3 opacity-60">{t.language}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {(['en', 'ru', 'kk', 'ky'] as Language[]).map(lang => (
                                    <button 
                                      key={lang} 
                                      onClick={() => setLanguage(lang)} 
                                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${language === lang ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                    >
                                        {lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : lang === 'kk' ? 'Қазақша' : 'Кыргызча'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sleep' && (
              <div className="space-y-6">
                <h3 className="text-[var(--text-base)] font-black uppercase tracking-widest text-xs opacity-60">{t.sleepTimer}</h3>
                {sleepTimer !== null && sleepTimer > 0 ? (
                  <div className="bg-primary/10 border border-primary/30 p-8 rounded-[2rem] text-center">
                    <span className="text-4xl font-black text-primary animate-pulse">{sleepTimer}</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mt-2">minutes left</p>
                    <button onClick={() => setSleepTimer(null)} className="mt-8 w-full py-3 bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/30 hover:bg-red-500/30 transition-all">{t.turnOffTimer}</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[15, 30, 45, 60].map(mins => (
                      <button key={mins} onClick={() => setSleepTimer(mins)} className="py-6 rounded-[1.5rem] bg-white/5 border border-white/10 text-[var(--text-base)] hover:bg-white/10 hover:border-primary transition-all flex flex-col items-center justify-center gap-2">
                        <span className="text-xl font-black">{mins}</span>
                        <span className="text-[9px] font-bold uppercase opacity-40">minutes</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-4">
                <h3 className="text-[var(--text-base)] font-black uppercase tracking-widest text-xs opacity-60">{t.help}</h3>
                <button onClick={onOpenManual} className="w-full p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 hover:border-primary transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><MusicNoteIcon className="w-6 h-6" /></div>
                  <div className="text-left"><h4 className="font-bold text-white group-hover:text-primary">{t.manualTitle}</h4><p className="text-xs text-slate-500">Read the rules and user manual</p></div>
                </button>
                <button onClick={onStartTutorial} className="w-full p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 hover:border-primary transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary"><PlayIcon className="w-6 h-6 ml-1" /></div>
                  <div className="text-left"><h4 className="font-bold text-white group-hover:text-secondary">{t.startTutorial}</h4><p className="text-xs text-slate-500">Learn how to use the application</p></div>
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const VizSlider: React.FC<{ label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }> = ({ label, min, max, step, value, onChange }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>{label}</span>
            <span>{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer" />
    </div>
);

export default ToolsPanel;
