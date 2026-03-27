import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Inbox from './webpages/inbox';
import Test from './webpages/test';

function App() {
  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      <Routes>
        <Route path="/" element={<Inbox />} />
        <Route path="/chat/:threadId" element={<Inbox />} />
        <Route path="/test" element={<Test />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
