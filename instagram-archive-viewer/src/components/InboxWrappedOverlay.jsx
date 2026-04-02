import ActionPanelOverlay from './ActionPanelOverlay';

// Placeholder wrapped panel so the inbox action can evolve into a full DM summary later on.
const InboxWrappedOverlay = ({ isOpen, onClose }) => (
  <ActionPanelOverlay
    isOpen={isOpen}
    onClose={onClose}
    title="Wrapped"
    description="This is ready for your DM wrapped summary view."
  >
    <div className="space-y-3">
      {[
        'Top people you message most',
        'Most active days and time ranges',
        'Media, reels, and favourite-message stats',
      ].map((item) => (
        <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/78">
          {item}
        </div>
      ))}
    </div>
  </ActionPanelOverlay>
);

export default InboxWrappedOverlay;
