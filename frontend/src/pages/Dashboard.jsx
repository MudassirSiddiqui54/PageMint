import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Cake, ChevronRight, ExternalLink, LogOut, QrCode, UserRound } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { api, apiError } from '../lib/api';
import { Brand } from '../components/Brand';
import VisualPageStudio from '../components/studio/VisualPageStudio';
import BirthdayStudio from '../components/BirthdayStudio';
import QRSettings from '../components/QRSettings';
import AccountSettings from '../components/AccountSettings';

const sections = [
  { id: 'profile', label: 'Page studio', group: 'YOUR PAGE', icon: UserRound },
  { id: 'birthday', label: 'Birthday pages', group: 'CREATE', icon: Cake },
  { id: 'qr', label: 'QR designer', group: 'CREATE', icon: QrCode },
  { id: 'account', label: 'Account settings', group: 'ACCOUNT', icon: UserRound }
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [birthdayPages, setBirthdayPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/profile/me'), api.get('/birthday-pages')])
      .then(([profileResponse, birthdayResponse]) => {
        if (!active) return;
        setProfile(profileResponse.data.profile);
        setBirthdayPages(birthdayResponse.data.pages);
      })
      .catch((error) => { if (active) setLoadError(apiError(error, 'Could not load your workspace. Check that the backend is running on port 3000.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const notify = (message) => setToast(message);
  const signOut = async () => { await logout(); navigate('/'); };

  if (loading) return <div className="route-loading"><div className="loader"/><span>Opening your studio…</span></div>;
  if (loadError) return <div className="dashboard-error"><Brand/><div className="error-card"><h1>We couldn't load your workspace.</h1><p>{loadError}</p><button className="button button-dark" onClick={() => window.location.reload()}>Try again</button><button className="button button-soft" onClick={signOut}>Sign out</button></div></div>;
  if (!profile) return null;
  const activeSection = sections.find((item) => item.id === section);

  return <div className="dashboard-layout">
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand"><Brand light/></div>
      <div className="sidebar-user"><div className="sidebar-avatar">{profile.avatar?.url ? <img src={profile.avatar.url} alt=""/> : (profile.displayName || user.username).slice(0,1).toUpperCase()}</div><div><b>{profile.displayName || user.username}</b><span>@{user.username}</span></div><ChevronRight size={15}/></div>
      {['YOUR PAGE','CREATE','ACCOUNT'].map((group) => <div className="sidebar-group" key={group}><span className="sidebar-label">{group}</span>{sections.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setSection(item.id)} className={`sidebar-link ${section === item.id ? 'sidebar-link-active' : ''}`} title={item.label}><Icon size={17}/>{item.label}{section === item.id && <i/>}</button>; })}</div>)}
      <div className="sidebar-bottom"><a href={`/u/${profile.alias}`} target="_blank" rel="noreferrer" className="sidebar-public-link"><ExternalLink size={15}/> Open public page</a><button className="sidebar-logout" onClick={signOut}><LogOut size={16}/> Sign out</button><div className="sidebar-version">PAGEMINT STUDIO <span>✳</span></div></div>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{activeSection.label}</b></div><div className="topbar-actions"><a href={`/u/${profile.alias}`} target="_blank" rel="noreferrer" className="topbar-page-link"><span className="online-dot"/> Your page <ArrowUpRight size={14}/></a><div className="topbar-avatar">{(profile.displayName || user.username).slice(0,1).toUpperCase()}</div></div></header>
      <div className={`dashboard-content ${section === 'profile' ? 'dashboard-content-studio' : ''}`}>
        {section === 'profile' && <VisualPageStudio profile={profile} user={user} onProfile={setProfile} onMessage={notify}/>}
        {section === 'birthday' && <BirthdayStudio pages={birthdayPages} onPages={setBirthdayPages} onMessage={notify} user={user}/>}
        {section === 'qr' && <QRSettings profile={profile} user={user} onProfile={setProfile} onMessage={notify}/>}
        {section === 'account' && <AccountSettings onMessage={notify}/>}
      </div>
      {toast && <div className="toast-message">{toast}</div>}
    </main>
  </div>;
}

export default Dashboard;
