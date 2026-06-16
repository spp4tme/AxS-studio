// Tout le contenu éditorial du site (FR). Source unique de vérité.
export const content = {
  brand: {
    name: 'A×S',
    full: 'Anthony Cernon × Schems Kerdoncuff',
    tagline: 'On automatise. Vous respirez.',
    heroHeadline: ['Vos process', 'tournent seuls'],
    heroSub:
      'Anthony et Schems connectent vos outils et automatisent les tâches manuelles qui plombent vos journées.',
  },

  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Méthode', href: '#methode' },
    { label: 'Cas', href: '#cas' },
    { label: 'Le duo', href: '#duo' },
  ],

  services: [
    {
      kicker: '01 / N8N',
      title: 'Workflows n8n',
      description:
        "On construit des workflows n8n robustes qui relient vos outils sans une ligne de code à maintenir de votre côté. Hébergés chez vous ou chez nous, versionnés, monitorés.",
      bullets: [
        'Self-hosted ou cloud, vous choisissez',
        "Gestion d'erreurs et alertes intégrées",
        'Documentation et passation incluses',
      ],
    },
    {
      kicker: '02 / PROCESS',
      title: 'Automatisation de process',
      description:
        "On cartographie une tâche répétitive, on la découpe, puis on l'automatise de bout en bout. Vous reprenez le temps gaspillé en copier-coller, relances et exports manuels.",
      bullets: [
        'Audit du process avant de coder',
        "Du déclencheur à l'action finale",
        'Mesure du temps réellement gagné',
      ],
    },
    {
      kicker: '03 / SCRIPTS',
      title: 'Scripts sur-mesure',
      description:
        "Quand l'outil clé-en-main ne suffit pas, on écrit du Python propre et testé. Traitement de fichiers, scraping, batchs nocturnes, ce qui ne rentre pas dans une case standard.",
      bullets: [
        'Python lisible et commenté',
        'Tests et logs sur les parties critiques',
        'Cron, webhook ou à la demande',
      ],
    },
    {
      kicker: '04 / API',
      title: 'Intégrations API',
      description:
        "On fait parler vos outils entre eux, même ceux sans connecteur officiel. CRM, facturation, support, base de données : la donnée circule au lieu de dormir dans des silos.",
      bullets: [
        'REST, GraphQL, webhooks et OAuth',
        'Synchro fiable et idempotente',
        'Mapping de données propre et documenté',
      ],
    },
    {
      kicker: '05 / IA',
      title: 'Agents IA',
      description:
        "On branche des agents IA là où ils règlent un vrai problème : tri, qualification, rédaction, réponses. Pas un chatbot gadget, un assistant connecté à vos données et vos actions.",
      bullets: [
        'Connectés à vos vrais outils et données',
        'Garde-fous et validation humaine au besoin',
        'Coût par tâche maîtrisé et suivi',
      ],
    },
  ],

  process: [
    { num: '01', title: 'On écoute', description: 'Un appel pour comprendre votre quotidien et repérer où le temps part en fumée.' },
    { num: '02', title: 'On cadre', description: 'On choisit la tâche au meilleur rapport effort/gain et on chiffre clairement.' },
    { num: '03', title: 'On construit', description: 'On développe, on teste sur vos vrais cas et on itère vite avec vous.' },
    { num: '04', title: 'On livre', description: 'Mise en production, documentation et passation. Ça tourne, vous gardez la main.' },
  ],

  cases: [
    {
      sector: 'E-commerce',
      title: 'Synchro commandes et stock',
      problem: "L'équipe ressaisissait chaque commande entre Shopify, l'ERP et le tableur de stock.",
      solution: 'Workflow n8n qui synchronise commandes, stock et factures en temps réel entre les trois outils.',
      result: '-14h/semaine',
      resultLabel: 'de saisie en moins',
    },
    {
      sector: 'Agence marketing',
      title: 'Reporting client automatisé',
      problem: 'Chaque lundi, deux jours partaient à compiler les rapports de campagne à la main.',
      solution: "Scripts qui agrègent les données pub et un agent IA qui rédige le résumé envoyé au client.",
      result: '2 j/mois',
      resultLabel: 'récupérés',
    },
    {
      sector: 'SaaS B2B',
      title: 'Qualification des leads entrants',
      problem: 'Les leads s’empilaient sans tri, les commerciaux passaient à côté des bons.',
      solution: 'Agent IA qui enrichit, score et route chaque lead vers le bon commercial dans le CRM.',
      result: '+31%',
      resultLabel: 'de leads traités',
    },
  ],

  stack: ['n8n', 'Make', 'Python', 'OpenAI', 'Claude', 'Supabase', 'Notion', 'Google Sheets', 'Webhooks', 'Airtable', 'PostgreSQL', 'Zapier'],

  stats: [
    { value: '120+', label: 'workflows livrés' },
    { value: '9 000 h', label: 'économisées par nos clients' },
    { value: '48 h', label: 'pour un premier workflow en prod' },
  ],

  duo: [
    {
      name: 'Anthony Cernon',
      role: 'Architecte automatisation',
      blurb: 'Cadre les process et conçoit des workflows qui tiennent en production. Allergique aux usines à gaz.',
      monogram: 'AC',
    },
    {
      name: 'Schems Kerdoncuff',
      role: 'Ingénieur intégrations & IA',
      blurb: 'Branche les API récalcitrantes et met les agents IA au travail. Du code propre, testé, qui ne casse pas.',
      monogram: 'SK',
    },
  ],

  cta: {
    headline: 'Une tâche vous bouffe vos journées ? Parlons-en.',
    sub: "Un appel de 30 minutes pour identifier ce qu'on peut automatiser dès cette semaine.",
    button: 'Réserver un appel',
  },
}
