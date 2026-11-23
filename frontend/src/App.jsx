import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PublicProfile from './pages/PublicProfile';
import BirthdayPage from './pages/BirthdayPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard/*" element={<Dashboard />} />
    </Route>
    <Route path="/u/:alias" element={<PublicProfile />} />
    <Route path="/bday/:alias" element={<BirthdayPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
