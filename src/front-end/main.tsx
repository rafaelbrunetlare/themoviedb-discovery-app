import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import App from './App.tsx';
import Footer from './components/Footer.tsx';
import NavBar from './components/NavBar.tsx';
import MovieDetailPage from './pages/MovieDetailPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import './global.css';
import AboutPage from './pages/AboutPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  </StrictMode>,
);
