// app.js — PI2 / Time 27
// Autor: Matheus Schiavinato

// Tela de cadastro de demanda (05).
// - Carrega os projetos (GET /projetos) e os usuarios (GET /usuarios).
// - Se a URL tiver ?id=DEM-xxx, entra em modo de edicao (GET /demandas/:id).
// - Antes de salvar, confere o prazo na API de feriados (GET /feriados/verificar).
// - Salva com POST /demandas (cadastro) ou PATCH /demandas/:id (edicao).
// As mensagens de erro da API aparecem no topo do formulario.

const TIPOS_VALIDOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
const PRIORIDADES_VALIDAS = ['Crítica', 'Alta', 'Média', 'Baixa'];

let idEmEdicao = null;

// Mostra uma mensagem rapida no canto da tela
function mostrarToast(mensagem) {
    let toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');

    setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}

// Marca o campo em vermelho e mostra a mensagem de erro embaixo dele
function mostrarErro(campo, erro, mensagem) {
    campo.classList.remove('is-valid');
    campo.classList.add('is-invalid');
    erro.textContent = mensagem;
    erro.classList.add('show');
}

// Tira o erro do campo quando ele fica valido
function limparErro(campo, erro) {
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    erro.textContent = '';
    erro.classList.remove('show');
}

// Mostra o erro geral da API no topo do formulario
function mostrarErroGeral(mensagem) {
    let caixa = document.getElementById('form-error');
    caixa.textContent = mensagem;
    caixa.classList.add('show');
}

// Esconde o erro geral
function limparErroGeral() {
    let caixa = document.getElementById('form-error');
    caixa.textContent = '';
    caixa.classList.remove('show');
}

// Devolve a data de hoje no formato AAAA-MM-DD
function dataDeHojeNoCampo() {
    let hoje = new Date();
    let mes = hoje.getMonth() + 1;
    let dia = hoje.getDate();
    let mesTexto = '' + mes;
    let diaTexto = '' + dia;

    if (mes < 10) {
        mesTexto = '0' + mes;
    }

    if (dia < 10) {
        diaTexto = '0' + dia;
    }

    return hoje.getFullYear() + '-' + mesTexto + '-' + diaTexto;
}

// Coloca uma opcao nova dentro de um select
function adicionarOpcao(select, valor) {
    let opcao = document.createElement('option');
    opcao.value = valor;
    opcao.textContent = valor;
    select.appendChild(opcao);
}

// Valida o titulo da demanda (de 5 a 100 caracteres)
function validarTitulo() {
    let titulo = document.getElementById('f-title').value.trim();

    if (titulo === '') {
        return 'O título da demanda é obrigatório.';
    }

    if (titulo.length < 5) {
        return 'O título deve ter no mínimo 5 caracteres.';
    }

    if (titulo.length > 100) {
        return 'O título não pode exceder 100 caracteres.';
    }

    return '';
}

// Valida a descricao da demanda (de 10 a 1000 caracteres)
function validarDescricao() {
    let descricao = document.getElementById('f-description').value.trim();

    if (descricao === '') {
        return 'A descrição da demanda é obrigatória.';
    }

    if (descricao.length < 10) {
        return 'A descrição deve ter no mínimo 10 caracteres explicativos.';
    }

    if (descricao.length > 1000) {
        return 'A descrição não pode exceder 1000 caracteres.';
    }

    return '';
}

// Valida o projeto selecionado
function validarProjeto() {
    let projeto = document.getElementById('f-project').value;

    if (projeto === '') {
        return 'Selecione um projeto válido.';
    }

    return '';
}

// Valida o tipo da demanda
function validarTipo() {
    let tipo = document.getElementById('f-type').value;

    if (TIPOS_VALIDOS.indexOf(tipo) === -1) {
        return 'O tipo deve ser: Tarefa, Defeito, Melhoria ou Documentação.';
    }

    return '';
}

// Valida a prioridade da demanda
function validarPrioridade() {
    let prioridade = document.getElementById('f-priority').value;

    if (PRIORIDADES_VALIDAS.indexOf(prioridade) === -1) {
        return 'A prioridade deve ser: Crítica, Alta, Média ou Baixa.';
    }

    return '';
}

// Valida o prazo. No cadastro novo ele nao pode estar no passado.
// Na edicao deixamos manter um prazo antigo (a demanda pode estar atrasada).
function validarPrazo() {
    let prazo = document.getElementById('f-due').value;

    if (prazo === '') {
        return '';
    }

    if (idEmEdicao === null) {
        let dataDoPrazo = new Date(prazo + 'T00:00:00');
        let hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (dataDoPrazo < hoje) {
            return 'O prazo de finalização não pode ser anterior à data de hoje.';
        }
    }

    return '';
}

// Confere na API se o prazo cai em feriado nacional.
// Se a API de feriados estiver fora do ar, deixa seguir: o backend
// confere de novo antes de gravar.
async function verificarFeriadoNaTela() {
    let campo = document.getElementById('f-due');
    let erro = document.getElementById('f-due-error');
    let prazo = campo.value;

    if (prazo === '') {
        return '';
    }

    let resultado = await requisitar('GET', '/feriados/verificar?data=' + encodeURIComponent(prazo));

    if (resultado.ok === true && resultado.dados.feriado === true) {
        let mensagem = 'O dia ' + dataParaTela(prazo) + ' é feriado nacional (' + resultado.dados.nome + '). Escolha outra data.';
        mostrarErro(campo, erro, mensagem);
        return mensagem;
    }

    if (resultado.ok === true) {
        limparErro(campo, erro);
    }

    return '';
}

// Carrega os projetos e os usuarios para completar os selects
async function carregarOpcoes() {
    let resultadoProjetos = await requisitar('GET', '/projetos');

    if (resultadoProjetos.ok === true) {
        let selectProjeto = document.getElementById('f-project');
        let projetos = resultadoProjetos.dados.projetos;

        for (let i = 0; i < projetos.length; i++) {
            adicionarOpcao(selectProjeto, projetos[i].nome);
        }
    } else {
        mostrarErroGeral(mensagemDeErro(resultadoProjetos));
    }

    let resultadoUsuarios = await requisitar('GET', '/usuarios');

    if (resultadoUsuarios.ok === true) {
        let selectDono = document.getElementById('f-owner');
        let usuarios = resultadoUsuarios.dados.usuarios;

        for (let i = 0; i < usuarios.length; i++) {
            adicionarOpcao(selectDono, usuarios[i].nome);
        }
    } else {
        mostrarErroGeral(mensagemDeErro(resultadoUsuarios));
    }
}

// Deixa o formulario pronto para cadastrar uma demanda nova
function prepararCadastro() {
    idEmEdicao = null;

    document.getElementById('form-title').textContent = 'Nova demanda';
    document.getElementById('form-subtitle').textContent = 'Preencha as informações para registrar uma atividade.';
    document.getElementById('form-submit').textContent = 'Salvar demanda';
    document.getElementById('f-due').min = dataDeHojeNoCampo();
}

// Preenche o formulario com a demanda que veio da API (modo edicao)
function preencherFormulario(demanda) {
    idEmEdicao = demanda.id;

    document.getElementById('form-title').textContent = 'Editar demanda (' + demanda.id + ')';
    document.getElementById('form-subtitle').textContent = 'Status atual: ' + demanda.status + ' · Atualize os dados e salve.';
    document.getElementById('form-submit').textContent = 'Salvar alterações';

    document.getElementById('f-title').value = demanda.titulo;
    document.getElementById('f-description').value = demanda.descricao;
    document.getElementById('f-project').value = demanda.projeto;
    document.getElementById('f-type').value = demanda.tipo;
    document.getElementById('f-priority').value = demanda.prioridade;

    if (demanda.responsavel === 'Não atribuído') {
        document.getElementById('f-owner').value = '';
    } else {
        document.getElementById('f-owner').value = demanda.responsavel;
    }

    document.getElementById('f-due').value = demanda.prazo;
}

// Se a URL tiver ?id=, busca a demanda e entra em modo de edicao
async function carregarDemandaParaEdicao() {
    let parametros = new URLSearchParams(window.location.search);
    let id = parametros.get('id');

    if (id === null || id === '') {
        prepararCadastro();
        return;
    }

    let resultado = await requisitar('GET', '/demandas/' + encodeURIComponent(id));

    if (resultado.ok === false) {
        mostrarErroGeral(mensagemDeErro(resultado));
        document.getElementById('form-submit').disabled = true;
        return;
    }

    preencherFormulario(resultado.dados.demanda);
}

// Monta o corpo que vai para a API com os dados do formulario
function montarCorpo() {
    return {
        titulo: document.getElementById('f-title').value.trim(),
        descricao: document.getElementById('f-description').value.trim(),
        projeto: document.getElementById('f-project').value,
        tipo: document.getElementById('f-type').value,
        prioridade: document.getElementById('f-priority').value,
        responsavel: document.getElementById('f-owner').value,
        prazo: document.getElementById('f-due').value
    };
}

// Envia o formulario para a API
document.getElementById('demand-form').addEventListener('submit', async function (evento) {
    evento.preventDefault();

    let erroTitulo = validarTitulo();
    let erroDescricao = validarDescricao();
    let erroProjeto = validarProjeto();
    let erroTipo = validarTipo();
    let erroPrioridade = validarPrioridade();
    let erroPrazo = validarPrazo();
    let temErro = false;

    if (erroTitulo !== '') {
        mostrarErro(document.getElementById('f-title'), document.getElementById('f-title-error'), erroTitulo);
        temErro = true;
    } else {
        limparErro(document.getElementById('f-title'), document.getElementById('f-title-error'));
    }

    if (erroDescricao !== '') {
        mostrarErro(document.getElementById('f-description'), document.getElementById('f-description-error'), erroDescricao);
        temErro = true;
    } else {
        limparErro(document.getElementById('f-description'), document.getElementById('f-description-error'));
    }

    if (erroProjeto !== '') {
        mostrarErro(document.getElementById('f-project'), document.getElementById('f-project-error'), erroProjeto);
        temErro = true;
    } else {
        limparErro(document.getElementById('f-project'), document.getElementById('f-project-error'));
    }

    if (erroTipo !== '') {
        mostrarErro(document.getElementById('f-type'), document.getElementById('f-type-error'), erroTipo);
        temErro = true;
    } else {
        limparErro(document.getElementById('f-type'), document.getElementById('f-type-error'));
    }

    if (erroPrioridade !== '') {
        mostrarErro(document.getElementById('f-priority'), document.getElementById('f-priority-error'), erroPrioridade);
        temErro = true;
    } else {
        limparErro(document.getElementById('f-priority'), document.getElementById('f-priority-error'));
    }

    if (erroPrazo !== '') {
        mostrarErro(document.getElementById('f-due'), document.getElementById('f-due-error'), erroPrazo);
        temErro = true;
    } else {
        limparErro(document.getElementById('f-due'), document.getElementById('f-due-error'));
    }

    if (temErro === true) {
        mostrarToast('Corrija os erros apontados no formulário antes de salvar.');
        return;
    }

    limparErroGeral();

    let erroFeriado = await verificarFeriadoNaTela();
    if (erroFeriado !== '') {
        mostrarToast('O prazo escolhido é um feriado nacional.');
        return;
    }

    let botao = document.getElementById('form-submit');
    botao.disabled = true;
    botao.textContent = 'Salvando...';

    let corpo = montarCorpo();
    let resultado;

    if (idEmEdicao === null) {
        resultado = await requisitar('POST', '/demandas', corpo);
    } else {
        resultado = await requisitar('PATCH', '/demandas/' + encodeURIComponent(idEmEdicao), corpo);
    }

    botao.disabled = false;
    botao.textContent = idEmEdicao === null ? 'Salvar demanda' : 'Salvar alterações';

    if (resultado.ok === false) {
        mostrarErroGeral(mensagemDeErro(resultado));
        mostrarToast('Não foi possível salvar a demanda.');
        return;
    }

    let demandaSalva = resultado.dados.demanda;
    mostrarToast(resultado.dados.mensagem);

    // Depois de salvar, abre a tela de detalhes da demanda
    setTimeout(function () {
        window.location.href = '../06-detalhes-demanda/index.html?id=' + encodeURIComponent(demandaSalva.id);
    }, 900);
});

// Comeca a tela somente se o usuario estiver logado
if (exigirSessao() === true) {
    configurarNavegacao();
    preencherPerfil();
    abrirPagina('form');

    let usuario = lerUsuario();

    if (usuario != null && usuario.perfil === 'Membro da Equipe') {
        mostrarErroGeral('Seu perfil (Membro da Equipe) não pode cadastrar nem editar demandas. Fale com o líder do projeto.');
        document.getElementById('form-submit').disabled = true;
    } else {
        document.getElementById('f-due').addEventListener('change', verificarFeriadoNaTela);

        carregarOpcoes().then(function () {
            return carregarDemandaParaEdicao();
        });
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
