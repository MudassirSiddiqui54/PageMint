import { useState } from 'react';
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function AccountSettings({ onMessage }) {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const deleteAccount = async () => {
    const confirmed = window.confirm('Permanently delete your Pagemint account, profile, birthday pages and associated ImageKit images? This cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    try { await api.delete('/auth/account'); await logout(); window.location.assign('/'); }
    catch (error) { onMessage(apiError(error)); setBusy(false); }
  };
  return <div className="editor-stack"><div className="panel-heading"><div><span className="panel-eyebrow">ACCOUNT / SETTINGS</span><h1>Account settings</h1><p>Manage your sign-in details and account lifecycle.</p></div></div><div className="editor-card"><div className="editor-card-heading"><div><h2>Account details</h2><p>Your login identity. Your username cannot be changed here.</p></div></div><div className="account-detail-row"><span>Username</span><b>@{user.username}</b></div><div className="account-detail-row"><span>Email address</span><b>{user.email}</b></div><div className="account-detail-row"><span>Account created</span><b>{new Date(user.createdAt).toLocaleDateString()}</b></div></div><div className="editor-card danger-zone"><div className="editor-card-heading"><div><h2><AlertTriangle size={18}/> Danger zone</h2><p>These actions permanently affect your account.</p></div></div><p>Deleting your account removes your public profile, products, birthday pages and refresh sessions. ImageKit deletion requests are queued and retried by the backend worker if the provider is temporarily unavailable.</p><button className="button button-danger" disabled={busy} onClick={deleteAccount}><Trash2 size={15}/>{busy ? 'Deleting…' : 'Permanently delete account'}</button></div></div>;
}
