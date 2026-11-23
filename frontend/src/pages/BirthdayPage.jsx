import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Heart, Send } from 'lucide-react';
import { api } from '../lib/api';
import BirthdayCanvas from '../components/studio/BirthdayCanvas';
import '../components/studio/studio.css';

const partyColours = ['#f4a7bc', '#f8d26c', '#9caddf', '#a8d8c0', '#d9b5ec', '#f39c74'];

export default function BirthdayPage() {
  const { alias } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [wishError, setWishError] = useState('');
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setPage(null); setError('');
    api.get(`/public/birthday/${encodeURIComponent(alias)}`)
      .then(({ data }) => { if (active) setPage(data.page); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'This birthday page is unavailable.'); });
    return () => { active = false; };
  }, [alias]);

  const launchConfetti = () => {
    const effects = page?.appearance?.effects || ['confetti'];
    if (effects.includes('confetti')) {
      confetti({ particleCount: 150, spread: 95, startVelocity: 38, origin: { y: 0.62 }, colors: partyColours });
      window.setTimeout(() => confetti({ particleCount: 65, spread: 125, startVelocity: 25, origin: { x: 0.12, y: 0.72 }, colors: partyColours }), 260);
    }
    if (effects.includes('fireworks')) {
      [0.22, 0.5, 0.78].forEach((x, index) => window.setTimeout(() => confetti({ particleCount: 48, spread: 360, startVelocity: 28, gravity: 0.65, scalar: 0.9, origin: { x, y: 0.38 }, colors: partyColours }), index * 260));
    }
  };

  useEffect(() => {
    if (!page) return undefined;
    const effects = page.appearance?.effects || ['confetti'];
    if (!effects.includes('confetti') && !effects.includes('fireworks')) return undefined;
    const first = window.setTimeout(launchConfetti, 700);
    let fireworks;
    if (effects.includes('fireworks')) {
      let bursts = 0;
      fireworks = window.setInterval(() => {
        if (bursts >= 3) { window.clearInterval(fireworks); return; }
        bursts += 1;
        confetti({ particleCount: 36, spread: 360, startVelocity: 30, gravity: 0.8, scalar: 0.85, origin: { x: [0.2, 0.5, 0.8][bursts - 1], y: 0.42 }, colors: partyColours });
      }, 2200);
    }
    return () => { window.clearTimeout(first); if (fireworks) window.clearInterval(fireworks); };
  // The effect is intentionally keyed to the fetched birthday page, so it runs once per page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?._id]);

  const submitWish = async (event) => {
    event.preventDefault();
    if (message.trim().length < 2) return;
    setWishError(''); setWishBusy(true);
    try {
      const { data } = await api.post(`/public/birthday/${encodeURIComponent(alias)}/wishes`, { name: name.trim() || 'A friend', message: message.trim() });
      setPage((current) => ({ ...current, wishes: [...(current.wishes || []), data.wish] }));
      setName(''); setMessage(''); setSent(true);
    } catch (requestError) { setWishError(requestError.response?.data?.message || 'Your wish could not be sent. Please try again.'); }
    finally { setWishBusy(false); }
  };

  if (error) return <div className="public-state"><h1>Page not found</h1><p>{error}</p><a href="/" className="button button-dark">Go to Pagemint</a></div>;
  if (!page) return <div className="route-loading"><div className="loader"/>Preparing a little surprise…</div>;

  const wishContent = <section className="pm-bday-wish-form">
    {sent ? <div className="pm-bday-wish-success"><Heart size={17}/> Your wish has joined the celebration. Thank you!</div> : <form onSubmit={submitWish}>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name (optional)" maxLength={80}/>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write something lovely…" maxLength={500} required rows={3}/>
      {wishError && <span className="form-error">{wishError}</span>}
      <button className="pm-bday-wish-submit" disabled={wishBusy}><Send size={15}/>{wishBusy ? 'Sending…' : 'Send a birthday wish'}</button>
    </form>}
  </section>;
  return <div className="pm-bday-public-wrap"><BirthdayCanvas page={page} onCelebrate={launchConfetti} wishContent={wishContent}/></div>;
}
