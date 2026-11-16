// app.js — PI2 / Time 27
// Autor: Pietro Granzotti

// Tela de listagem de demandas (03). A busca, os filtros e a ordenacao
// sao enviados para a API (GET /demandas), que consulta o Oracle.
// Clicar em uma linha abre a tela de detalhes (06) com o id na URL.

// Guarda o temporizador da busca (para nao chamar a API a cada letra)
let temporizadorDaBusca = null;

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

// Classe css do status
function classeDoStatus(status) {
    if (status === 'Concluída') {
        return 'success';
    }
    if (status === 'Cancelada') {
        return 'danger';
    }
    if (status === 'Em revisão' || status === 'Em andamento') {
        return 'info';
    }
    return 'neutral';
}

// Coloca uma opcao nova dentro de um select
function adicionarOpcao(select, valor) {
    let opcao = document.createElement('option');
    opcao.value = valor;
    opcao.textContent = valor;
    select.appendChild(opcao);
}

// Busca os usuarios e os projetos para completar os filtros
async function carregarFiltros() {
    let resultadoUsuarios = await requisitar('GET', '/usuarios');

    if (resultadoUsuarios.ok === true) {
        let selectDono = document.getElementById('filter-owner');
        let usuarios = resultadoUsuarios.dados.usuarios;

        for (let i = 0; i < usuarios.length; i++) {
            adicionarOpcao(selectDono, usuarios[i].nome);
        }
    }

    let resultadoProjetos = await requisitar('GET', '/projetos');

    if (resultadoProjetos.ok === true) {
        let selectProjeto = document.getElementById('filter-project');
        let projetos = resultadoProjetos.dados.projetos;

        for (let i = 0; i < projetos.length; i++) {
            adicionarOpcao(selectProjeto, projetos[i].nome);
        }
    }
}

// Monta o endereco da API com os filtros escolhidos na tela
function montarConsulta() {
    let partes = [];

    let busca = document.getElementById('search-demand').value.trim();
    if (busca !== '') {
        partes.push('busca=' + encodeURIComponent(busca));
    }

    let status = document.getElementById('filter-status').value;
    if (status !== '') {
        partes.push('status=' + encodeURIComponent(status));
    }

    let prioridade = document.getElementById('filter-priority').value;
    if (prioridade !== '') {
        partes.push('prioridade=' + encodeURIComponent(prioridade));
    }

    let tipo = document.getElementById('filter-type').value;
    if (tipo !== '') {
        partes.push('tipo=' + encodeURIComponent(tipo));
    }

    let responsavel = document.getElementById('filter-owner').value;
    if (responsavel !== '') {
        partes.push('responsavel=' + encodeURIComponent(responsavel));
    }

    let projeto = document.getElementById('filter-project').value;
    if (projeto !== '') {
        partes.push('projeto=' + encodeURIComponent(projeto));
    }

    let ordenar = document.getElementById('sort-demand').value;
    if (ordenar !== '') {
        partes.push('ordenar=' + encodeURIComponent(ordenar));
    }

    if (partes.length === 0) {
        return '/demandas';
    }

    return '/demandas?' + partes.join('&');
}

// Desenha as linhas da tabela com as demandas que vieram da API
function montarTabela(lista) {
    let corpoTabela = document.getElementById('demand-rows');
    let aviso = document.getElementById('demands-aviso');

    document.getElementById('result-count').textContent = lista.length + ' demanda(s) encontrada(s)';
    aviso.textContent = 'Dados carregados da API (Oracle).';

    if (lista.length === 0) {
        corpoTabela.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#94a3b8">Nenhuma demanda encontrada para os filtros selecionados.</td></tr>';
        return;
    }

    let html = '';

    for (let i = 0; i < lista.length; i++) {
        let demanda = lista[i];

        let prazoTexto = 'Não definido';
        if (demanda.prazo !== '') {
            prazoTexto = dataParaTela(demanda.prazo);
        }

        html = html + '<tr data-id="' + escaparHtml(demanda.id) + '">';
        html = html + '<td class="demand-name"><b>' + escaparHtml(demanda.titulo) + '</b><small>' + escaparHtml(demanda.id) + '</small></td>';
        html = html + '<td>' + escaparHtml(demanda.tipo) + '</td>';
        html = html + '<td><span class="priority ' + classeDaPrioridade(demanda.prioridade) + '">' + escaparHtml(demanda.prioridade) + '</span></td>';
        html = html + '<td><span class="status ' + classeDoStatus(demanda.status) + '">' + escaparHtml(demanda.status) + '</span></td>';
        html = html + '<td>' + escaparHtml(demanda.projeto) + '</td>';
        html = html + '<td>' + escaparHtml(demanda.responsavel) + '</td>';
        html = html + '<td>' + dataParaTela(demanda.criadaEm) + '</td>';
        html = html + '<td>' + prazoTexto + '</td>';
        html = html + '</tr>';
    }

    corpoTabela.innerHTML = html;

    // Cada linha leva para a tela de detalhes daquela demanda
    let linhas = document.querySelectorAll('#demand-rows tr[data-id]');
    for (let i = 0; i < linhas.length; i++) {
        linhas[i].addEventListener('click', function () {
            let id = linhas[i].dataset.id;
            window.location.href = '../06-detalhes-demanda/index.html?id=' + encodeURIComponent(id);
        });
    }
}

// Busca as demandas na API usando os filtros atuais
async function carregarDemandas() {
    let aviso = document.getElementById('demands-aviso');
    aviso.textContent = 'Carregando demandas...';
    aviso.style.color = '';

    let resultado = await requisitar('GET', montarConsulta());

    if (resultado.ok === false) {
        document.getElementById('result-count').textContent = '0 demanda(s)';
        document.getElementById('demand-rows').innerHTML = '';
        aviso.textContent = mensagemDeErro(resultado);
        aviso.style.color = '#f87171';
        mostrarToast('Não foi possível carregar as demandas.');
        return;
    }

    montarTabela(resultado.dados.demandas);
}

// Espera o usuario parar de digitar antes de chamar a API
function buscarComEspera() {
    if (temporizadorDaBusca != null) {
        clearTimeout(temporizadorDaBusca);
    }

    temporizadorDaBusca = setTimeout(function () {
        carregarDemandas();
    }, 300);
}

// Comeca a tela somente se o usuario estiver logado
if (exigirSessao() === true) {
    configurarNavegacao();
    preencherPerfil();
    abrirPagina('demands');

    document.getElementById('search-demand').addEventListener('input', buscarComEspera);
    document.getElementById('filter-status').addEventListener('change', carregarDemandas);
    document.getElementById('filter-priority').addEventListener('change', carregarDemandas);
    document.getElementById('filter-type').addEventListener('change', carregarDemandas);
    document.getElementById('filter-owner').addEventListener('change', carregarDemandas);
    document.getElementById('filter-project').addEventListener('change', carregarDemandas);
    document.getElementById('sort-demand').addEventListener('change', carregarDemandas);

    let botaoPesquisa = document.getElementById('top-search');
    if (botaoPesquisa != null) {
        botaoPesquisa.addEventListener('click', function () {
            document.getElementById('search-demand').focus();
        });
    }

    let botaoConfiguracoes = document.getElementById('settings-btn');
    if (botaoConfiguracoes != null) {
        botaoConfiguracoes.addEventListener('click', function () {
            mostrarToast('As configurações não fazem parte desta versão.');
        });
    }

    carregarFiltros();
    carregarDemandas();
}
