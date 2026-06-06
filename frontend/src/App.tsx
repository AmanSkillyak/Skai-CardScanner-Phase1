import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ScanCard from './pages/ScanCard';
import Records  from './pages/Records';

function Navbar() {
  const base = 'px-4 py-2 rounded-lg text-sm font-medium transition';
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-blue-600 text-lg">🪪 Skai CardScanner</span>
        <div className="flex gap-2">
          <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Scan</NavLink>
          <NavLink to="/records" className={({ isActive }) => `${base} ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Records</NavLink>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"        element={<ScanCard />} />
          <Route path="/records" element={<Records />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
