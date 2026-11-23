import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Brand({ light = false }) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="Pagemint home">
    <span className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></span>
    <span>page<span className="brand-mint">mint</span></span>
  </Link>;
}
