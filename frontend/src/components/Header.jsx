import { Link } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { Brand } from './Brand';
import { useAuth } from '../lib/AuthContext';

export default function Header() {
  const { user } = useAuth();
  return <header className="site-header wrap">
    <Brand />
    <nav className="header-nav">
      <a href="#features">Features</a>
      <a href="#birthday">Birthday pages</a>
      {user ? <Link className="button button-dark button-small" to="/dashboard">Dashboard <LayoutDashboard size={15}/></Link> : <>
        <Link className="nav-login" to="/login">Log in</Link>
        <Link className="button button-dark button-small" to="/register">Get started <ArrowUpRight size={15}/></Link>
      </>}
    </nav>
  </header>;
}
