// dados.ts — PI2 / Time 27
// Autor: Equipe PI-II TIME-27

// Este arquivo guarda os dados de teste do FLUXO.
// Nesta etapa tudo fica na memoria do servidor, sem banco de dados.
// Nas proximas etapas essas listas saem e a gente passa a ler do Oracle.

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    senha: string;
    perfil: string;
}

export interface Projeto {
    id: string;
    nome: string;
    descricao: string;
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
}

export interface Comentario {
    id: string;
    demandaId: string;
    autor: string;
    texto: string;
    data: string;
}

// Monta uma data no formato AAAA-MM-DD a partir de hoje somando
// a quantidade de dias recebida. Os prazos das demandas 005, 006 e 007
// usam essa funcao para o dashboard sempre ter demandas proximas do prazo.
function daquiDe(dias: number): string {
    let hoje = new Date();
    let data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias);

    let ano = data.getFullYear();
    let mes = data.getMonth() + 1;
    let dia = data.getDate();

    let mesTexto = '';
    let diaTexto = '';

    if (mes < 10) {
        mesTexto = '0' + mes;
    } else {
        mesTexto = '' + mes;
    }

    if (dia < 10) {
        diaTexto = '0' + dia;
    } else {
        diaTexto = '' + dia;
    }

    return ano + '-' + mesTexto + '-' + diaTexto;
}

// Usuarios de teste do sistema (as senhas sao fixas so para a demo)
export const usuarios: Usuario[] = [
    {
        id: 'USU-001',
        nome: 'Ana Souza',
        email: 'ana.souza@fluxo.com',
        senha: 'Admin@2026',
        perfil: 'Administrador'
    },
    {
        id: 'USU-002',
        nome: 'Bruno Lima',
        email: 'bruno.lima@fluxo.com',
        senha: 'Lider@2026',
        perfil: 'Líder'
    },
    {
        id: 'USU-003',
        nome: 'Carla Dias',
        email: 'carla.dias@fluxo.com',
        senha: 'Lider@2026',
        perfil: 'Líder'
    },
    {
        id: 'USU-004',
        nome: 'João Silva',
        email: 'joao.silva@fluxo.com',
        senha: 'Membro@2026',
        perfil: 'Membro'
    },
    {
        id: 'USU-005',
        nome: 'Maria Costa',
        email: 'maria.costa@fluxo.com',
        senha: 'Membro@2026',
        perfil: 'Membro'
    },
    {
        id: 'USU-006',
        nome: 'Pedro Gomes',
        email: 'pedro.gomes@fluxo.com',
        senha: 'Membro@2026',
        perfil: 'Membro'
    }
];

// Projetos que o time trabalha atualmente
export const projetos: Projeto[] = [
    {
        id: 'PRJ-001',
        nome: 'Sistema Web',
        descricao: 'Sistema web de acompanhamento de demandas de desenvolvimento'
    },
    {
        id: 'PRJ-002',
        nome: 'Aplicativo Mobile',
        descricao: 'Aplicativo para acompanhamento das demandas em campo'
    },
    {
        id: 'PRJ-003',
        nome: 'API de Integração',
        descricao: 'Serviço REST para integração entre os sistemas da empresa'
    },
    {
        id: 'PRJ-004',
        nome: 'Site Institucional',
        descricao: 'Site publico da empresa'
    }
];

// Demandas de teste
export const demandas: Demanda[] = [
    {
        id: 'DEM-001',
        titulo: 'Falha na autenticação de usuários',
        descricao: 'Alguns usuários não conseguem entrar no sistema quando a senha tem caracteres especiais.',
        tipo: 'Defeito',
        prioridade: 'Crítica',
        status: 'Aberta',
        projeto: 'Sistema Web',
        responsavel: 'Não atribuído',
        criadaEm: '2026-10-26',
        atualizadaEm: '2026-10-26',
        prazo: '2026-11-14'
    },
    {
        id: 'DEM-002',
        titulo: 'Implementar tela de perfil do usuário',
        descricao: 'Criar a tela de perfil para o usuário visualizar e atualizar seus dados pessoais.',
        tipo: 'Tarefa',
        prioridade: 'Alta',
        status: 'Em andamento',
        projeto: 'Sistema Web',
        responsavel: 'João Silva',
        criadaEm: '2026-10-27',
        atualizadaEm: '2026-11-04',
        prazo: '2026-11-20'
    },
    {
        id: 'DEM-003',
        titulo: 'Revisar fluxo de aprovação de demandas',
        descricao: 'Ajustar o fluxo para o líder revisar a demanda antes dela ir para o quadro kanban.',
        tipo: 'Melhoria',
        prioridade: 'Média',
        status: 'Em revisão',
        projeto: 'Sistema Web',
        responsavel: 'Bruno Lima',
        criadaEm: '2026-10-28',
        atualizadaEm: '2026-11-05',
        prazo: '2026-11-25'
    },
    {
        id: 'DEM-004',
        titulo: 'Corrigir rodapé em telas de celular',
        descricao: 'O rodapé do site aparece desmontado em telas de celular.',
        tipo: 'Defeito',
        prioridade: 'Baixa',
        status: 'Concluída',
        projeto: 'Site Institucional',
        responsavel: 'Pedro Gomes',
        criadaEm: '2026-10-29',
        atualizadaEm: '2026-11-06',
        prazo: '2026-11-08'
    },
    {
        id: 'DEM-005',
        titulo: 'Criar relatório mensal de demandas',
        descricao: 'Gerar um relatório mensal com a quantidade de demandas abertas e concluídas.',
        tipo: 'Tarefa',
        prioridade: 'Alta',
        status: 'Em andamento',
        projeto: 'Sistema Web',
        responsavel: 'Maria Costa',
        criadaEm: '2026-10-30',
        atualizadaEm: '2026-11-02',
        prazo: daquiDe(2)
    },
    {
        id: 'DEM-006',
        titulo: 'Erro ao exportar dados para planilha',
        descricao: 'A exportação para planilha falha quando o resultado tem mais de mil linhas.',
        tipo: 'Defeito',
        prioridade: 'Crítica',
        status: 'Em andamento',
        projeto: 'API de Integração',
        responsavel: 'João Silva',
        criadaEm: '2026-10-31',
        atualizadaEm: '2026-11-03',
        prazo: daquiDe(4)
    },
    {
        id: 'DEM-007',
        titulo: 'Adicionar filtro por prioridade',
        descricao: 'Incluir filtro por prioridade na listagem de demandas do aplicativo.',
        tipo: 'Melhoria',
        prioridade: 'Alta',
        status: 'Em andamento',
        projeto: 'Aplicativo Mobile',
        responsavel: 'Pedro Gomes',
        criadaEm: '2026-11-02',
        atualizadaEm: '2026-11-05',
        prazo: daquiDe(6)
    },
    {
        id: 'DEM-008',
        titulo: 'Ajustar cores para acessibilidade',
        descricao: 'Ajustar as cores do site para melhorar o contraste e a leitura.',
        tipo: 'Melhoria',
        prioridade: 'Média',
        status: 'Aberta',
        projeto: 'Site Institucional',
        responsavel: 'Não atribuído',
        criadaEm: '2026-11-02',
        atualizadaEm: '2026-11-02',
        prazo: '2026-11-28'
    },
    {
        id: 'DEM-009',
        titulo: 'Documentar endpoints da API',
        descricao: 'Escrever a documentação dos endpoints disponíveis na API de integração.',
        tipo: 'Documentação',
        prioridade: 'Baixa',
        status: 'Em revisão',
        projeto: 'API de Integração',
        responsavel: 'Carla Dias',
        criadaEm: '2026-11-03',
        atualizadaEm: '2026-11-07',
        prazo: '2026-12-05'
    },
    {
        id: 'DEM-010',
        titulo: 'Queda de desempenho na listagem',
        descricao: 'A listagem de demandas trava quando tem muitos itens na tela.',
        tipo: 'Defeito',
        prioridade: 'Crítica',
        status: 'Aberta',
        projeto: 'Aplicativo Mobile',
        responsavel: 'Não atribuído',
        criadaEm: '2026-11-03',
        atualizadaEm: '2026-11-03',
        prazo: ''
    },
    {
        id: 'DEM-011',
        titulo: 'Adicionar tema escuro',
        descricao: 'Adicionar tema escuro ao aplicativo para uso em ambientes com pouca luz.',
        tipo: 'Melhoria',
        prioridade: 'Média',
        status: 'Cancelada',
        projeto: 'Aplicativo Mobile',
        responsavel: 'Maria Costa',
        criadaEm: '2026-11-04',
        atualizadaEm: '2026-11-06',
        prazo: '2026-11-18'
    },
    {
        id: 'DEM-012',
        titulo: 'Criar tela de cadastro de projetos',
        descricao: 'Criar uma tela para o administrador cadastrar novos projetos no sistema.',
        tipo: 'Tarefa',
        prioridade: 'Alta',
        status: 'Concluída',
        projeto: 'Sistema Web',
        responsavel: 'Carla Dias',
        criadaEm: '2026-11-05',
        atualizadaEm: '2026-11-07',
        prazo: '2026-11-06'
    },
    {
        id: 'DEM-013',
        titulo: 'Corrigir link quebrado na home',
        descricao: 'O link do blog na página inicial do site está quebrado.',
        tipo: 'Defeito',
        prioridade: 'Baixa',
        status: 'Aberta',
        projeto: 'Site Institucional',
        responsavel: 'Não atribuído',
        criadaEm: '2026-11-06',
        atualizadaEm: '2026-11-06',
        prazo: '2026-12-10'
    },
    {
        id: 'DEM-014',
        titulo: 'Revisar textos da página de contato',
        descricao: 'Revisar os textos da página de contato do site institucional.',
        tipo: 'Tarefa',
        prioridade: 'Baixa',
        status: 'Cancelada',
        projeto: 'Site Institucional',
        responsavel: 'Pedro Gomes',
        criadaEm: '2026-11-07',
        atualizadaEm: '2026-11-08',
        prazo: '2026-11-05'
    },
    {
        id: 'DEM-015',
        titulo: 'Preparar apresentação da entrega',
        descricao: 'Preparar os slides da apresentação da entrega desta etapa do projeto.',
        tipo: 'Tarefa',
        prioridade: 'Média',
        status: 'Aberta',
        projeto: 'Sistema Web',
        responsavel: 'Bruno Lima',
        criadaEm: '2026-11-08',
        atualizadaEm: '2026-11-08',
        prazo: '2026-12-15'
    }
];

// Comentarios de teste (o formato da data e AAAA-MM-DD HH:MM:SS)
export const comentarios: Comentario[] = [
    {
        id: 'COM-001',
        demandaId: 'DEM-001',
        autor: 'Bruno Lima',
        texto: 'Conseguimos reproduzir o erro com três usuários diferentes. Vamos priorizar a correção.',
        data: '2026-10-27 09:15:32'
    },
    {
        id: 'COM-002',
        demandaId: 'DEM-001',
        autor: 'Ana Souza',
        texto: 'Lembrem que a correção precisa entrar antes da entrega da próxima etapa.',
        data: '2026-10-27 14:40:05'
    },
    {
        id: 'COM-003',
        demandaId: 'DEM-002',
        autor: 'João Silva',
        texto: 'O layout da tela já está pronto, falta ligar com os dados do usuário.',
        data: '2026-11-03 10:22:47'
    },
    {
        id: 'COM-004',
        demandaId: 'DEM-002',
        autor: 'Carla Dias',
        texto: 'Ficou ótimo. Só ajustem o espaçamento dos botões no topo.',
        data: '2026-11-04 16:05:19'
    },
    {
        id: 'COM-005',
        demandaId: 'DEM-006',
        autor: 'João Silva',
        texto: 'O erro acontece quando a planilha tem mais de mil linhas.',
        data: '2026-11-03 08:47:58'
    }
];
