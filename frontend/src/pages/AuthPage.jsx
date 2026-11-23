import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { Brand } from '../components/Brand';
import { useAuth } from '../lib/AuthContext';
import { apiError } from '../lib/api';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace/>;
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register({ ...form, displayName: form.displayName.trim() || undefined });
      else await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) { setError(apiError(err)); }
    finally { setBusy(false); }
  };

  return <div className="auth-page">
    <div className="auth-left"><div className="auth-top"><Brand/><Link to="/" className="back-home"><ArrowLeft size={15}/> Back to home</Link></div>
      <div className="auth-main"><div className="auth-eyebrow"><Sparkles size={15}/> YOUR LITTLE CORNER OF THE INTERNET</div><h1>{isRegister ? <>Let's make a<br/><em>little magic.</em></> : <>Good to have<br/><em>you back.</em></>}</h1><p>{isRegister ? 'Your links, projects, products and favourite things. All in one place, just the way you like it.' : 'Your page is right where you left it. Pick up where you paused.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <>
            <label>Username <span>This becomes your default page address</span></label>
            <div className="input-wrap"><UserRound size={17}/><input name="username" value={form.username} onChange={change} placeholder="yourname" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required autoComplete="username"/></div>
            <small className="field-hint">pagemint.page/u/{form.username.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'yourname'}</small>
            <label>Display name <span>What people will see</span></label>
            <div className="input-wrap"><UserRound size={17}/><input name="displayName" value={form.displayName} onChange={change} placeholder="Your name" maxLength={60}/></div>
          </>}
          <label>Email address</label><div className="input-wrap"><Mail size={17}/><input type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required autoComplete="email"/></div>
          <label>Password</label><div className="input-wrap"><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={change} placeholder="At least 8 characters" minLength={8} maxLength={72} required autoComplete={isRegister ? 'new-password' : 'current-password'}/><button type="button" className="icon-button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create my account' : 'Log in'} <ArrowRight size={17}/></button>
        </form>
        <div className="auth-switch">{isRegister ? 'Already have an account?' : 'New around here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></div>
        <div className="auth-security"><LockKeyhole size={14}/> Your session is protected with secure, rotating tokens.</div>
      </div>
      <div className="auth-bottom"><span>© Pagemint</span><span>Make room for all of you. ✳</span></div>
    </div>
    <div className="auth-right"><div className="auth-demo-tag">YOUR PAGE, YOUR WAY <span>✳</span></div><div className="auth-preview-card"><div className="auth-preview-bg"/><div className="auth-preview-avatar">A</div><span className="auth-preview-hello">HELLO, I'M</span><h2>Alex Morgan</h2><p>Designer & forever curious human ✿</p><div className="auth-preview-socials"><i>◎</i><i>in</i><i>↗</i><i>♪</i></div>{['My creative portfolio','Things I’m making','Find me on Instagram','A little newsletter'].map((text, i) => <div className="auth-preview-link" key={text}><span>{['✳','▤','◎','✉'][i]}</span>{text}<ArrowRight size={14}/></div>)}<div className="auth-preview-bottom">MADE WITH PAGEMINT ✳</div></div><div className="auth-floating auth-float-one"><Sparkles size={15}/> 40+ ways to customise</div><div className="auth-floating auth-float-two">✿ A page as unique as you</div></div>
  </div>;
}
