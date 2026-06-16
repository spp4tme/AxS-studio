import { content } from '../content'
import { Headline, MonoTag } from './primitives'

export default function Services() {
  return (
    <section id="services" className="section panel">
      <div className="wrap">
        <div className="section__head">
          <MonoTag>02 — services</MonoTag>
          <Headline className="section__title" text="Ce qu'on automatise pour vous" />
          <p className="section__lead" data-reveal>
            De la stack no-code aux scripts maison : on prend la tâche qui vous coûte le plus de temps,
            et on la fait disparaître.
          </p>
        </div>

        <div className="services__grid">
          {content.services.map((s, i) => (
            <article className="card services__card" data-cursor data-reveal data-reveal-delay={`${i * 0.05}`} key={i}>
              <div className="card__top">
                <span className="card__kicker mono">{s.kicker}</span>
                <span className="card__index mono">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="card__title">{s.title}</h3>
              <p className="card__desc">{s.description}</p>
              <ul className="card__bullets">
                {s.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
              <span className="card__rule" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
