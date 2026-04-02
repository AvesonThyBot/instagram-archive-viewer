import ActionPanelOverlay from './ActionPanelOverlay';

// Placeholder export panel so the inbox actions feel like real screens even before export logic lands.
const InboxExportOverlay = ({ isOpen, onClose }) => (
  <ActionPanelOverlay
    isOpen={isOpen}
    onClose={onClose}
    title="Export"
    description="Exports will be added here without leaving the inbox."
  >
    <div className="space-y-3">
      {[
        'Export the current inbox index as JSON',
        'Export a conversation summary for sharing',
        'Future CSV and analytics export options',
      ].map((item) => (
        <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/78">
          {item}
        </div>
      ))}
    </div>
  </ActionPanelOverlay>
);

export default InboxExportOverlay;
