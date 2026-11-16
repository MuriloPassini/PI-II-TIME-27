// app.js — PI2 / Time 27
// Autor: Cauã Leite

// Tela do quadro kanban (04). Busca as demandas na API (GET /demandas)
// e separa os cartoes por status. O botao "Avancar" muda o status pela
// rota PATCH /demandas/:id/status, respeitando o fluxo do trabalho.
// Clicar no cartao abre a tela de detalhes (06).

const STATUS_DO_QUADRO = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];

// Mostra uma mensagem rapida no canto da tela
function mostrarToast(mensagem) {
    let toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');

    setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}

// Classe css da prioridade
function classeDaPrioridade(prioridade) {
    if (prioridade === 'Crítica') {
        return 'critical';
    }
    if (prioridade === 'Alta') {
        return 'high';
    }
    if (prioridade === 'Média') {
        return 'medium';
    }
    return 'low';
}

// Qual e o proximo status do fluxo (vazio quando nao tem proximo)
function proximoStatus(status) {
    if (status === 'Aberta') {
        return 'Em andamento';
    }
    if (status === 'Em andamento') {
        return 'Em revisão';
    }
    if (status === 'Em revisão') {
        return 'Concluída';
    }
    return '';
}

// Texto do botao de avancar
function textoDoBotao(status) {
    if (status === 'Em revisão') {
        return 'Concluir ✓';
    }
    return 'Avançar →';
}

// Confere se o usuario logado pode avancar o status desta demanda.
// Quem decide de verdade e a API; aqui so evitamos mostrar botao a toa.
function podeAvancar(usuario, demanda) {
    if (usuario == null) {
        return false;
    }

    let proximo = proximoStatus(demanda.status);
    if (proximo === '') {
        return false;
    }

    if (usuario.perfil === 'Membro da Equipe') {
        if (demanda.responsavel !== usuario.nome) {
            return false;
        }
        return demanda.status === 'Aberta' || demanda.status === 'Em andamento';
    }

    return true;
}

// Muda o status de uma demanda na API e recarrega o quadro
async function avancarStatus(id, novoStatus) {
    let resultado = await requisitar(
        'PATCH',
        '/demandas/' + encodeURIComponent(id) + '/status',
        { status: novoStatus }
    );

    if (resultado.ok === false) {
        mostrarToast(mensagemDeErro(resultado));
        return;
    }

    mostrarToast('Status alterado para "' + novoStatus + '".');
    carregarKanban();
}

// Monta as colunas do quadro separando as demandas por status
function montarKanban(lista) {
    let quadro = document.getElementById('kanban-board');
    let usuario = lerUsuario();
    let html = '';

    for (let i = 0; i < STATUS_DO_QUADRO.length; i++) {
        let status = STATUS_DO_QUADRO[i];
        let cartoes = '';
        let quantidade = 0;

        for (let j = 0; j < lista.length; j++) {
            let demanda = lista[j];

            if (demanda.status === status) {
                quantidade = quantidade + 1;

                cartoes = cartoes + '<div class="kanban-card" data-id="' + escaparHtml(demanda.id) + '">';
                cartoes = cartoes + '<small>' + escaparHtml(demanda.id) + ' · ' + escaparHtml(demanda.projeto) + '</small>';
                cartoes = cartoes + '<b>' + escaparHtml(demanda.titulo) + '</b>';
                cartoes = cartoes + '<div class="card-foot">';
                cartoes = cartoes + '<span class="priority ' + classeDaPrioridade(demanda.prioridade) + '">' + escaparHtml(demanda.prioridade) + '</span>';
                cartoes = cartoes + '<small>' + escaparHtml(demanda.responsavel) + '</small>';
                cartoes = cartoes + '</div>';

                if (podeAvancar(usuario, demanda) === true) {
                    cartoes = cartoes + '<button type="button" class="btn-avancar" data-id="' + escaparHtml(demanda.id) + '" data-next="' + escaparHtml(proximoStatus(demanda.status)) + '">' + textoDoBotao(demanda.status) + '</button>';
                }

                cartoes = cartoes + '</div>';
            }
        }

        if (quantidade === 0) {
            cartoes = '<small style="color:#64748b">Sem demandas neste estágio</small>';
        }

        html = html + '<div class="kanban-column">';
        html = html + '<div class="column-title">' + status + '<span>' + quantidade + '</span></div>';
        html = html + cartoes;
        html = html + '</div>';
    }

    quadro.innerHTML = html;

    // Clique nos cartoes: abre a tela de detalhes
    let cartoesDoQuadro = document.querySelectorAll('.kanban-card');
    for (let i = 0; i < cartoesDoQuadro.length; i++) {
        cartoesDoQuadro[i].addEventListener('click', function () {
            let id = cartoesDoQuadro[i].dataset.id;
            window.location.href = '../06-detalhes-demanda/index.html?id=' + encodeURIComponent(id);
        });
    }

    // Clique no botao de avancar: muda o status (sem abrir os detalhes)
    let botoesAvancar = document.querySelectorAll('.btn-avancar');
    for (let i = 0; i < botoesAvancar.length; i++) {
        botoesAvancar[i].addEventListener('click', function (evento) {
            evento.stopPropagation();
            avancarStatus(botoesAvancar[i].dataset.id, botoesAvancar[i].dataset.next);
        });
    }
}

// Busca as demandas na API e monta o quadro
async function carregarKanban() {
    let aviso = document.getElementById('kanban-aviso');
    aviso.textContent = 'Carregando demandas...';
    aviso.style.color = '';

    let resultado = await requisitar('GET', '/demandas?ordenar=prioridade');

    if (resultado.ok === false) {
        document.getElementById('kanban-board').innerHTML = '';
        aviso.textContent = mensagemDeErro(resultado);
        aviso.style.color = '#f87171';
        mostrarToast('Não foi possível carregar o quadro.');
        return;
    }

    montarKanban(resultado.dados.demandas);
    aviso.textContent = 'Dados carregados da API (Oracle). Clique em um cartão para ver os detalhes.';
}

// Comeca a tela somente se o usuario estiver logado
if (exigirSessao() === true) {
    configurarNavegacao();
    preencherPerfil();
    abrirPagina('kanban');

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

    carregarKanban();
}
