// banco.ts — PI2 / Time 27
// Autor: Murilo Passini

// Aqui fica a conexao com o Oracle. O driver oracledb trabalha com um
// "pool" (uma reserva de conexoes) para o servidor nao abrir e fechar
// uma conexao nova a cada requisicao.
// As configuracoes vem do arquivo .env (veja o .env.example).

import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

let pool: oracledb.Pool | null = null;

// Monta o texto de conexao no formato host:porta/servico
function textoDeConexao(): string {
    let host = process.env.DB_HOST || 'localhost';
    let porta = process.env.DB_PORT || '1521';
    let servico = process.env.DB_SERVICE_NAME || 'FREEPDB1';
    return host + ':' + porta + '/' + servico;
}

// Cria o pool de conexoes quando o servidor sobe
export async function iniciarBanco(): Promise<void> {
    if (pool !== null) {
        return;
    }

    pool = await oracledb.createPool({
        user: process.env.DB_USER || 'fluxo',
        password: process.env.DB_PASSWORD || 'Fluxo2026',
        connectString: textoDeConexao(),
        poolMin: 1,
        poolMax: 10,
        poolIncrement: 1
    });

    console.log('Oracle conectado em ' + textoDeConexao() + ' (usuario ' + (process.env.DB_USER || 'fluxo') + ').');
}

// Pega uma conexao do pool. Quem pega precisa devolver com close().
export async function pegarConexao(): Promise<oracledb.Connection> {
    if (pool === null) {
        throw new Error('O banco ainda nao foi iniciado. Chame iniciarBanco() primeiro.');
    }
    return pool.getConnection();
}

// Executa um SELECT e devolve as linhas como objetos (chaves em MAIUSCULO)
export async function consultar(sql: string, binds: any = {}): Promise<any[]> {
    let conexao = await pegarConexao();
    try {
        let resultado = await conexao.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return (resultado.rows || []) as any[];
    } finally {
        await conexao.close();
    }
}

// Executa um comando que grava (INSERT, UPDATE, DELETE) e confirma na hora
export async function executar(sql: string, binds: any = {}): Promise<void> {
    let conexao = await pegarConexao();
    try {
        await conexao.execute(sql, binds, { autoCommit: true });
    } finally {
        await conexao.close();
    }
}

// Versoes que usam uma conexao que ja esta aberta (dentro de transacao)
export async function consultarNaConexao(conexao: oracledb.Connection, sql: string, binds: any = {}): Promise<any[]> {
    let resultado = await conexao.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return (resultado.rows || []) as any[];
}

export async function executarNaConexao(conexao: oracledb.Connection, sql: string, binds: any = {}): Promise<void> {
    await conexao.execute(sql, binds, { autoCommit: false });
}

// Roda varias gravacoes juntas: se uma falhar, desfaz tudo (rollback)
export async function emTransacao(tarefa: (conexao: oracledb.Connection) => Promise<void>): Promise<void> {
    let conexao = await pegarConexao();
    try {
        await tarefa(conexao);
        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.close();
    }
}

// Descobre o proximo id de uma tabela que usa o padrao PREFIXO-001.
// Os nomes de tabela e prefixo sao fixos no codigo (nao vem do usuario).
export async function proximoIdNaConexao(conexao: oracledb.Connection, tabela: string, prefixo: string): Promise<string> {
    let inicio = prefixo.length + 1;
    let sql = 'SELECT NVL(MAX(TO_NUMBER(SUBSTR(ID, ' + inicio + '))), 0) AS MAIOR FROM ' + tabela;
    let linhas = await consultarNaConexao(conexao, sql);
    let maior = Number(linhas[0].MAIOR);

    let proximo = maior + 1;
    let numero = '' + proximo;
    while (numero.length < 3) {
        numero = '0' + numero;
    }

    return prefixo + numero;
}

// Fecha o pool quando o servidor e encerrado
export async function fecharBanco(): Promise<void> {
    if (pool !== null) {
        await pool.close(10);
        pool = null;
    }
}
