import '@lynx-js/preact-devtools'
import '@lynx-js/react/debug'
import { root } from '@lynx-js/react';
import { MemoryRouter, Routes, Route } from 'react-router';

import { App } from './App.jsx';
import Home from './pages/Home.jsx';
import LiveSessionDashboard from './pages/LiveSessionDashboard.tsx';
import ProjectedPaymentPage from './pages/ProjectedPayment.tsx';
import TransparencyExplorer from './pages/TransparencyExplorer.tsx';

root.render(
  <MemoryRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/home" element={<Home />} />
      <Route path="/live/:id" element={<LiveSessionDashboard />} />
      <Route path="/projected-payment/:id" element={<ProjectedPaymentPage />} />
      <Route path="/transparency" element={<TransparencyExplorer />} />
    </Routes>
  </MemoryRouter>
);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
