// app.js — PI2 / Time 27
// Autor: Filipe Sampaio

// Tela do dashboard (02). Busca o resumo na API (GET /dashboard) e
// preenche os cartoes, os graficos de barras e as duas listas.
// Os numeros nao ficam mais fixos no HTML: todos vem do Oracle.
// Se a API responder com erro, a mensagem dela aparece na tela.

const MESES_CURTOS = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

// Mostra uma mensagem rapida no canto da tela
function mostrarToast(mensagem) {
    let toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');

    setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}

// Devolve a largura da barra em porcentagem (o maior valor vira 100%)
function larguraDaBarra(valor, maior) {
    if (maior <= 0) {
        return '0%';
    }
    return Math.round((valor / maior) * 100) + '%';
}

// Transforma AAAA-MM-DD em "08 nov."
function dataCurta(data) {
    if (data == null || data === '') {
        return '';
    }

    let partes = String(data).split('-');
    if (partes.length !== 3) {
        return String(data);
    }

    return partes[2] + ' ' + MESES_CURTOS[Number(partes[1]) - 1];
}

// Descobre o maior numero entre os valores de um objeto de contagem
function maiorValor(contagem, chaves) {
    let maior = 0;

    for (let i = 0; i < chaves.length; i++) {
        let valor = contagem[chaves[i]];
        if (valor > maior) {
            maior = valor;
        }
    }

    return maior;
}

// Preenche os cartoes de cima (total e um por status)
function preencherCartoes(dados) {
    document.getElementById('stat-total').textContent = dados.total;
    document.getElementById('stat-abertas').textContent = dados.porStatus['Aberta'];
    document.getElementById('stat-andamento').textContent = dados.porStatus['Em andamento'];
    document.getElementById('stat-revisao').textContent = dados.porStatus['Em revisão'];
    document.getElementById('stat-concluidas').textContent = dados.porStatus['Concluída'];
    document.getElementById('stat-canceladas').textContent = dados.porStatus['Cancelada'];
}

// Preenche os dois graficos de barras (prioridade e tipo)
function preencherBarras(dados) {
    let prioridades = ['Crítica', 'Alta', 'Média', 'Baixa'];
    let chavesPrioridade = ['critica', 'alta', 'media', 'baixa'];
    let maiorPrioridade = maiorValor(dados.porPrioridade, prioridades);

    for (let i = 0; i < prioridades.length; i++) {
        let valor = dados.porPrioridade[prioridades[i]];
        document.getElementById('prio-' + chavesPrioridade[i]).textContent = valor;
        document.getElementById('bar-prio-' + chavesPrioridade[i]).style.width = larguraDaBarra(valor, maiorPrioridade);
    }

    let tipos = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
    let chavesTipo = ['tarefa', 'defeito', 'melhoria', 'documentacao'];
    let maiorTipo = maiorValor(dados.porTipo, tipos);

    for (let i = 0; i < tipos.length; i++) {
        let valor = dados.porTipo[tipos[i]];
        document.getElementById('tipo-' + chavesTipo[i]).textContent = valor;
        document.getElementById('bar-tipo-' + chavesTipo[i]).style.width = larguraDaBarra(valor, maiorTipo);
    }

    document.getElementById('total-prioridade').textContent = dados.total + ' demandas';
}

// Monta a lista de demandas criticas em aberto
function preencherCriticas(dados) {
    let lista = document.getElementById('critical-list');
    let html = '';

    if (dados.criticas.length === 0) {
        lista.innerHTML = '<div><div><b>Nenhuma demanda crítica em aberto</b><small>Tudo sob controle por aqui.</small></div></div>';
    } else {
        for (let i = 0; i < dados.criticas.length; i++) {
            let demanda = dados.criticas[i];
            html = html + '<div><div><b>' + escaparHtml(demanda.titulo) + '</b>' +
                '<small>' + escaparHtml(demanda.id) + ' · ' + escaparHtml(demanda.projeto) + '</small></div>' +
                '<span class="priority critical">Crítica</span></div>';
        }
        lista.innerHTML = html;
    }

    document.getElementById('criticas-total').textContent = dados.criticasEmAberto + ' críticas';
}

// Monta a lista de proximas entregas (prazo nos proximos 7 dias)
function preencherProximas(dados) {
    let lista = document.getElementById('proximas-list');
    let html = '';

    if (dados.proximas.length === 0) {
        lista.innerHTML = '<div><div><b>Nenhum prazo nos próximos 7 dias</b><small>Sem entregas apertadas no momento.</small></div></div>';
    } else {
        for (let i = 0; i < dados.proximas.length; i++) {
            let demanda = dados.proximas[i];
            html = html + '<div><div><b>' + escaparHtml(demanda.titulo) + '</b>' +
                '<small>' + escaparHtml(demanda.id) + ' · ' + escaparHtml(demanda.responsavel) + '</small></div>' +
                '<time>' + dataCurta(demanda.prazo) + '</time></div>';
        }
        lista.innerHTML = html;
    }

    document.getElementById('proximas-total').textContent = dados.proximasDoPrazo + ' próximas';
}

// Busca o resumo na API e preenche a tela
async function carregarPainel() {
    let aviso = document.getElementById('dashboard-aviso');
    aviso.textContent = 'Carregando dados da API...';
    aviso.style.color = '';

    let resultado = await requisitar('GET', '/dashboard');

    if (resultado.ok === false) {
        aviso.textContent = mensagemDeErro(resultado);
        aviso.style.color = '#f87171';
        mostrarToast('Não foi possível carregar o dashboard.');
        return;
    }

    let dados = resultado.dados;

    preencherCartoes(dados);
    preencherBarras(dados);
    preencherCriticas(dados);
    preencherProximas(dados);

    aviso.textContent = 'Dados carregados da API (Oracle). Atualizado agora.';
}

// Comeca a tela somente se o usuario estiver logado
if (exigirSessao() === true) {
    configurarNavegacao();
    preencherPerfil();
    abrirPagina('dashboard');

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

    carregarPainel();
}
