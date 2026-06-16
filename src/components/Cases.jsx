import { content } from '../content'
import { Headline, MonoTag } from './primitives'

export default function Cases() {
  return (
    <section id="cas" className="section panel">
      <div className="wrap">
        <div className="section__head">
          <MonoTag>04 — cas concrets</MonoTag>
          <Headline className="section__title" text="Des heures rendues, pour de vrai" />
          <p className="section__lead" data-reveal>
            Quelques exemples de ce qu&apos;on a automatisé. Des chiffres, pas des promesses.
          </p>
        </div>

        <div className="cases">
          {content.cases.map((c, i) => (
            <article className="case" data-cursor data-reveal data-reveal-delay={`${i * 0.07}`} key={i}>
              <div className="case__head">
                <span className="case__sector mono">{c.sector}</span>
                <span className="case__id mono">CASE_{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="case__title">{c.title}</h3>
              <div className="case__body">
                <p className="case__problem">{c.problem}</p>
                <p className="case__solution">
                  <span className="case__arrow mono" aria-hidden="true">→</span>
                  {c.solution}
                </p>
              </div>
              <div className="case__result">
                <span className="case__result-value">{c.result}</span>
                <span className="case__result-label">{c.resultLabel}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
