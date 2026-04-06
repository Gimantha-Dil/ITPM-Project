import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { value: '500+', label: 'Notes Uploaded' },
  { value: '200+', label: 'Kuppi Sessions' },
  { value: '1,200+', label: 'SLIIT Students' },
  { value: '4.8★', label: 'Average Rating' },
];

const FEATURES = [
  { title: 'Notes Marketplace', desc: 'Buy and sell quality study notes from fellow SLIIT students. Filter by subject, category, and rating.' },
  { title: 'Kuppi Sessions', desc: 'Join or host peer tutoring sessions. Free and paid options with MS Teams integration.' },
  { title: 'Secure Payments', desc: 'Upload payment slips, get seller-verified. Automated PDF receipts sent to your SLIIT email.' },
  { title: 'Ratings & Reviews', desc: 'Rate notes and sessions after purchase. Find the best content through community feedback.' },
  { title: 'Bookmarks', desc: 'Save notes and sessions to buy later. All your purchases managed in one place.' },
  { title: 'AI Helper', desc: 'Get instant answers in Sinhala or English using the built-in AI chatbot.' },
];

const STEPS = [
  { num: '01', title: 'Register', desc: 'Sign up with your @my.sliit.lk email and verify via OTP.' },
  { num: '02', title: 'Browse', desc: 'Search notes and Kuppi sessions by subject or category.' },
  { num: '03', title: 'Purchase', desc: 'Upload your bank payment slip and await seller verification.' },
  { num: '04', title: 'Access', desc: 'Download notes or join sessions after payment is confirmed.' },
];

const CATEGORIES = ['IT', 'SE', 'CS', 'DS', 'Business', 'Engineering', 'Other'];

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const C = { primary: '#63e5ff', deep: '#0ab5d6', dark: '#0a4a57', light: '#e0faff', soft: '#b1f2ff' };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: C.dark, overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(99,229,255,0.2)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="logo" style={{ height: 40, width: 40, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: C.dark }}>
            SLIIT <span style={{ color: C.deep }}>Learning</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 28 }}>
          {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Categories', 'categories']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: C.dark, fontFamily: 'inherit', padding: 0 }}
              onMouseEnter={e => e.target.style.color = C.deep}
              onMouseLeave={e => e.target.style.color = C.dark}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ padding: '9px 22px', borderRadius: 10, border: `2px solid ${C.primary}`, color: C.dark, fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.light}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Login</Link>
          <Link to="/register" style={{ padding: '9px 22px', borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.deep})`, color: C.dark, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,229,255,0.45)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >Register Free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.light} 0%, ${C.soft} 40%, #f0fdff 100%)`, display: 'flex', alignItems: 'center', padding: '100px 64px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(10,181,214,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: 100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(99,229,255,0.1)' }} />

        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(10,181,214,0.12)', color: C.deep, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, marginBottom: 24, letterSpacing: '0.5px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.deep, display: 'inline-block' }} />
              Only for SLIIT Students — @my.sliit.lk
            </div>

            <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, marginBottom: 20, color: C.dark }}>
              Learn Smarter,<br />
              <span style={{ color: C.deep }}>Together</span> at SLIIT
            </h1>

            <p style={{ fontSize: 17, color: '#2e7d8a', lineHeight: 1.7, maxWidth: 440, marginBottom: 36 }}>
              Buy and sell notes, join Kuppi sessions, and connect with your batchmates — all in one platform built exclusively for SLIIT students.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
              <Link to="/register" style={{ padding: '15px 32px', borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.deep})`, color: C.dark, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 28px rgba(99,229,255,0.5)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(99,229,255,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,229,255,0.5)' }}
              >Get Started Free</Link>
              <button onClick={() => scrollTo('how-it-works')}
                style={{ padding: '15px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.6)', border: `2px solid rgba(99,229,255,0.4)`, color: C.dark, fontWeight: 600, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.deep}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,229,255,0.4)'}
              >See How It Works</button>
            </div>

            <div style={{ display: 'flex', gap: 36, paddingTop: 32, borderTop: '1px solid rgba(99,229,255,0.3)' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.dark }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#2e7d8a', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — card */}
          <div style={{ position: 'relative' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 24px 60px rgba(10,74,87,0.12)' }}>
              <div style={{ background: `linear-gradient(135deg,${C.light},${C.soft})`, borderRadius: 14, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: C.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 700 }}>N</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>DSA Complete Notes</div>
                  <div style={{ fontSize: 12, color: '#2e7d8a', marginTop: 3 }}>by Gimantha D. — IT Category</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.deep }}>LKR 350</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#f59e0b', fontSize: 16 }}>★★★★★</span>
                <span style={{ fontSize: 12, color: '#2e7d8a' }}>4.9 · 128 downloads</span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {['IT', 'Data Structures', 'Algorithms', 'Year 2'].map(t => (
                  <span key={t} style={{ background: C.light, color: C.deep, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{t}</span>
                ))}
              </div>

              <div style={{ background: `linear-gradient(135deg,${C.primary},${C.deep})`, borderRadius: 10, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>Purchase Note</span>
                <span style={{ color: C.dark, fontWeight: 800 }}>→</span>
              </div>
            </div>

            {/* Floating — students */}
            <div style={{ position: 'absolute', bottom: -20, left: -28, background: '#fff', borderRadius: 14, padding: '12px 18px', boxShadow: '0 12px 32px rgba(10,74,87,0.12)', display: 'flex', alignItems: 'center', gap: 12, animation: 'float 3s ease-in-out infinite' }}>
              <div style={{ display: 'flex' }}>
                {[['G', '#63e5ff,#0ab5d6'], ['S', '#ff9a9e,#fda085'], ['L', '#a1ffce,#4d9a57']].map(([l, bg], i) => (
                  <div key={l} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0, background: `linear-gradient(135deg,${bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.dark }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>+340 joined this week</div>
                <div style={{ fontSize: 11, color: '#2e7d8a' }}>SLIIT students</div>
              </div>
            </div>

            {/* Floating — verified */}
            <div style={{ position: 'absolute', top: -16, right: -20, background: `linear-gradient(135deg,${C.primary},${C.deep})`, borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 24px rgba(99,229,255,0.5)', animation: 'float 3s ease-in-out 0.5s infinite' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.dark }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.dark, marginTop: 2 }}>Verified Seller</div>
              <div style={{ fontSize: 11, color: C.dark, opacity: 0.7 }}>Payment confirmed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" style={{ padding: '80px 64px', background: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.deep, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Browse by Subject</div>
        <h2 style={{ fontSize: 38, fontWeight: 800, color: C.dark, marginBottom: 40 }}>Explore All Categories</h2>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <Link key={cat} to={`/notes?category=${cat}`}
              style={{ padding: '14px 28px', borderRadius: 14, background: C.light, border: `2px solid rgba(99,229,255,0.4)`, color: C.dark, fontWeight: 700, fontSize: 15, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${C.primary},${C.deep})`; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,229,255,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = C.light; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >{cat}</Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 64px', background: 'linear-gradient(160deg,#f0fdff,#e8f9ff)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.deep, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Platform Features</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.dark, marginBottom: 14 }}>Everything You Need to<br />Study Smarter</h2>
            <p style={{ fontSize: 16, color: '#2e7d8a', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>Built specifically for SLIIT students — every feature designed around how you study.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title}
                style={{ background: '#fff', borderRadius: 20, padding: 32, border: '2px solid transparent', transition: 'all 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(99,229,255,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.deep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 18 }}>{i + 1}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: C.dark, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#2e7d8a', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '100px 64px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.deep, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Simple Process</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: C.dark, marginBottom: 60 }}>Start in 4 Easy Steps</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 32, left: '12%', right: '12%', height: 2, background: `linear-gradient(90deg,${C.primary},${C.deep})`, zIndex: 0 }} />
            {STEPS.map(s => (
              <div key={s.num} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px', background: `linear-gradient(135deg,${C.primary},${C.deep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: C.dark, boxShadow: '0 8px 24px rgba(99,229,255,0.5)' }}>{s.num}</div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: C.dark, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#2e7d8a', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 64px', textAlign: 'center', background: 'linear-gradient(135deg,#0a4a57 0%,#0e6b7a 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,229,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 46, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Ready to Study <span style={{ color: C.primary }}>Smarter?</span></h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
            Join 1,200+ SLIIT students already using the platform. Register with your @my.sliit.lk email today.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/register" style={{ padding: '15px 36px', borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.soft})`, color: C.dark, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 28px rgba(99,229,255,0.4)', transition: 'transform 0.25s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >Get Started Free</Link>
            <Link to="/login" style={{ padding: '15px 28px', borderRadius: 14, border: '2px solid rgba(99,229,255,0.4)', color: C.primary, fontWeight: 600, fontSize: 16, textDecoration: 'none', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,229,255,0.4)'}
            >Login</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#071f2b', padding: '48px 64px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img src="/logo.png" alt="logo" style={{ height: 36, width: 36, borderRadius: 8, objectFit: 'cover' }} />
              <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>SLIIT <span style={{ color: C.primary }}>Learning</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 240, lineHeight: 1.7 }}>A peer-to-peer learning marketplace built exclusively for SLIIT students.</p>
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            {[
              { title: 'Platform', links: ['Browse Notes', 'Kuppi Sessions', 'My Purchases', 'Analytics'] },
              { title: 'Account', links: ['Register', 'Login', 'Profile', 'Bank Details'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 16 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.primary}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >{l}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 SLIIT Learning Platform. All rights reserved.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Only for @my.sliit.lk students</p>
        </div>
      </footer>

      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
};

export default LandingPage;