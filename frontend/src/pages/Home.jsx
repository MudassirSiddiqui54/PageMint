import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Heart, Layers, Link2, Palette, QrCode, Sparkles } from 'lucide-react';
import Header from '../components/Header';

const sampleLinks = [
  ['Instagram', 'instagram.com/yourname', '◎'],
  ['My portfolio', 'yourname.design', '↗'],
  ['YouTube', 'youtube.com/@yourname', '▶']
];

export default function Home() {
  return <div className="home-page">
    <Header />
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> YOUR WORLD, ONE PAGE</div>
          <h1>Everything you are.<br/><em>One beautiful</em> place.</h1>
          <p className="hero-subtitle">A little home for all your links, work, products and moments. Make it yours, down to the last detail.</p>
          <div className="hero-actions"><Link to="/register" className="button button-dark">Create your page <ArrowUpRight size={17}/></Link><a href="#features" className="text-link">Explore Pagemint <ArrowRight size={16}/></a></div>
          <div className="hero-proof"><div className="avatar-stack"><span>M</span><span>J</span><span>A</span><span>+</span></div><span>Made for creators, makers & everyone in between</span></div>
        </div>
        <div className="hero-visual">
          <div className="float-note note-top"><Sparkles size={15}/> Your little corner</div>
          <div className="profile-card mock-profile">
            <div className="mock-cover"/>
            <div className="mock-avatar">M</div>
            <div className="mock-name">Maya Chen</div>
            <div className="mock-bio">Designer, daydreamer & collector of small joys ✿</div>
            <div className="mock-socials"><span>◎</span><span>in</span><span>↗</span></div>
            {sampleLinks.map(([label, url, icon]) => <div className="mock-link" key={label}><span className="mock-link-icon">{icon}</span><span><b>{label}</b><small>{url}</small></span><ArrowUpRight size={15}/></div>)}
            <div className="mock-product"><div className="product-art"><span>✳</span></div><div><small>THE LITTLE SHOP</small><b>Sunday Studio Prints</b><span>From $12.00</span></div><ArrowUpRight size={17}/></div>
            <div className="mock-footer">made with <b>pagemint</b> ✳</div>
          </div>
          <div className="float-note note-bottom"><Palette size={15}/> 40+ ways to make it yours</div>
          <span className="hero-spark spark-one">✳</span><span className="hero-spark spark-two">✦</span>
        </div>
      </section>

      <section className="marquee-band"><div className="marquee-inner">LINKS THAT FEEL LIKE YOU <span>✳</span> YOUR OWN LITTLE WEBSITE <span>✳</span> MADE FOR YOUR MOMENTS <span>✳</span> LINKS THAT FEEL LIKE YOU <span>✳</span></div></section>

      <section className="section wrap" id="features">
        <div className="section-heading"><div className="eyebrow">MORE THAN A LINK IN BIO</div><h2>One page. A hundred ways<br/>to make it <em>yours.</em></h2><p>Not another boring list of links. A flexible, expressive space that grows with everything you're building.</p></div>
        <div className="feature-grid">
          <article className="feature-card feature-large"><div className="feature-icon"><Link2/></div><span className="feature-kicker">01 / YOUR LINKS</span><h3>All your places,<br/>beautifully connected.</h3><p>Bring socials, portfolios, videos and all the places people can find you into one tidy home.</p><div className="mini-link-stack">{['◎  Instagram','in  LinkedIn','↗  Your portfolio'].map((item) => <div key={item}>{item}<ArrowUpRight size={14}/></div>)}</div></article>
          <article className="feature-card feature-color"><div className="feature-icon"><Palette/></div><span className="feature-kicker">02 / YOUR STYLE</span><h3>Make it feel<br/>like you.</h3><p>Play with backgrounds, typography, layouts, stickers and tiny details until it clicks.</p><div className="swatch-row"><i/><i/><i/><i/><i/><i/></div></article>
          <article className="feature-card"><div className="feature-icon"><Layers/></div><span className="feature-kicker">03 / YOUR THINGS</span><h3>Show what<br/>you're making.</h3><p>Give your products and projects a little spotlight with images, prices and links.</p><div className="feature-product"><div>✿</div><span><b>Studio collection</b><small>Made with care</small></span><ArrowUpRight size={15}/></div></article>
          <article className="feature-card feature-qr"><div className="feature-icon"><QrCode/></div><span className="feature-kicker">04 / TAKE IT ANYWHERE</span><h3>A QR code that's<br/>actually yours.</h3><p>Make a QR code that matches your page, then pop it on cards, packaging or anywhere.</p><div className="qr-preview"><div className="qr-grid">{Array.from({ length: 49 }, (_, i) => <i key={i} className={(i * 7 + i * i) % 5 < 2 ? 'on' : ''}/>)}</div><span>SCAN ME ✳</span></div></article>
        </div>
      </section>

      <section className="birthday-section" id="birthday"><div className="birthday-inner wrap"><div className="birthday-copy"><div className="eyebrow"><Heart size={14}/> A LITTLE SOMETHING EXTRA</div><h2>Make someone's<br/>day feel <em>like magic.</em></h2><p>Create a birthday page for someone you love. Fill it with photos, memories, messages and a few happy surprises. Send them one link. Make their whole day.</p><Link to="/register" className="button button-light">Make a birthday page <ArrowUpRight size={17}/></Link></div><div className="birthday-art"><div className="birthday-confetti">✳　✦　✧　✿</div><div className="birthday-note"><div className="birthday-note-top">A LITTLE PAGE FOR</div><div className="birthday-cake">🎂</div><h3>It's your day,<br/><em>Amelia!</em></h3><p>Here's to your next trip around the sun ♡</p><div className="birthday-pill">MADE WITH LOVE ✳</div></div><span className="birthday-float float-heart">♡</span><span className="birthday-float float-star">✦</span></div></div></section>

      <section className="closing-cta wrap"><div><div className="eyebrow">YOUR PAGE IS WAITING</div><h2>Let's make something<br/><em>that feels like you.</em></h2></div><Link className="button button-dark" to="/register">Start creating <ArrowUpRight size={17}/></Link></section>
    </main>
    <footer className="site-footer wrap"><div><span className="footer-brand">pagemint ✳</span><span>Made for your many sides.</span></div><span>© {new Date().getFullYear()} Pagemint</span><div><Link to="/login">Log in</Link><Link to="/register">Create a page</Link></div></footer>
  </div>;
}
