import { content } from '../content'
import { Headline, Magnetic, MonoTag, ScrambleText } from './primitives'
import { scrollToHash } from '../lib/useSmoothScroll'

export default function Hero() {
  const { brand, stats, cta } = content
  return (
    <section id="top" className="hero">
      <div className="hero__inner wrap">
        <MonoTag className="hero__tag">flux_actif — studio d&apos;automatisation</MonoTag>

        <h1 className="hero__title">
          <Headline as="span" text={brand.heroHeadline[0]} start="top 95%" />
          <Headline as="span" className="hero__title-accent" text={brand.heroHeadline[1]} start="top 95%" />
        </h1>

        <p className="hero__sub" data-reveal data-reveal-delay="0.5">
          {brand.heroSub}
        </p>

        <div className="hero__actions" data-reveal data-reveal-delay="0.65">
          <Magnetic strength={0.4}>
            <button className="btn" data-cursor onClick={() => scrollToHash('#contact')}>
              {cta.button}
              <span aria-hidden="true">→</span>
            </button>
          </Magnetic>
          <button className="btn btn--ghost" data-cursor onClick={() => scrollToHash('#methode')}>
            Voir la méthode
          </button>
        </div>

        <div className="hero__stats">
          {stats.map((s, i) => (
            <div className="hero__stat" key={i} data-reveal data-reveal-delay={`${0.75 + i * 0.08}`}>
              <div className="hero__stat-value">{s.value}</div>
              <ScrambleText className="hero__stat-label" text={s.label} />
            </div>
          ))}
        </div>
      </div>

      <div className="hero__cue mono" aria-hidden="true">
        <span>défiler</span>
        <span className="hero__cue-line" />
      </div>
    </section>
  )
}
