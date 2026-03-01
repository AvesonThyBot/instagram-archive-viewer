import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import ChatPage from './webpages/index';

function App() {
  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      <Routes>
        {/* Main Chat Route */}
        <Route path="/" element={<ChatPage />} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;