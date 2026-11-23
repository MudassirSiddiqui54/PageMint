import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
export default function NotFound() { return <main className="not-found"><Sparkles size={32}/><div className="eyebrow">A LITTLE DETOUR</div><h1>This page wandered off.</h1><p>We couldn't find the page you were looking for.</p><Link to="/" className="button button-dark"><ArrowLeft size={16}/> Back home</Link></main>; }
