export type ProjetoStatus =
  | "backlog"
  | "em_andamento"
  | "pausado"
  | "concluido"
  | "destaque";

export type Papel =
  | "Owner"
  | "Colaborador ativo"
  | "Apoio pontual"
  | "Facilitador";

export interface ProjetoUpdate {
  id: string;
  date: string;
  oQueFiz: string;
  decisao: string;
  evidencia: string;
  resultado: string;
}

export interface Projeto {
  id: string;
  titulo: string;
  status: ProjetoStatus;
  kr: string;
  periodo: string;
  papel: Papel;
  impacto: string;
  descricao: string;
  links: string[];
  destaque: boolean;
  updates: ProjetoUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface Atividade {
  id: string;
  date: string;
  titulo: string;
  /** Duração em minutos (ex.: 30, 60). */
  duracaoMin?: number;
  decisao?: string;
  evidencia?: string;
  resultado?: string;
  notas?: string;
  projetoId?: string;
  linkedUpdateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OneOnOne {
  id: string;
  pessoa: string;
  data: string;
  pauta: string;
  combinados: string;
  followUps: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  deQuem: string;
  data: string;
  tema: string;
  contexto: string;
  createdAt: string;
  updatedAt: string;
}

export type PendenciaStatus = "aberta" | "feita";

export type PendenciaPrioridade = "alta" | "media" | "baixa";

export const PENDENCIA_PRIORIDADES: {
  id: PendenciaPrioridade;
  label: string;
}[] = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Média" },
  { id: "baixa", label: "Baixa" },
];

export interface Pendencia {
  id: string;
  titulo: string;
  status: PendenciaStatus;
  prioridade?: PendenciaPrioridade;
  prazo?: string;
  notas: string;
  projetoId?: string;
  oneOnOneId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meta {
  schemaVersion: number;
  lastSync: string;
  gistId?: string;
}

export type CollectionName =
  | "projetos"
  | "atividades"
  | "oneones"
  | "feedbacks"
  | "pendencias"
  | "meta";

export type CollectionMap = {
  projetos: Projeto[];
  atividades: Atividade[];
  oneones: OneOnOne[];
  feedbacks: Feedback[];
  pendencias: Pendencia[];
  meta: Meta;
};

export const STATUS_COLUMNS: {
  id: ProjetoStatus;
  label: string;
}[] = [
  { id: "backlog", label: "Backlog" },
  { id: "em_andamento", label: "Em andamento" },
  { id: "pausado", label: "Pausado" },
  { id: "concluido", label: "Concluído" },
  { id: "destaque", label: "Destaque" },
];

export const PAPEIS: Papel[] = [
  "Owner",
  "Colaborador ativo",
  "Apoio pontual",
  "Facilitador",
];

export const GIST_DESCRIPTION = "Hub Gestão — dados";
export const SCHEMA_VERSION = 2;
