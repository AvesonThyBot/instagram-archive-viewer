/**
 * Renders the user profile details and configuration options in a full-screen overlay.
 * Replaces specific user identities with generic "Receiver" and "Sender" labels for public distribution.
 */
import React from 'react';
import { ChevronLeft, User, Search, Bell, MoreHorizontal } from 'lucide-react';

const SettingsOverlay = ({ 
  isOpen, 
  onClose, 
  recipient, 
  perspective, 
  setPerspective, 
  activeTab, 
  setActiveTab,
  theme,
  setTheme,
  themes = [],
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-end justify-center md:items-center md:p-6">
        <div className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-black shadow-2xl md:h-auto md:max-h-[92vh] md:w-[min(92vw,1080px)] md:rounded-3xl">
          <div className="flex items-center border-b border-zinc-900 bg-black p-4">
            <button onClick={onClose} className="mr-4 rounded-full border border-white/10 bg-white/5 p-2">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-bold">Details</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center px-6 pb-6 pt-8">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                {recipient.pfp ? (
                  <img src={recipient.pfp} className="h-full w-full object-cover" alt="" />
                ) : (
                  <User className="h-12 w-12 text-zinc-600" />
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight">{recipient.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{recipient.handle ? `@${recipient.handle}` : 'Instagram conversation'}</p>
              
              <div className="mt-8 grid w-full max-w-[320px] grid-cols-4 gap-4">
                {[
                  { icon: <User />, label: 'Profile' }, 
                  { icon: <Search />, label: 'Search' }, 
                  { icon: <Bell />, label: 'Mute' }, 
                  { icon: <MoreHorizontal />, label: 'Options' }
                ].map((btn) => (
                  <div key={btn.label} className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 transition-colors active:bg-zinc-900">
                      {React.cloneElement(btn.icon, { className: "w-5 h-5" })}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300">{btn.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-900 px-5 py-6">
              <div className="mb-4 flex items-center justify-between">
                 <span className="text-[13px] font-bold">View Perspective</span>
                 <span className="text-[10px] font-black uppercase text-zinc-500">
                   {perspective === 'owner' ? 'Your side' : 'Their side'}
                 </span>
              </div>
              <div className="flex rounded-xl border border-zinc-800 bg-[#121212] p-1">
                  <button 
                    onClick={() => setPerspective('owner')} 
                    className={`flex-1 rounded-lg py-2.5 text-[11px] font-black transition-all ${perspective === 'owner' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 opacity-50'}`}
                  >
                    YOUR SIDE
                  </button>
                  <button 
                    onClick={() => setPerspective('other')} 
                    className={`flex-1 rounded-lg py-2.5 text-[11px] font-black transition-all ${perspective === 'other' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 opacity-50'}`}
                  >
                    THEIR SIDE
                  </button>
                </div>
              </div>

            <div className="border-t border-zinc-900 px-5 py-6">
              <div className="mb-4 flex items-center justify-between">
                 <span className="text-[13px] font-bold">Chat Theme</span>
                 <span className="text-[10px] font-black uppercase text-zinc-500">
                   {themes.find((option) => option.id === theme)?.label || 'Custom'}
                 </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  { id: 'sunset', swatch: 'from-[#2a0000] via-[#511010] to-[#ff5a2f]' },
                  { id: 'classic', swatch: 'from-[#111111] via-[#1d1d1f] to-[#303030]' },
                  { id: 'ocean', swatch: 'from-[#051937] via-[#003f5c] to-[#2f80ed]' },
                  { id: 'monochrome', swatch: 'from-[#050505] via-[#1f1f1f] to-[#8a8a8a]' },
                  { id: 'aurora', swatch: 'from-[#180d29] via-[#4b1d6b] to-[#ff5ca8]' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      theme === option.id ? 'border-white/40 bg-white/8' : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <div className={`h-16 rounded-xl bg-gradient-to-br ${option.swatch}`} />
                    <div className="mt-2 text-xs font-semibold text-white">
                      {themes.find((themeOption) => themeOption.id === option.id)?.label || option.id}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex border-b border-zinc-900 px-4">
              {['MEDIA', 'REELS', 'LINKS'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex-1 py-4 text-[11px] font-bold tracking-[0.1em] ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-white" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-0.5 p-0.5 pb-20">
               {[...Array(9)].map((_, i) => (
                 <div key={i} className="flex aspect-square items-center justify-center border border-black/10 bg-zinc-900">
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-zinc-700 opacity-40">{activeTab} {i+1}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsOverlay;
