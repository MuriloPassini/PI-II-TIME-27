// server.ts — PI2 / Time 27
// Autor: Murilo Passini

// Arquivo principal do backend do FLUXO. Aqui a gente sobe o servidor
// Express, conecta no Oracle e registra as rotas que o time criou.
// Cada arquivo de rota cuida das rotas de uma tela do sistema.

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { iniciarBanco, fecharBanco, consultar } from './banco';
import rotasLogin from './rotas/rotasLogin';
import rotasDashboard from './rotas/rotasDashboard';
import rotasDemandas from './rotas/rotasDemandas';
import rotasCadastro from './rotas/rotasCadastro';
import rotasEdicao from './rotas/rotasEdicao';
import rotasDetalhes from './rotas/rotasDetalhes';
import rotasComentarios from './rotas/rotasComentarios';
import rotasFeriados from './rotas/rotasFeriados';

// Le o arquivo .env para pegar a porta e os dados do banco
dotenv.config();

const app = express();
const PORTA = process.env.PORT || 3000;

// Pasta das telas (HTML, CSS e JavaScript). Fica um nivel acima de
// "backend", entao a partir de src/ ou de dist/ sao dois "..".
const PASTA_TELAS = path.join(__dirname, '..', '..', 'telas');

// Middlewares globais
app.use(cors());
app.use(express.json());

// GET / - manda o navegador para a tela de login
function redirecionarParaLogin(req: Request, res: Response): void {
    res.redirect('/01-login/');
}

// GET /api - resposta simples para conferir que o servidor esta no ar
function responderInicio(req: Request, res: Response): void {
    res.status(200).json({
        status: 'online',
        projeto: 'Sistema de Acompanhamento de Demandas de Desenvolvimento',
        time: 'PI-II-TIME-27',
        mensagem: 'Servidor backend Node.js + TypeScript + Oracle em execução!',
        versao: '1.0.0',
        timestamp: new Date().toISOString()
    });
}

// GET /api/status - informacoes basicas do servidor e do banco
async function responderStatus(req: Request, res: Response): Promise<void> {
    let banco = 'indisponivel';

    try {
        await consultar('SELECT 1 AS OK FROM DUAL');
        banco = 'conectado';
    } catch (erro) {
        banco = 'indisponivel';
    }

    res.status(200).json({
        status: 'ok',
        banco: banco,
        uptimeSegundos: Math.floor(process.uptime()),
        ambiente: process.env.NODE_ENV || 'development',
        dataHora: new Date().toISOString()
    });
}

// Rota que nao existe
function rotaInexistente(req: Request, res: Response): void {
    res.status(404).json({
        erro: 'Recurso não encontrado',
        mensagem: 'A rota requisitada não existe neste servidor.'
    });
}

// Erro inesperado dentro das rotas
function tratarErro(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('[Erro no Servidor]: ' + err.message);
    res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: err.message || 'Ocorreu um erro inesperado.'
    });
}

app.get('/', redirecionarParaLogin);
app.get('/api', responderInicio);
app.get('/api/status', responderStatus);

// Rotas da Reuniao 5 (cada arquivo tem as rotas de uma tela)
app.use(rotasLogin);
app.use(rotasDashboard);
app.use(rotasDemandas);
app.use(rotasCadastro);
app.use(rotasEdicao);
app.use(rotasDetalhes);
app.use(rotasComentarios);
app.use(rotasFeriados);

// As telas (HTML, CSS e JavaScript) sao servidas pelo proprio Express.
// Assim o sistema inteiro roda com um comando so (npm run dev), sem
// precisar de outro servidor para abrir os arquivos HTML.
app.use(express.static(PASTA_TELAS));

// Tratamento de rota inexistente e de erro no final da fila
app.use(rotaInexistente);
app.use(tratarErro);

// Sobe o servidor somente depois de conectar no Oracle
async function iniciarServidor(): Promise<void> {
    try {
        await iniciarBanco();
    } catch (erro) {
        console.error('Não foi possível conectar no Oracle: ' + (erro as Error).message);
        console.error('Confira se o container "fluxo-oracle" está rodando e se o .env está correto.');
        process.exit(1);
    }

    let servidor = app.listen(PORTA, function () {
        console.log('====================================================');
        console.log(' Servidor do FLUXO (PI-II Time 27) iniciado!');
        console.log(' Telas: http://localhost:' + PORTA + '/01-login/');
        console.log(' API:   http://localhost:' + PORTA + '/api/status');
        console.log('====================================================');
    });

    // Fecha o servidor e o pool quando o processo e encerrado
    async function encerrar(): Promise<void> {
        servidor.close();
        await fecharBanco();
        process.exit(0);
    }

    process.on('SIGINT', encerrar);
    process.on('SIGTERM', encerrar);
}

iniciarServidor();
