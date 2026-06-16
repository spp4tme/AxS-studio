import { content } from '../content'
import { Headline, MonoTag } from './primitives'

export default function Duo() {
  return (
    <section id="duo" className="section panel">
      <div className="wrap">
        <div className="section__head">
          <MonoTag>05 — le duo</MonoTag>
          <Headline className="section__title" text="Deux personnes, pas une agence" />
          <p className="section__lead" data-reveal>
            Vous parlez directement à ceux qui construisent. Pas de couche commerciale, pas de sous-traitance.
          </p>
        </div>

        <div className="duo">
          {content.duo.map((m, i) => (
            <article className="member" data-cursor data-reveal data-reveal-delay={`${i * 0.1}`} key={i}>
              <div className="member__mono mono">{m.monogram}</div>
              <h3 className="member__name">{m.name}</h3>
              <span className="member__role mono">{m.role}</span>
              <p className="member__blurb">{m.blurb}</p>
            </article>
          ))}
          <div className="duo__x" aria-hidden="true">×</div>
        </div>
      </div>
    </section>
  )
}
