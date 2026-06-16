# A×S — Studio d'automatisation

Site one-page 3D immersif pour le duo **Anthony Cernon × Schems Kerdoncuff**
(n8n, automatisation de process, scripts sur-mesure, intégrations API, agents IA).

Réseau de nœuds 3D façon workflow n8n, chorégraphié au scroll (chaos → clusters →
chaîne → couches → split → implosion), bloom néon, smooth-scroll et transitions GSAP.

## Stack

- **React 18** + **Vite 5**
- **Three.js** / **React Three Fiber** + **@react-three/postprocessing** (bloom)
- **GSAP** (ScrollTrigger) + **Lenis** (smooth scroll)
- **Tailwind CSS**
- Polices : Clash Display · Satoshi · JetBrains Mono

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build
```

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` build et publie le site à chaque push
sur `main`. Pour l'activer une seule fois :

**Settings → Pages → Build and deployment → Source : GitHub Actions**

Le site sera servi sur `https://<utilisateur>.github.io/AxS-studio/`.
La config Vite utilise `base: './'`, le site fonctionne donc sous n'importe quel
sous-chemin (Pages, Netlify, etc.).

## Accessibilité / perf

- `prefers-reduced-motion` respecté (désactive smooth-scroll, respiration, paquets).
- Détection mobile/faible puissance : moins de nœuds, DPR plafonné.
- Repli propre si WebGL indisponible.
