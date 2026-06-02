export const PADRAO_IMAGENS = {
  // Empty states
  emptyPendencias:        '/assets/empty-pendencias.webp',
  emptyFeed:              '/assets/feed-empty.webp',
  emptyComunicados:       '/assets/feed-empty.webp',
  emptyKudos:             '/assets/feed-empty.webp',
  emptyPessoas:           '/assets/pessoas-empty.webp',
  emptyInteresses:        '/assets/interesses-empty.webp',
  emptyAniversariantes:   '/assets/aniversariantes-empty.webp',
  emptyFerias:            '/assets/rh-ferias-empty.webp',
  emptyFeriasHistorico:   '/assets/rh-ferias-empty.webp',
  emptyGestaoHoraExtra:   '/assets/hora-extra-loading.webp',
  emptyGestaoApropriacao: '/assets/ponto-loading.webp',
  emptyGestaoFerias:      '/assets/rh-ferias-empty.webp',
  emptyGestaoAbonos:      '/assets/rh-abonos-stack-base.webp',

  // Initial states / detail panel
  selectColaborador:      '/assets/select-colaborador.webp',
  pessoasBuscaTeclado:    '/assets/pessoas-busca-teclado.webp',
  pessoasBuscaMao:        '/assets/pessoas-busca-mao.webp',
  buscandoEquipeBase:     '/assets/buscando-equipe-base.webp',
  buscandoLupa:           '/assets/buscando-lupa.webp',

  // Hero loaders (base PNG/WebP + animacao CSS)
  loadingAniversariantes: '/assets/aniversariantes-loading.webp',
  loadingNovosColabs:     '/assets/novos-colaboradores-loading.webp',
  loadingFeedCards:       [1, 2, 3, 4].map((n) => `/assets/feed-card-${n}.webp`) as string[],
  loadingComunicados:     '/assets/comunicados-loading.webp',
  loadingHolerite:        '/assets/holerite-loading.webp',
  loadingPonto:           '/assets/ponto-loading.webp',
  loadingAlocar:          '/assets/alocar-loading.webp',
  loadingPendencias:      '/assets/pendencias-loading.webp',
  loadingHoraExtra:       '/assets/hora-extra-loading.webp',
  loadingFerias:          '/assets/rh-ferias-loading.webp',
  loadingAbonos:          '/assets/rh-abonos-loading.webp',
  loadingAbonosBase:      '/assets/rh-abonos-stack-base.webp',
  loadingPerfilFront:     '/assets/perfil-card-front.webp',
  loadingPerfilBack:      '/assets/perfil-card-back.webp',

  // FluencIA
  fluenciaIcon:           '/assets/fluencia-icon.webp',
  fluenciaLogo:           '/assets/fluencia-logo.webp',

  // Sistema
  ogImage:                '/og-image.png',
  notFound:               '/assets/notfound-404.webp',
  accessDenied:           '/assets/access-denied.webp',
} as const;

export const ASSETS = PADRAO_IMAGENS;
