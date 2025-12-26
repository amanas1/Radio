
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { XMarkIcon, MusicNoteIcon, UsersIcon, AdjustmentsIcon, PaletteIcon, PlayIcon } from './Icons';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose, language }) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const sections = [
    { icon: <MusicNoteIcon className="w-5 h-5 text-pink-500" />, content: t.manualSection1 },
    { icon: <PlayIcon className="w-5 h-5 text-blue-500" />, content: t.manualSection2 },
    { icon: <AdjustmentsIcon className="w-5 h-5 text-emerald-500" />, content: t.manualSection3 },
    { icon: <UsersIcon className="w-5 h-5 text-purple-500" />, content: t.manualSection4 },
    { icon: <PaletteIcon className="w-5 h-5 text-amber-500" />, content: t.manualSection5 },
  ];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl glass-panel rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-3xl font-extrabold text-white">{t.manualTitle}</h2>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                  <XMarkIcon className="w-6 h-6 text-white" />
              </button>
          </div>
          
          <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar space-y-8">
              <p className="text-slate-400 text-lg leading-relaxed">{t.manualIntro}</p>
              
              <div className="grid gap-6">
                  {sections.map((s, i) => (
                      <div key={i} className="flex gap-5 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                          <div className="w-12 h-12 shrink-0 rounded-2xl bg-black/40 flex items-center justify-center shadow-inner">
                              {s.icon}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed pt-1">{s.content}</p>
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="p-8 border-t border-white/5 bg-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">© 2025 StreamFlow Radio Engine</p>
          </div>
      </div>
    </div>
  );
};

export default ManualModal;
