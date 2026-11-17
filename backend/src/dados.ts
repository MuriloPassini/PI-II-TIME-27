// dados.ts — PI2 / Time 27
// Autor: Equipe PI-II TIME-27

// Este arquivo guarda apenas os tipos (interfaces) usados pelo FLUXO.
// Na Reuniao 5 os dados de teste em memoria sairam daqui: agora tudo
// e lido e gravado nas tabelas do Oracle (veja a pasta backend/sql).
// As rotas continuam usando os mesmos nomes de campos da Reuniao 4.

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: string;
}

export interface Projeto {
    id: string;
    nome: string;
    descricao: string;
    lider: string;
}

export interface Demanda {
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    prioridade: string;
    status: string;
    projeto: string;
    responsavel: string;
    criadaEm: string;
    atualizadaEm: string;
    prazo: string;
    motivoCancelamento: string;
    canceladaPor: string;
    canceladaEm: string;
}

export interface Comentario {
    id: string;
    demandaId: string;
    autor: string;
    texto: string;
    data: string;
}

export interface Historico {
    id: number;
    demandaId: string;
    usuario: string;
    acao: string;
    campo: string;
    valorAnterior: string;
    valorNovo: string;
    observacao: string;
    data: string;
}

export interface Feriado {
    data: string;
    nome: string;
    tipo: string;
}
