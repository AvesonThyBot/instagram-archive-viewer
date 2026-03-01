/**
 * Main application controller using generic user labeling for better reusability.
 */
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Phone, Video, Camera, Mic, Image as ImageIcon } from 'lucide-react';
import MessageBubble from './components/MessageBubble';
import SettingsOverlay from './components/SettingsOverlay';

function App() {
  // Perspective now tracks the ID of the user currently "holding the phone"
  const [currentUserId, setCurrentUserId] = useState('user_1');
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('REELS');

  // Generic data structure for broader compatibility
  const chatData = [
    { id: 1, senderId: "user_2", text: "Hey! How's the project coming along?" },
    { id: 2, senderId: "user_2", text: "Need any help with the UI?" },
    { id: 3, senderId: "user_1", text: "Going great, just refactoring the message logic." },
    { id: 4, senderId: "user_1", text: "Almost ready for a public repo." },
    { id: 5, senderId: "user_2", text: "Awesome, let me know when it's live." },
  ];

  // Map user IDs to generic profile data
  const users = {
    user_1: { name: 'Sender', handle: 'sender_handle', pfp: null },
    user_2: { name: 'Receiver', handle: 'receiver_handle', pfp: null }
  };

  const otherUserId = currentUserId === 'user_1' ? 'user_2' : 'user_1';
  const otherUser = users[otherUserId];

  // Cluster messages by sender for group rendering
  const groupedMessages = useMemo(() => {
    return chatData.reduce((acc, msg, i) => {
      if (i > 0 && chatData[i - 1].senderId === msg.senderId) {
        acc[acc.length - 1].messages.push(msg);
      } else {
        acc.push({ senderId: msg.senderId, messages: [msg] });
      }
      return acc;
    }, []);
  }, [chatData]);

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      <div className="flex flex-col h-full w-full bg-[#0f0000]">
        
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/80 backdrop-blur-lg z-10 cursor-pointer" onClick={() => setShowInfo(true)}>
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6" />
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
               {otherUser.pfp ? <img src={otherUser.pfp} className="w-full h-full object-cover" /> : <div className="text-[10px] font-bold text-zinc-500">PFP</div>}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[14px] flex items-center gap-1 leading-tight">{otherUser.name} <ChevronRight className="w-3 h-3 opacity-40" /></span>
              <span className="text-[10px] text-zinc-500">@{otherUser.handle}</span>
            </div>
          </div>
          <div className="flex gap-5 items-center pr-1"><Phone className="w-5 h-5" /><Video className="w-6 h-6" /></div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#1a0000] to-black flex flex-col">
           {groupedMessages.map((group, groupIdx) => (
             <div key={groupIdx} className="flex flex-col mb-4">
               {group.messages.map((msg, msgIdx) => {
                 const isSender = currentUserId === msg.senderId;
                 const isLastInGroup = msgIdx === group.messages.length - 1;

                 return (
                   <MessageBubble 
                     key={msg.id}
                     content={msg.text} 
                     isSender={isSender}
                     senderId={group.senderId}
                     showAvatar={!isSender && isLastInGroup}
                     pfp={users[group.senderId].pfp}
                   />
                 );
               })}
             </div>
           ))}
        </div>

        <div className="p-3 bg-black border-t border-zinc-900 flex items-center gap-3 pb-8">
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center"><Camera className="w-5 h-5 text-white" /></div>
          <div className="flex-1 border border-zinc-800 rounded-full px-4 py-2 bg-zinc-900/40 text-zinc-500 text-[14px]">Message...</div>
          <Mic className="w-6 h-6 text-zinc-400" /><ImageIcon className="w-6 h-6 text-zinc-400" />
        </div>
      </div>

      <SettingsOverlay 
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        recipient={otherUser}
        perspective={currentUserId}
        setPerspective={setCurrentUserId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}

export default App;