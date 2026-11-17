// executar-sql.js — PI2 / Time 27
// Autor: Murilo Passini

// Executa os scripts SQL da pasta backend/sql no Oracle.
// Uso (na pasta backend): npm run db:setup
// O script le o .env para pegar host, porta, servico, usuario e senha.

const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PASTA_SQL = path.join(__dirname, '..', 'sql');
const ARQUIVOS = ['01-criar-tabelas.sql', '02-carga-inicial.sql'];

// Junta as configuracoes do .env no formato que o oracledb espera
function configuracao() {
    const host = process.env.DB_HOST || 'localhost';
    const porta = process.env.DB_PORT || '1521';
    const servico = process.env.DB_SERVICE_NAME || 'FREEPDB1';

    return {
        user: process.env.DB_USER || 'fluxo',
        password: process.env.DB_PASSWORD || 'Fluxo2026',
        connectString: host + ':' + porta + '/' + servico
    };
}

// Separa comandos SQL por ponto e virgula, sem quebrar textos entre aspas.
// Os blocos PL/SQL (BEGIN ... END;) nao passam por aqui.
function dividirComandos(texto) {
    let comandos = [];
    let atual = '';
    let dentroDeAspas = false;

    for (let i = 0; i < texto.length; i++) {
        let caractere = texto.charAt(i);

        if (caractere === "'") {
            // No Oracle, uma aspa dentro do texto e escrita duas vezes ('')
            if (dentroDeAspas === true && texto.charAt(i + 1) === "'") {
                atual += "''";
                i++;
                continue;
            }
            dentroDeAspas = !dentroDeAspas;
        }

        if (caractere === ';' && dentroDeAspas === false) {
            comandos.push(atual);
            atual = '';
        } else {
            atual += caractere;
        }
    }

    if (atual.trim() !== '') {
        comandos.push(atual);
    }

    return comandos;
}

// Roda um bloco de SQL. Blocos PL/SQL (BEGIN ... END;) mantem o ponto e virgula.
async function rodarBloco(conexao, bloco, nomeArquivo) {
    let texto = bloco.trim();

    if (texto === '') {
        return;
    }

    // Se o bloco so tem comentarios, nao precisa executar
    let semComentarios = texto.replace(/--.*$/gm, '').trim();
    if (semComentarios === '') {
        return;
    }

    let ehPlSql = /^BEGIN\b/i.test(semComentarios) || /^DECLARE\b/i.test(semComentarios);

    try {
        if (ehPlSql === true) {
            await conexao.execute(texto, {}, { autoCommit: true });
            return;
        }

        // Comandos comuns (CREATE, INSERT, DELETE...) podem vir varios no
        // mesmo bloco. Separamos por ; e executamos um de cada vez.
        let comandos = dividirComandos(semComentarios);

        for (let i = 0; i < comandos.length; i++) {
            let comando = comandos[i].trim();
            if (comando !== '') {
                await conexao.execute(comando, {}, { autoCommit: true });
            }
        }
    } catch (erro) {
        console.error('Erro no arquivo ' + nomeArquivo + ':');
        console.error(erro.message);
        throw erro;
    }
}

// Le o arquivo, separa os comandos pelo "/" sozinho na linha e executa
async function rodarArquivo(conexao, nomeArquivo) {
    const caminho = path.join(PASTA_SQL, nomeArquivo);
    const conteudo = fs.readFileSync(caminho, 'utf8');
    const linhas = conteudo.split(/\r?\n/);

    let bloco = '';

    for (let i = 0; i < linhas.length; i++) {
        if (linhas[i].trim() === '/') {
            await rodarBloco(conexao, bloco, nomeArquivo);
            bloco = '';
        } else {
            bloco += linhas[i] + '\n';
        }
    }

    await rodarBloco(conexao, bloco, nomeArquivo);
    console.log('OK: ' + nomeArquivo);
}

async function principal() {
    let conexao;

    try {
        conexao = await oracledb.getConnection(configuracao());
        console.log('Conectado ao Oracle.');

        for (let i = 0; i < ARQUIVOS.length; i++) {
            await rodarArquivo(conexao, ARQUIVOS[i]);
        }

        console.log('Banco criado e carregado com sucesso!');
    } catch (erro) {
        console.error('Falha ao preparar o banco: ' + erro.message);
        process.exitCode = 1;
    } finally {
        if (conexao) {
            await conexao.close();
        }
    }
}

principal();
