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
  setActiveTab 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center p-4 border-b border-zinc-900 bg-black">
        <button onClick={onClose} className="mr-6">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <span className="font-bold text-lg">Details</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center pt-10 pb-6">
          <div className="w-24 h-24 rounded-full bg-zinc-800 mb-4 border border-zinc-700 flex items-center justify-center overflow-hidden">
            {recipient.pfp ? (
              <img src={recipient.pfp} className="w-full h-full object-cover" alt="" />
            ) : (
              <User className="w-12 h-12 text-zinc-600" />
            )}
          </div>
          <h2 className="font-bold text-xl tracking-tight">{recipient.name}</h2>
          <p className="text-zinc-500 text-sm mt-1">@{recipient.handle}</p>
          
          <div className="flex gap-6 mt-8">
            {[
              { icon: <User />, label: 'Profile' }, 
              { icon: <Search />, label: 'Search' }, 
              { icon: <Bell />, label: 'Mute' }, 
              { icon: <MoreHorizontal />, label: 'Options' }
            ].map((btn) => (
              <div key={btn.label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center active:bg-zinc-900 transition-colors">
                  {React.cloneElement(btn.icon, { className: "w-5 h-5" })}
                </div>
                <span className="text-[11px] text-zinc-300 font-medium">{btn.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-6 border-t border-zinc-900">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[13px] font-bold">View Perspective</span>
             <span className="text-[10px] text-zinc-500 font-black uppercase">
               {perspective === 'user_1' ? 'User 1' : 'User 2'}
             </span>
          </div>
          <div className="flex bg-[#121212] rounded-xl p-1 border border-zinc-800">
              <button 
                onClick={() => setPerspective('user_1')} 
                className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${perspective === 'user_1' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 opacity-50'}`}
              >
                USER 1
              </button>
              <button 
                onClick={() => setPerspective('user_2')} 
                className={`flex-1 py-2.5 text-[11px] font-black rounded-lg transition-all ${perspective === 'user_2' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 opacity-50'}`}
              >
                USER 2
              </button>
          </div>
        </div>

        <div className="flex border-b border-zinc-900 px-4">
          {['MEDIA', 'REELS', 'LINKS'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[11px] font-bold tracking-[0.1em] relative ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-0.5 p-0.5 pb-20">
           {[...Array(9)].map((_, i) => (
             <div key={i} className="aspect-square bg-zinc-900 flex items-center justify-center border border-black/10">
                <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-tighter opacity-40">{activeTab} {i+1}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsOverlay;