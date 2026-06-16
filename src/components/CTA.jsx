import { useState } from 'react'
import { content } from '../content'
import { Headline, Magnetic } from './primitives'

export default function CTA() {
  const { cta } = content
  const [pinged, setPinged] = useState(false)

  return (
    <section id="contact" className="cta">
      <div className="wrap cta__inner">
        <span className="cta__cursor mono" aria-hidden="true">&gt; initialiser_le_contact_</span>

        <Headline className="cta__title" text={cta.headline} />

        <p className="cta__sub" data-reveal data-reveal-delay="0.3">
          {cta.sub}
        </p>

        <div className="cta__actions" data-reveal data-reveal-delay="0.45">
          <Magnetic strength={0.45}>
            <button className="btn btn--xl" data-cursor onClick={() => setPinged(true)}>
              {cta.button}
              <span aria-hidden="true">→</span>
            </button>
          </Magnetic>
        </div>

        <p className="cta__note mono">
          {pinged
            ? '// lien de réservation à brancher (calendly / email) — placeholder'
            : '// contact à configurer ultérieurement'}
        </p>
      </div>
    </section>
  )
}
