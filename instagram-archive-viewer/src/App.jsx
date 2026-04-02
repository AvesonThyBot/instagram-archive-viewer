import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Inbox from './webpages/inbox';

function App() {
  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      {/* Keep routing minimal so the inbox shell can own both the sidebar and chat layout. */}
      <Routes>
        <Route path="/" element={<Inbox />} />
        <Route path="/chat/:threadId" element={<Inbox />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
