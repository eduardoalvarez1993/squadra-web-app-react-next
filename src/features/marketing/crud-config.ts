// Config dos campos de cada recurso do painel Marketing.
// Dirige o CrudPanel genérico (listar/criar/editar/remover) — front-only, sem persistência.
// Campos espelham as origens reais (Airtable / src/data) — ver docs/marketing-painel.md.

export type FieldType = 'text' | 'textarea' | 'date' | 'select' | 'color';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];          // para type 'select'
  full?: boolean;              // ocupa as 2 colunas do form
  help?: string;
}

export type Row = Record<string, string> & { _id: string };

export interface CrudConfig {
  itemLabel: string;           // singular, ex.: "vídeo"
  itemLabelPlural: string;
  primaryKey: string;          // campo usado como título do item na lista
  secondaryKeys: string[];     // campos extras mostrados na lista
  fields: FieldDef[];
  seed: Row[];
}

export const MARKETING_CRUD: Record<string, CrudConfig> = {
  // ── Vídeos ─────────────────────────────────────────────────────────────────
  videos: {
    itemLabel: 'vídeo',
    itemLabelPlural: 'vídeos',
    primaryKey: 'titulo',
    secondaryKeys: ['categoria', 'youtubeId'],
    fields: [
      { key: 'titulo',    label: 'Título do vídeo', type: 'text', required: true, full: true, placeholder: 'Ex.: Onboarding Squadra' },
      { key: 'youtubeId', label: 'ID do YouTube',   type: 'text', required: true, placeholder: 'Ex.: dQw4w9WgXcQ', help: 'O código de 11 caracteres da URL do YouTube.' },
      { key: 'categoria', label: 'Categoria',       type: 'text', placeholder: 'Ex.: Institucional' },
      { key: 'thumbnail', label: 'Thumbnail (URL)', type: 'text', full: true, placeholder: 'Opcional — se vazio, usa a do YouTube' },
    ],
    seed: [
      { _id: 'v-1', titulo: 'Boas-vindas à Squadra', youtubeId: 'dQw4w9WgXcQ', categoria: 'Institucional', thumbnail: '' },
      { _id: 'v-2', titulo: 'Como apontar horas no SQHoras', youtubeId: 'aqz-KE-bpKQ', categoria: 'Tutorial', thumbnail: '' },
    ],
  },

  // ── Comunicados (banner) ────────────────────────────────────────────────────
  comunicados: {
    itemLabel: 'comunicado',
    itemLabelPlural: 'comunicados',
    primaryKey: 'texto',
    secondaryKeys: ['data', 'validade'],
    fields: [
      { key: 'texto',     label: 'Texto',         type: 'textarea', full: true, placeholder: 'Texto sobreposto à imagem (opcional)' },
      { key: 'urlImagem', label: 'Imagem (URL)',  type: 'text', required: true, full: true, placeholder: 'https://… (banner)' },
      { key: 'corTexto',  label: 'Cor do texto',  type: 'color', placeholder: '#FFFFFF' },
      { key: 'data',      label: 'Data',          type: 'date', required: true },
      { key: 'validade',  label: 'Validade',      type: 'date', required: true, help: 'Some da Home depois desta data.' },
    ],
    seed: [
      { _id: 'c-1', texto: 'Nova política de home office já disponível', urlImagem: 'https://via.placeholder.com/600x200', corTexto: '#FFFFFF', data: '2026-06-01', validade: '2026-06-30' },
    ],
  },

  // ── Links importantes (achatado: 1 linha por link) ───────────────────────────
  links: {
    itemLabel: 'link',
    itemLabelPlural: 'links',
    primaryKey: 'texto',
    secondaryKeys: ['grupo', 'link'],
    fields: [
      { key: 'grupo', label: 'Grupo',       type: 'text', required: true, placeholder: 'Ex.: Sistemas Internos' },
      { key: 'icone', label: 'Ícone',       type: 'text', placeholder: 'Ex.: Layers (lucide)' },
      { key: 'texto', label: 'Texto',       type: 'text', required: true, placeholder: 'Ex.: JIRA' },
      { key: 'link',  label: 'URL',         type: 'text', required: true, full: true, placeholder: 'https://…' },
    ],
    seed: [
      { _id: 'l-1', grupo: 'Sistemas Internos', icone: 'Layers',   texto: 'JIRA',    link: 'https://jira.squadra.com.br' },
      { _id: 'l-2', grupo: 'Sistemas Internos', icone: 'Clock',    texto: 'SQHoras', link: 'https://sqhoras.squadra.com.br' },
      { _id: 'l-3', grupo: 'RH',                icone: 'Building2', texto: 'Portal RM', link: 'https://corpore.squadra.com.br/' },
    ],
  },

  // ── Ajuda / FAQ ──────────────────────────────────────────────────────────────
  ajuda: {
    itemLabel: 'pergunta',
    itemLabelPlural: 'perguntas',
    primaryKey: 'problema',
    secondaryKeys: ['categoria', 'subcategoria'],
    fields: [
      { key: 'problema',     label: 'Problema / Pergunta', type: 'text', required: true, full: true, placeholder: 'Ex.: Como solicitar equipamentos?' },
      { key: 'categoria',    label: 'Categoria',     type: 'text', required: true, placeholder: 'Ex.: Hardware & Software' },
      { key: 'subcategoria', label: 'Subcategoria',  type: 'text', placeholder: 'Ex.: Equipamentos' },
      { key: 'tipo',         label: 'Tipo',          type: 'select', options: ['Pergunta e Resposta', 'Tutorial', 'Informativo'] },
      { key: 'resposta',     label: 'Resposta',      type: 'textarea', required: true, full: true, placeholder: 'Conteúdo da resposta (aceita markdown).' },
      { key: 'email',        label: 'E-mail de contato', type: 'text', placeholder: 'Ex.: itoc@squadra.com.br' },
      { key: 'departamento', label: 'Departamento',  type: 'text', placeholder: 'Ex.: Infra' },
    ],
    seed: [
      { _id: 'a-1', problema: 'Como proceder para solicitar equipamentos e acessórios?', categoria: 'Hardware & Software', subcategoria: 'Equipamentos', tipo: 'Pergunta e Resposta', resposta: 'Acesse o Help Desk e abra um chamado na categoria Estação de Trabalho ou Periféricos.', email: 'itoc@squadra.com.br', departamento: 'Infra' },
    ],
  },
};
