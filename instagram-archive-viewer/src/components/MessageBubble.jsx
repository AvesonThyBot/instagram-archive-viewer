/**
 * Renders a standard message bubble with alignment based on user identity.
 */
const MessageBubble = ({ content, isSender, senderId, showAvatar, pfp }) => {
  // Generic theme colors for a public project
  const bubbleColor = isSender ? 'bg-[#dc3221]' : 'bg-[#510000]';

  return (
    <div className={`flex w-full ${isSender ? 'justify-end' : 'justify-start'} items-end gap-2 px-2 mb-[2px]`}>
      {!isSender && (
        <div className="w-8 h-8 flex-shrink-0">
          {showAvatar ? (
            <div className="w-full h-full rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
               {pfp ? <img src={pfp} className="w-full h-full object-cover" /> : <div className="text-[8px] text-zinc-500">PFP</div>}
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}
      <div className="flex flex-col max-w-[75%] md:max-w-[60%]">
        <div className={`px-4 py-2 text-[15px] leading-[1.3] text-white rounded-[18px] ${bubbleColor}`}>
          {content}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;