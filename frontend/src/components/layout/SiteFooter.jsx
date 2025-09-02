import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="grid" style={{gridTemplateColumns: '2fr 1fr 1fr'}}>
          <div>
            <div className="logo" style={{marginBottom: 12}}>
              <img src="/brand/logo.svg" alt="" />
              <strong>HomeService</strong>
            </div>
            <p className="muted">On-demand home services you can trust. Book, track, and pay—no hassle.</p>
            <div style={{marginTop:12, display:'flex', gap:10}}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="btn btn-ghost">Facebook</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="btn btn-ghost">X</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="btn btn-ghost">Instagram</a>
            </div>
          </div>
          <div>
            <h4>Company</h4>
            <div style={{display:'grid', gap:8, marginTop:10}}>
              <Link to="/about">About</Link>
              <Link to="/careers">Careers</Link>
              <Link to="/blog">Blog</Link>
            </div>
          </div>
          <div>
            <h4>Support</h4>
            <div style={{display:'grid', gap:8, marginTop:10}}>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/legal/terms">Terms</Link>
              <Link to="/legal/privacy">Privacy</Link>
            </div>
          </div>
        </div>
        <div style={{borderTop:'1px solid var(--border)',marginTop:24,paddingTop:12}} className="muted">
          © {new Date().getFullYear()} HomeService. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
