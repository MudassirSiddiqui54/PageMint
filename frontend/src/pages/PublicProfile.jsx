import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import PageCanvas from '../components/studio/PageCanvas';
import '../components/studio/studio.css';

export default function PublicProfile() {
  const { alias } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get(`/public/profiles/${encodeURIComponent(alias)}`)
      .then(({ data }) => { if (active) setProfile(data.profile); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'This page could not be found.'); });
    return () => { active = false; };
  }, [alias]);
  if (error) return <div className="public-state"><h1>Page not found</h1><p>{error}</p><a href="/" className="button button-dark">Go to Pagemint</a></div>;
  if (!profile) return <div className="route-loading"><div className="loader"/>Loading page…</div>;
  return <PageCanvas profile={profile}/>;
}
