import { content } from '../content'
import { Headline, MonoTag } from './primitives'

export default function Process() {
  return (
    <section id="methode" className="section panel">
      <div className="wrap">
        <div className="section__head">
          <MonoTag>03 — méthode</MonoTag>
          <Headline className="section__title" text="Quatre étapes, zéro blabla" />
          <p className="section__lead" data-reveal>
            Un process simple et transparent. Vous savez à chaque instant où on en est et ce que ça vous rapporte.
          </p>
        </div>

        <ol className="steps">
          {content.process.map((p, i) => (
            <li className="step" data-reveal data-reveal-delay={`${i * 0.08}`} key={i}>
              <span className="step__num">{p.num}</span>
              <span className="step__node" aria-hidden="true" />
              <h3 className="step__title">{p.title}</h3>
              <p className="step__desc">{p.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
