import { content } from '../content'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__brand">
          <span className="footer__mono">A</span>
          <span className="footer__x">×</span>
          <span className="footer__mono">S</span>
        </div>
        <p className="footer__names mono">{content.brand.full}</p>
        <div className="footer__meta mono">
          <span>{content.brand.tagline}</span>
          <span>© {new Date().getFullYear()} — Tous droits réservés</span>
        </div>
      </div>
    </footer>
  )
}
