// app.js — PI2 / Time 27
// Autor: Nicholas de Castro

// Tela de detalhes da demanda (06). Ela recebe o id pela URL (?id=DEM-001)
// e busca tudo na API: a demanda (GET /demandas/:id), os comentarios
// (GET /demandas/:id/comentarios) e o historico (GET /demandas/:id/historico).
// Nesta tela tambem da para mudar o status (PATCH /demandas/:id/status),
// cancelar com motivo (POST /demandas/:id/cancelar) e escrever comentarios
// (POST /demandas/:id/comentarios). Os erros da API aparecem na tela.

let demandaAtual = null;
let idDaDemanda = '';

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

// Mostra o erro geral no topo da tela de detalhes
function mostrarErroGeral(mensagem) {
    let caixa = document.getElementById('detail-error');
    caixa.textContent = mensagem;
    caixa.classList.add('show');
}

// Esconde o erro geral
function limparErroGeral() {
    let caixa = document.getElementById('detail-error');
    caixa.textContent = '';
    caixa.classList.remove('show');
}

// Pega o id que veio na URL (?id=DEM-001)
function idDaUrl() {
    let parametros = new URLSearchParams(window.location.search);
    let id = parametros.get('id');

    if (id === null || id === '') {
        return '';
    }

    return id;
}

// Preenche o topo e o cartao principal com a demanda que veio da API
function preencherDemanda(demanda) {
    demandaAtual = demanda;

    document.getElementById('detail-id').textContent = demanda.id;
    document.getElementById('detail-title').textContent = demanda.titulo;
    document.getElementById('detail-subtitle').textContent =
        'Criada em ' + dataParaTela(demanda.criadaEm) +
        ' · Atualizada em ' + dataParaTela(demanda.atualizadaEm);

    document.getElementById('detail-description').textContent = demanda.descricao;
    document.getElementById('detail-project').textContent = demanda.projeto;
    document.getElementById('detail-owner').textContent = demanda.responsavel;

    if (demanda.prazo === '') {
        document.getElementById('detail-due').textContent = 'Não definido';
    } else {
        document.getElementById('detail-due').textContent = dataParaTela(demanda.prazo);
    }

    document.getElementById('detail-created').textContent = dataParaTela(demanda.criadaEm);

    let status = document.getElementById('detail-status');
    status.textContent = demanda.status;
    status.className = 'status ' + classeDoStatus(demanda.status);

    let prioridade = document.getElementById('detail-priority');
    prioridade.textContent = demanda.prioridade;
    prioridade.className = 'priority ' + classeDaPrioridade(demanda.prioridade);

    document.getElementById('detail-type').textContent = demanda.tipo;

    preencherCancelamento(demanda);
    montarBotoesDeStatus(demanda);
    ajustarBotoesDoTopo(demanda);
}

// Mostra o motivo, quem cancelou e quando (só quando está cancelada)
function preencherCancelamento(demanda) {
    let caixa = document.getElementById('detail-cancel-info');

    if (demanda.status !== 'Cancelada') {
        caixa.style.display = 'none';
        caixa.innerHTML = '';
        return;
    }

    let motivo = demanda.motivoCancelamento;
    if (motivo === '') {
        motivo = 'Motivo não informado.';
    }

    caixa.style.display = 'block';
    caixa.innerHTML = '<b>Demanda cancelada</b>' +
        '<p>' + escaparHtml(motivo) + '</p>' +
        '<small>Cancelada por ' + escaparHtml(demanda.canceladaPor) +
        ' em ' + dataHoraParaTela(demanda.canceladaEm) + '</small>';
}

// Lista as mudancas de status que o usuario logado pode pedir.
// Quem decide de verdade e a API; aqui so montamos os botoes.
function transicoesPermitidas(usuario, demanda) {
    let lista = [];

    if (usuario == null) {
        return lista;
    }

    // Membro da equipe so avanca a propria demanda
    if (usuario.perfil === 'Membro da Equipe') {
        if (demanda.responsavel !== usuario.nome) {
            return lista;
        }

        if (demanda.status === 'Aberta') {
            lista.push('Em andamento');
        }

        if (demanda.status === 'Em andamento') {
            lista.push('Em revisão');
        }

        return lista;
    }

    // Administrador e lider seguem o fluxo completo
    if (demanda.status === 'Aberta') {
        lista.push('Em andamento');
    }

    if (demanda.status === 'Em andamento') {
        lista.push('Em revisão');
    }

    if (demanda.status === 'Em revisão') {
        lista.push('Concluída');
        lista.push('Em andamento');
    }

    return lista;
}

// Texto que aparece no botao de status
function textoDoStatus(status) {
    if (status === 'Em revisão') {
        return 'Enviar para revisão';
    }

    if (status === 'Concluída') {
        return 'Concluir ✓';
    }

    return status;
}

// Monta os botoes de mudanca de status conforme o perfil e o status atual
function montarBotoesDeStatus(demanda) {
    let area = document.getElementById('status-actions');
    let erro = document.getElementById('status-error');
    let usuario = lerUsuario();

    erro.textContent = '';
    erro.classList.remove('show');

    if (demanda.status === 'Concluída' || demanda.status === 'Cancelada') {
        area.innerHTML = '<p class="field-help">Esta demanda está encerrada e não permite mais mudança de status.</p>';
        return;
    }

    let permitidas = transicoesPermitidas(usuario, demanda);

    if (permitidas.length === 0) {
        area.innerHTML = '<p class="field-help">Seu perfil não pode alterar o status desta demanda.</p>';
        return;
    }

    let html = '';

    for (let i = 0; i < permitidas.length; i++) {
        html = html + '<button type="button" class="btn secondary" data-status="' +
            escaparHtml(permitidas[i]) + '">' + textoDoStatus(permitidas[i]) + '</button>';
    }

    area.innerHTML = html;

    let botoes = area.querySelectorAll('[data-status]');
    for (let i = 0; i < botoes.length; i++) {
        botoes[i].addEventListener('click', function () {
            mudarStatus(botoes[i].dataset.status);
        });
    }
}

// Mostra ou esconde os botoes de editar e cancelar do topo
function ajustarBotoesDoTopo(demanda) {
    let usuario = lerUsuario();
    let botaoEditar = document.getElementById('edit-demand');
    let botaoCancelar = document.getElementById('cancel-demand');

    botaoEditar.style.display = '';
    botaoCancelar.style.display = '';

    // Membro da equipe nao edita nem cancela (a API tambem bloqueia)
    if (usuario != null && usuario.perfil === 'Membro da Equipe') {
        botaoEditar.style.display = 'none';
        botaoCancelar.style.display = 'none';
    }

    if (demanda.status === 'Cancelada') {
        botaoEditar.style.display = 'none';
        botaoCancelar.style.display = 'none';
    }

    // Demanda concluida ainda pode ser editada, mas nao cancelada
    if (demanda.status === 'Concluída') {
        botaoCancelar.style.display = 'none';
    }
}

// Muda o status da demanda na API
async function mudarStatus(novoStatus) {
    if (demandaAtual == null) {
        return;
    }

    let erro = document.getElementById('status-error');
    erro.textContent = '';
    erro.classList.remove('show');

    let resultado = await requisitar(
        'PATCH',
        '/demandas/' + encodeURIComponent(demandaAtual.id) + '/status',
        { status: novoStatus }
    );

    if (resultado.ok === false) {
        erro.textContent = mensagemDeErro(resultado);
        erro.classList.add('show');
        mostrarToast('Não foi possível mudar o status.');
        return;
    }

    mostrarToast(resultado.dados.mensagem);
    await carregarTudo();
}

// Abre a caixinha para escrever o motivo do cancelamento
function abrirCaixaDeCancelamento() {
    let caixa = document.getElementById('cancel-box');
    caixa.classList.add('show');

    let erro = document.getElementById('cancel-error');
    erro.textContent = '';
    erro.classList.remove('show');

    document.getElementById('cancel-reason').focus();
}

// Fecha a caixinha de cancelamento sem cancelar nada
function fecharCaixaDeCancelamento() {
    let caixa = document.getElementById('cancel-box');
    caixa.classList.remove('show');
    document.getElementById('cancel-reason').value = '';
}

// Envia o cancelamento para a API com o motivo escrito
async function confirmarCancelamento() {
    if (demandaAtual == null) {
        return;
    }

    let campo = document.getElementById('cancel-reason');
    let erro = document.getElementById('cancel-error');
    let motivo = campo.value.trim();

    erro.textContent = '';
    erro.classList.remove('show');

    if (motivo.length < 3) {
        erro.textContent = 'Escreva o motivo do cancelamento (no mínimo 3 caracteres).';
        erro.classList.add('show');
        campo.focus();
        return;
    }

    if (motivo.length > 500) {
        erro.textContent = 'O motivo deve ter no máximo 500 caracteres.';
        erro.classList.add('show');
        campo.focus();
        return;
    }

    let botao = document.getElementById('cancel-confirm');
    botao.disabled = true;
    botao.textContent = 'Cancelando...';

    let resultado = await requisitar(
        'POST',
        '/demandas/' + encodeURIComponent(demandaAtual.id) + '/cancelar',
        { motivo: motivo }
    );

    botao.disabled = false;
    botao.textContent = 'Confirmar cancelamento';

    if (resultado.ok === false) {
        erro.textContent = mensagemDeErro(resultado);
        erro.classList.add('show');
        mostrarToast('Não foi possível cancelar a demanda.');
        return;
    }

    fecharCaixaDeCancelamento();
    mostrarToast(resultado.dados.mensagem);
    await carregarTudo();
}

// Busca os comentarios da demanda e monta a lista
async function carregarComentarios() {
    let area = document.getElementById('comments');
    let resultado = await requisitar(
        'GET',
        '/demandas/' + encodeURIComponent(idDaDemanda) + '/comentarios'
    );

    if (resultado.ok === false) {
        area.innerHTML = '<p class="field-help">' + escaparHtml(mensagemDeErro(resultado)) + '</p>';
        return;
    }

    let lista = resultado.dados.comentarios;

    if (lista.length === 0) {
        area.innerHTML = '<p class="field-help">Nenhum comentário ainda. Seja o primeiro a escrever.</p>';
        return;
    }

    // A API devolve do mais antigo para o mais novo; aqui mostramos
    // o mais novo primeiro, igual ao protótipo.
    let html = '';

    for (let i = lista.length - 1; i >= 0; i--) {
        let comentario = lista[i];

        html = html + '<div class="comment">';
        html = html + '<div class="avatar">' + escaparHtml(iniciais(comentario.autor)) + '</div>';
        html = html + '<div><b>' + escaparHtml(comentario.autor) + '</b>';
        html = html + '<small>' + dataHoraParaTela(comentario.data) + '</small>';
        html = html + '<p>' + escaparHtml(comentario.texto) + '</p></div>';
        html = html + '</div>';
    }

    area.innerHTML = html;
}

// Monta o texto que aparece embaixo de cada item do historico
function textoDoHistorico(item) {
    if (item.campo !== '' && item.valorAnterior !== '' && item.valorNovo !== '') {
        return item.valorAnterior + ' → ' + item.valorNovo;
    }

    if (item.campo !== '' && item.valorNovo !== '') {
        return item.campo + ': ' + item.valorNovo;
    }

    if (item.observacao !== '') {
        return item.observacao;
    }

    return item.campo;
}

// Busca o historico da demanda e monta a linha do tempo
async function carregarHistorico() {
    let area = document.getElementById('history');
    let resultado = await requisitar(
        'GET',
        '/demandas/' + encodeURIComponent(idDaDemanda) + '/historico'
    );

    if (resultado.ok === false) {
        area.innerHTML = '<p class="field-help">' + escaparHtml(mensagemDeErro(resultado)) + '</p>';
        return;
    }

    let lista = resultado.dados.historico;

    if (lista.length === 0) {
        area.innerHTML = '<p class="field-help">Nenhuma alteração registrada.</p>';
        return;
    }

    let html = '';

    for (let i = 0; i < lista.length; i++) {
        let item = lista[i];

        html = html + '<div><i></i>';
        html = html + '<b>' + escaparHtml(item.acao) + '</b>';
        html = html + '<p>' + escaparHtml(textoDoHistorico(item)) + '</p>';
        html = html + '<small>' + escaparHtml(item.usuario) + ' · ' + dataHoraParaTela(item.data) + '</small>';
        html = html + '</div>';
    }

    area.innerHTML = html;
}

// Envia um comentario novo para a API
async function enviarComentario(evento) {
    evento.preventDefault();

    let campo = document.getElementById('comment-text');
    let erro = document.getElementById('comment-error');
    let texto = campo.value.trim();

    erro.textContent = '';
    erro.classList.remove('show');

    if (texto.length < 3) {
        erro.textContent = 'O comentário deve ter no mínimo 3 caracteres.';
        erro.classList.add('show');
        campo.focus();
        return;
    }

    if (texto.length > 500) {
        erro.textContent = 'O comentário não pode exceder 500 caracteres.';
        erro.classList.add('show');
        campo.focus();
        return;
    }

    let botao = document.querySelector('#comment-form button');
    botao.disabled = true;
    botao.textContent = 'Enviando...';

    let resultado = await requisitar(
        'POST',
        '/demandas/' + encodeURIComponent(idDaDemanda) + '/comentarios',
        { texto: texto }
    );

    botao.disabled = false;
    botao.textContent = 'Adicionar comentário';

    if (resultado.ok === false) {
        erro.textContent = mensagemDeErro(resultado);
        erro.classList.add('show');
        mostrarToast('Não foi possível enviar o comentário.');
        return;
    }

    campo.value = '';
    mostrarToast(resultado.dados.mensagem);
    await carregarComentarios();
}

// Carrega a demanda, os comentarios e o historico de uma vez
async function carregarTudo() {
    limparErroGeral();

    let resultado = await requisitar('GET', '/demandas/' + encodeURIComponent(idDaDemanda));

    if (resultado.ok === false) {
        mostrarErroGeral(mensagemDeErro(resultado));
        document.getElementById('detail-id').textContent = '—';
        document.getElementById('detail-title').textContent = 'Demanda não encontrada';
        document.getElementById('detail-subtitle').textContent = 'Volte para a listagem e escolha outra demanda.';
        document.getElementById('edit-demand').style.display = 'none';
        document.getElementById('cancel-demand').style.display = 'none';
        document.getElementById('status-actions').innerHTML = '';
        document.getElementById('comments').innerHTML = '';
        document.getElementById('history').innerHTML = '';
        mostrarToast('Não foi possível carregar a demanda.');
        return;
    }

    preencherDemanda(resultado.dados.demanda);
    await carregarComentarios();
    await carregarHistorico();
}

// Comeca a tela somente se o usuario estiver logado
if (exigirSessao() === true) {
    configurarNavegacao();
    preencherPerfil();
    abrirPagina('detail');

    idDaDemanda = idDaUrl();

    if (idDaDemanda === '') {
        mostrarErroGeral('Nenhuma demanda foi escolhida. Abra a listagem e clique em uma demanda.');
        document.getElementById('detail-title').textContent = 'Nenhuma demanda selecionada';
        document.getElementById('detail-subtitle').textContent = 'Use o menu Demandas para escolher uma demanda.';
        document.getElementById('edit-demand').style.display = 'none';
        document.getElementById('cancel-demand').style.display = 'none';
    } else {
        document.getElementById('edit-demand').addEventListener('click', function () {
            window.location.href = '../05-cadastro-demanda/index.html?id=' + encodeURIComponent(idDaDemanda);
        });

        document.getElementById('cancel-demand').addEventListener('click', abrirCaixaDeCancelamento);
        document.getElementById('cancel-back').addEventListener('click', fecharCaixaDeCancelamento);
        document.getElementById('cancel-confirm').addEventListener('click', confirmarCancelamento);
        document.getElementById('comment-form').addEventListener('submit', enviarComentario);

        carregarTudo();
    }

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
}
