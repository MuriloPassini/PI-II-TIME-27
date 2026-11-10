// server.ts — PI2 / Time 27
// Autor: Murilo Passini

// Arquivo principal do backend do FLUXO. Aqui a gente sobe o servidor
// Express e registra as rotas que o time criou na pasta rotas.
// Cada arquivo de rota cuida das rotas de uma tela do sistema.

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import rotasLogin from './rotas/rotasLogin';
import rotasDashboard from './rotas/rotasDashboard';
import rotasDemandas from './rotas/rotasDemandas';
import rotasCadastro from './rotas/rotasCadastro';
import rotasDetalhes from './rotas/rotasDetalhes';
import rotasComentarios from './rotas/rotasComentarios';

// Le o arquivo .env para pegar a porta do servidor
dotenv.config();

const app = express();
const PORTA = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// GET / - resposta simples para conferir que o servidor esta no ar
function responderInicio(req: Request, res: Response): void {
    res.status(200).json({
        status: 'online',
        projeto: 'Sistema de Acompanhamento de Demandas de Desenvolvimento',
        time: 'PI-II-TIME-27',
        mensagem: 'Servidor backend Node.js + TypeScript em execução com sucesso!',
        versao: '1.0.0',
        timestamp: new Date().toISOString()
    });
}

// GET /api/status - informacoes basicas do servidor
function responderStatus(req: Request, res: Response): void {
    res.status(200).json({
        status: 'ok',
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

app.get('/', responderInicio);
app.get('/api/status', responderStatus);

// Rotas da Reuniao 4 (cada arquivo tem as rotas de uma tela)
app.use(rotasLogin);
app.use(rotasDashboard);
app.use(rotasDemandas);
app.use(rotasCadastro);
app.use(rotasDetalhes);
app.use(rotasComentarios);

// Tratamento de rota inexistente e de erro no final da fila
app.use(rotaInexistente);
app.use(tratarErro);

app.listen(PORTA, function () {
    console.log('====================================================');
    console.log(' Servidor do FLUXO (PI-II Time 27) iniciado!');
    console.log(' Rodando em: http://localhost:' + PORTA);
    console.log(' Rota de teste: http://localhost:' + PORTA + '/');
    console.log('====================================================');
});
