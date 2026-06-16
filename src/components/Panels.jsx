import { useState } from 'react'
import { content } from '../content'

// Pure DOM panels — each is anchored in 3D space via <Html transform> in Experience.jsx.
// Fixed widths keep the 3D scaling predictable and the text crisp.

function Tag({ children }) {
  return <span className="p3-tag mono">{children}</span>
}

export function HeroPanel() {
  const { brand } = content
  return (
    <div className="p3 p3--hero">
      <Tag>flux_actif — studio d&apos;automatisation</Tag>
      <h1 className="p3-h1">
        <span>{brand.heroHeadline[0]}</span>
        <span className="accent">{brand.heroHeadline[1]}</span>
      </h1>
      <p className="p3-sub">{brand.heroSub}</p>
      <div className="p3-cue mono">
        <span className="p3-cue-dot" />
        scroller pour entrer
      </div>
    </div>
  )
}

export function ServicesPanel() {
  return (
    <div className="p3 p3--wide">
      <div className="p3-head">
        <Tag>01 — services</Tag>
        <h2 className="p3-h2">Ce qu&apos;on automatise</h2>
      </div>
      <ul className="p3-services">
        {content.services.map((s, i) => (
          <li key={i}>
            <span className="p3-k mono">{s.kicker}</span>
            <span className="p3-t">{s.title}</span>
            <span className="p3-d">{s.bullets[0]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProcessPanel() {
  return (
    <div className="p3 p3--wide">
      <div className="p3-head">
        <Tag>02 — méthode</Tag>
        <h2 className="p3-h2">Quatre étapes, zéro blabla</h2>
      </div>
      <ol className="p3-steps">
        {content.process.map((p, i) => (
          <li key={i}>
            <span className="p3-num">{p.num}</span>
            <span className="p3-t">{p.title}</span>
            <span className="p3-d">{p.description}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function CasesPanel() {
  return (
    <div className="p3 p3--wide">
      <div className="p3-head">
        <Tag>03 — cas concrets</Tag>
        <h2 className="p3-h2">Des heures rendues, pour de vrai</h2>
      </div>
      <div className="p3-cases">
        {content.cases.map((c, i) => (
          <div className="p3-case" key={i}>
            <span className="p3-k mono">{c.sector}</span>
            <span className="p3-t">{c.title}</span>
            <span className="p3-res">
              <strong>{c.result}</strong> {c.resultLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DuoPanel() {
  return (
    <div className="p3 p3--wide">
      <div className="p3-head">
        <Tag>04 — le duo</Tag>
        <h2 className="p3-h2">Deux personnes, pas une agence</h2>
      </div>
      <div className="p3-duo">
        {content.duo.map((m, i) => (
          <div className="p3-member" key={i}>
            <span className="p3-mono-badge mono">{m.monogram}</span>
            <span className="p3-t">{m.name}</span>
            <span className="p3-role mono">{m.role}</span>
            <span className="p3-d">{m.blurb}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CTAPanel() {
  const { cta } = content
  const [pinged, setPinged] = useState(false)
  return (
    <div className="p3 p3--cta">
      <span className="p3-cursor mono">&gt; initialiser_le_contact_</span>
      <h2 className="p3-h2 p3-h2--xl">{cta.headline}</h2>
      <p className="p3-sub">{cta.sub}</p>
      <button className="btn btn--xl" data-cursor onClick={() => setPinged(true)}>
        {cta.button} <span aria-hidden="true">→</span>
      </button>
      <span className="p3-note mono">
        {pinged ? '// lien de réservation à brancher (placeholder)' : '// contact à configurer ultérieurement'}
      </span>
    </div>
  )
}

export const PANELS = {
  hero: HeroPanel,
  services: ServicesPanel,
  process: ProcessPanel,
  cases: CasesPanel,
  duo: DuoPanel,
  cta: CTAPanel,
}
