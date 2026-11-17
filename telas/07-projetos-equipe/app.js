// app.js — PI2 / Time 27
// Autor: Equipe PI-II TIME-27

// Tela de projetos e equipe (07). Busca os projetos (GET /projetos),
// os usuarios (GET /usuarios) e as demandas (GET /demandas) na API.
// Com esses dados ela mostra os cartoes dos projetos (com a quantidade
// de demandas e o percentual concluido) e a lista de membros.

// Icones usados nos cartoes (um por posicao, para variar o visual)
const ICONES = ['⌘', '▣', '◈', '▤'];
const CORES_DO_AVATAR = ['', 'purple', 'green', 'orange'];

// Mostra uma mensagem rapida no canto da tela
function mostrarToast(mensagem) {
    let toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');

    setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}

// Conta quantas demandas cada projeto tem e quantas estao concluidas
function contarDemandasPorProjeto(demandas) {
    let contagem = {};

    for (let i = 0; i < demandas.length; i++) {
        let nome = demandas[i].projeto;

        if (contagem[nome] == null) {
            contagem[nome] = { total: 0, concluidas: 0 };
        }

        contagem[nome].total = contagem[nome].total + 1;

        if (demandas[i].status === 'Concluída') {
            contagem[nome].concluidas = contagem[nome].concluidas + 1;
        }
    }

    return contagem;
}

// Monta os cartoes dos projetos
function montarProjetos(projetos, contagem) {
    let grade = document.getElementById('project-grid');
    let html = '';

    if (projetos.length === 0) {
        grade.innerHTML = '<p class="nota-demo">Nenhum projeto cadastrado.</p>';
        return;
    }

    for (let i = 0; i < projetos.length; i++) {
        let projeto = projetos[i];
        let dados = contagem[projeto.nome];

        let total = 0;
        let concluidas = 0;

        if (dados != null) {
            total = dados.total;
            concluidas = dados.concluidas;
        }

        let porcentagem = 0;
        if (total > 0) {
            porcentagem = Math.round((concluidas / total) * 100);
        }

        let icone = ICONES[i % ICONES.length];

        html = html + '<article class="panel project-card" data-nome="' + escaparHtml(projeto.nome) + '">';
        html = html + '<div class="project-icon">' + icone + '</div>';
        html = html + '<span class="status success">Ativo</span>';
        html = html + '<h2>' + escaparHtml(projeto.nome) + '</h2>';
        html = html + '<small>' + escaparHtml(projeto.id) + ' · Líder: ' + escaparHtml(projeto.lider) + '</small>';
        html = html + '<div class="progress-label"><span>Demandas concluídas</span><b>' + porcentagem + '%</b></div>';
        html = html + '<div class="progress"><i style="width:' + porcentagem + '%"></i></div>';
        html = html + '<p>' + total + ' demanda(s) · ' + concluidas + ' concluída(s)</p>';
        html = html + '</article>';
    }

    grade.innerHTML = html;

    // Clicar no cartao mostra o nome do projeto
    let cartoes = grade.querySelectorAll('.project-card');
    for (let i = 0; i < cartoes.length; i++) {
        cartoes[i].addEventListener('click', function () {
            mostrarToast('Projeto selecionado: ' + cartoes[i].dataset.nome);
        });
    }
}

// Monta a lista de membros da equipe
function montarEquipe(usuarios) {
    let lista = document.getElementById('team-list');
    let html = '';

    if (usuarios.length === 0) {
        lista.innerHTML = '<p class="nota-demo">Nenhum usuário cadastrado.</p>';
    } else {
        for (let i = 0; i < usuarios.length; i++) {
            let usuario = usuarios[i];
            let cor = CORES_DO_AVATAR[i % CORES_DO_AVATAR.length];
            let classeDoAvatar = 'avatar';

            if (cor !== '') {
                classeDoAvatar = 'avatar ' + cor;
            }

            html = html + '<div>';
            html = html + '<div class="' + classeDoAvatar + '">' + escaparHtml(iniciais(usuario.nome)) + '</div>';
            html = html + '<b>' + escaparHtml(usuario.nome) + '</b>';
            html = html + '<span>' + escaparHtml(usuario.perfil) + '</span>';
            html = html + '<span class="status success">Ativo</span>';
            html = html + '</div>';
        }

        lista.innerHTML = html;
    }

    document.getElementById('team-total').textContent = usuarios.length + ' membros';
}

// Busca os projetos, as demandas e os usuarios na API
async function carregarTela() {
    let aviso = document.getElementById('projects-aviso');
    aviso.textContent = 'Carregando dados da API...';
    aviso.style.color = '';

    let resultadoProjetos = await requisitar('GET', '/projetos');

    if (resultadoProjetos.ok === false) {
        aviso.textContent = mensagemDeErro(resultadoProjetos);
        aviso.style.color = '#f87171';
        mostrarToast('Não foi possível carregar os projetos.');
        return;
    }

    let resultadoDemandas = await requisitar('GET', '/demandas');
    let demandas = [];

    if (resultadoDemandas.ok === true) {
        demandas = resultadoDemandas.dados.demandas;
    }

    montarProjetos(resultadoProjetos.dados.projetos, contarDemandasPorProjeto(demandas));

    let resultadoUsuarios = await requisitar('GET', '/usuarios');

    if (resultadoUsuarios.ok === true) {
        montarEquipe(resultadoUsuarios.dados.usuarios);
    } else {
        aviso.textContent = mensagemDeErro(resultadoUsuarios);
        aviso.style.color = '#f87171';
        mostrarToast('Não foi possível carregar a equipe.');
        return;
    }

    aviso.textContent = 'Dados carregados da API (Oracle).';
}

// Comeca a tela somente se o usuario estiver logado
if (exigirSessao() === true) {
    configurarNavegacao();
    preencherPerfil();
    abrirPagina('projects');

    let botaoPesquisa = document.getElementById('top-search');
    if (botaoPesquisa != null) {
        botaoPesquisa.addEventListener('click', function () {
            window.location.href = '../03-demandas/index.html';
        });
    }

    let botaoConfiguracoes = document.getElementById('settings-btn');
    if (botaoConfiguracoes != null) {
        botaoConfiguracoes.addEventListener('click', function () {
            mostrarToast('As configurações não fazem parte desta versão.');
        });
    }

    carregarTela();
}
