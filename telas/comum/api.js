// api.js — PI2 / Time 27
// Autor: Murilo Passini

// Arquivo compartilhado por todas as telas do FLUXO.
// Ele guarda o token do login, monta as requisicoes para a API,
// formata datas e liga os botoes de navegacao entre as telas.
// A API precisa estar rodando em http://localhost:3000 (veja o README).

const API_URL = 'http://localhost:3000';
const CHAVE_TOKEN = 'fluxoToken';
const CHAVE_USUARIO = 'fluxoUsuario';

// Endereco de cada tela (as telas ficam em pastas separadas)
const PAGINAS = {
    dashboard: '../02-dashboard/index.html',
    demands: '../03-demandas/index.html',
    kanban: '../04-kanban/index.html',
    form: '../05-cadastro-demanda/index.html',
    detail: '../06-detalhes-demanda/index.html',
    projects: '../07-projetos-equipe/index.html'
};

// Nome que aparece na trilha do topo
const ROTULOS = {
    dashboard: 'Dashboard',
    demands: 'Demandas',
    kanban: 'Quadro Kanban',
    form: 'Nova demanda',
    detail: 'Detalhes da demanda',
    projects: 'Projetos e equipe'
};

// Guarda o token e o usuario depois do login
function guardarSessao(token, usuario) {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

// Devolve o token guardado (ou string vazia)
function lerToken() {
    let token = localStorage.getItem(CHAVE_TOKEN);
    if (token == null) {
        return '';
    }
    return token;
}

// Devolve o usuario guardado (ou null)
function lerUsuario() {
    let texto = localStorage.getItem(CHAVE_USUARIO);
    if (texto == null) {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch (erro) {
        return null;
    }
}

// Apaga a sessao do navegador
function limparSessao() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
}

// Volta para a tela de login
function irParaLogin() {
    window.location.href = '../01-login/index.html';
}

// Confere se existe um token antes de carregar a tela
function exigirSessao() {
    if (lerToken() === '') {
        irParaLogin();
        return false;
    }
    return true;
}

// Faz uma requisicao para a API e devolve { ok, status, dados }.
// Quando o token vence (401), limpa a sessao e volta para o login.
async function requisitar(metodo, caminho, corpo) {
    let opcoes = { method: metodo, headers: {} };
    let token = lerToken();

    if (token !== '') {
        opcoes.headers.Authorization = 'Bearer ' + token;
    }

    if (corpo !== undefined) {
        opcoes.headers['Content-Type'] = 'application/json';
        opcoes.body = JSON.stringify(corpo);
    }

    try {
        let resposta = await fetch(API_URL + caminho, opcoes);
        let dados = null;

        try {
            dados = await resposta.json();
        } catch (erro) {
            dados = null;
        }

        if (resposta.status === 401) {
            limparSessao();

            // Na propria tela de login nao adianta redirecionar:
            // o 401 ali significa "e-mail ou senha incorretos".
            if (window.location.pathname.indexOf('01-login') === -1) {
                irParaLogin();
            }
        }

        return { ok: resposta.ok, status: resposta.status, dados: dados };
    } catch (erro) {
        return {
            ok: false,
            status: 0,
            dados: {
                erro: 'Sem conexão',
                mensagem: 'Não foi possível falar com a API. Confira se o servidor está rodando em ' + API_URL + '.'
            }
        };
    }
}

// Monta uma mensagem de erro legivel a partir da resposta da API
function mensagemDeErro(resultado) {
    if (resultado.dados != null) {
        if (resultado.dados.erro != null && resultado.dados.mensagem != null) {
            return resultado.dados.erro + ': ' + resultado.dados.mensagem;
        }
        if (resultado.dados.mensagem != null) {
            return resultado.dados.mensagem;
        }
    }

    return 'A API respondeu com o status ' + resultado.status + '.';
}

// Transforma AAAA-MM-DD em DD/MM/AAAA
function dataParaTela(data) {
    if (data == null || data === '') {
        return '';
    }

    let partes = String(data).split('-');
    if (partes.length !== 3) {
        return String(data);
    }

    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

// Transforma AAAA-MM-DD HH:MM:SS em DD/MM/AAAA · HH:MM
function dataHoraParaTela(dataHora) {
    if (dataHora == null || dataHora === '') {
        return '';
    }

    let partes = String(dataHora).split(' ');
    let data = dataParaTela(partes[0]);

    if (partes.length > 1) {
        return data + ' · ' + partes[1].substring(0, 5);
    }

    return data;
}

// Devolve as iniciais do nome (ex.: "João Silva" -> "JS")
function iniciais(nome) {
    if (nome == null || nome === '') {
        return '?';
    }

    let partes = nome.trim().split(' ');
    let letra1 = partes[0].substring(0, 1);

    if (partes.length > 1) {
        return (letra1 + partes[partes.length - 1].substring(0, 1)).toUpperCase();
    }

    return letra1.toUpperCase();
}

// Evita que textos do banco quebrem o HTML das telas
function escaparHtml(valor) {
    if (valor == null) {
        return '';
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Mostra a pagina da tela atual (as outras ficam escondidas)
function abrirPagina(tela) {
    let paginas = document.querySelectorAll('.page');
    for (let i = 0; i < paginas.length; i++) {
        if (paginas[i].id === 'page-' + tela) {
            paginas[i].classList.add('active');
        } else {
            paginas[i].classList.remove('active');
        }
    }

    let itensDoMenu = document.querySelectorAll('.nav-item[data-page]');
    for (let i = 0; i < itensDoMenu.length; i++) {
        if (itensDoMenu[i].dataset.page === tela) {
            itensDoMenu[i].classList.add('active');
        } else {
            itensDoMenu[i].classList.remove('active');
        }
    }

    let trilha = document.getElementById('crumb');
    if (trilha != null) {
        if (ROTULOS[tela] != null) {
            trilha.textContent = ROTULOS[tela];
        } else {
            trilha.textContent = tela;
        }
    }

    window.scrollTo(0, 0);
}

// Liga o menu lateral e os botoes "data-go" as pastas de cada tela
function configurarNavegacao() {
    let itensDoMenu = document.querySelectorAll('[data-page]');
    for (let i = 0; i < itensDoMenu.length; i++) {
        itensDoMenu[i].addEventListener('click', function () {
            let destino = PAGINAS[itensDoMenu[i].dataset.page];
            if (destino != null) {
                window.location.href = destino;
            }
        });
    }

    let botoesIr = document.querySelectorAll('[data-go]');
    for (let i = 0; i < botoesIr.length; i++) {
        botoesIr[i].addEventListener('click', function () {
            let destino = PAGINAS[botoesIr[i].dataset.go];
            if (destino != null) {
                window.location.href = destino;
            }
        });
    }
}

// Coloca o nome e o perfil do usuario logado na barra lateral
function preencherPerfil() {
    let usuario = lerUsuario();
    if (usuario == null) {
        return;
    }

    let nome = document.querySelector('.profile b');
    if (nome != null) {
        nome.textContent = usuario.nome;
    }

    let cargo = document.querySelector('.profile small');
    if (cargo != null) {
        cargo.textContent = usuario.perfil;
    }

    let avatar = document.querySelector('.profile .avatar');
    if (avatar != null) {
        avatar.textContent = iniciais(usuario.nome);
    }

    let avatarTopo = document.querySelector('.top-actions .avatar');
    if (avatarTopo != null) {
        avatarTopo.textContent = iniciais(usuario.nome);
    }

    // Membro da equipe nao cadastra demanda: esconde os botoes de criar
    if (usuario.perfil === 'Membro da Equipe') {
        let botoesDeCriar = document.querySelectorAll('[data-go="form"]');
        for (let i = 0; i < botoesDeCriar.length; i++) {
            botoesDeCriar[i].style.display = 'none';
        }
    }

    // Clicar nos tres pontinhos encerra a sessao
    let botaoSair = document.querySelector('.profile .dots');
    if (botaoSair != null) {
        botaoSair.title = 'Sair da conta';
        botaoSair.style.cursor = 'pointer';
        botaoSair.addEventListener('click', function () {
            sair();
        });
    }
}

// Encerra a sessao na API e volta para o login
async function sair() {
    await requisitar('POST', '/logout');
    limparSessao();
    irParaLogin();
}

// Formata um texto de data para o campo <input type="date">
function dataParaCampo(data) {
    if (data == null || data === '') {
        return '';
    }
    return String(data);
}
