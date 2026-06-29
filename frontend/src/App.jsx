import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Onboarding  from './components/pages/Onboarding'
import Home        from './components/pages/Home'
import MovieDetail from './components/pages/MovieDetail'
import TasteProfile from './components/pages/TasteProfile'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Onboarding />} />
        <Route path="/home"      element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/profile"   element={<TasteProfile />} />
      </Routes>
    </>
  )
}
