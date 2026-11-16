// app.js — PI2 / Time 27
// Autor: Murilo Passini

// Tela de login (01). As validacoes de e-mail e senha rodam no navegador.
// Quando os campos estao certos, a tela manda e-mail e senha para a API
// (POST /login). Se a API aceitar, o token fica guardado no navegador e o
// usuario vai para o dashboard. Se a API recusar, a mensagem dela aparece
// na propria tela (por exemplo: "E-mail ou senha incorretos.").

const formLogin = document.getElementById('login-form');
const campoEmail = document.getElementById('login-email');
const erroEmail = document.getElementById('login-email-error');
const campoSenha = document.getElementById('login-password');
const erroSenha = document.getElementById('login-password-error');
const erroGeral = document.getElementById('login-error');
const botaoEntrar = document.getElementById('login-submit');

// Se ja existe uma sessao guardada, vai direto para o dashboard
if (lerToken() !== '') {
    window.location.href = '../02-dashboard/index.html';
}

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

// Mostra o erro geral que vem da API (embaixo do titulo do formulario)
function mostrarErroGeral(mensagem) {
    erroGeral.textContent = mensagem;
    erroGeral.classList.add('show');
}

// Esconde o erro geral
function limparErroGeral() {
    erroGeral.textContent = '';
    erroGeral.classList.remove('show');
}

// Devolve a mensagem de erro do e-mail, ou vazio se estiver ok
function validarEmail() {
    let email = campoEmail.value.trim();

    if (email === '') {
        return 'O e-mail é obrigatório.';
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return 'Informe um e-mail válido (ex.: usuario@empresa.com).';
    }

    return '';
}

// Devolve a mensagem de erro da senha, ou vazio se estiver ok
function validarSenha() {
    let senha = campoSenha.value;

    if (senha === '') {
        return 'A senha é obrigatória.';
    }

    if (senha.length < 8) {
        return 'A senha deve conter no mínimo 8 caracteres.';
    }

    if (!/[A-Z]/.test(senha)) {
        return 'A senha deve conter pelo menos uma letra maiúscula.';
    }

    if (!/[a-z]/.test(senha)) {
        return 'A senha deve conter pelo menos uma letra minúscula.';
    }

    if (!/[0-9]/.test(senha)) {
        return 'A senha deve conter pelo menos um número.';
    }

    return '';
}

// Envia o formulario para a API
formLogin.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    let mensagemEmail = validarEmail();
    let mensagemSenha = validarSenha();
    let temErro = false;

    if (mensagemEmail !== '') {
        mostrarErro(campoEmail, erroEmail, mensagemEmail);
        temErro = true;
    } else {
        limparErro(campoEmail, erroEmail);
    }

    if (mensagemSenha !== '') {
        mostrarErro(campoSenha, erroSenha, mensagemSenha);
        temErro = true;
    } else {
        limparErro(campoSenha, erroSenha);
    }

    if (temErro === true) {
        mostrarToast('Por favor, corrija os erros destacados no formulário.');
        return;
    }

    limparErroGeral();
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = 'Entrando...';

    let resultado = await requisitar('POST', '/login', {
        email: campoEmail.value.trim(),
        senha: campoSenha.value
    });

    botaoEntrar.disabled = false;
    botaoEntrar.textContent = 'Entrar';

    if (resultado.ok === false) {
        mostrarErroGeral(mensagemDeErro(resultado));
        mostrarToast('Não foi possível entrar.');
        return;
    }

    // Guarda o token e o usuario e abre a tela do dashboard
    guardarSessao(resultado.dados.token, resultado.dados.usuario);
    window.location.href = '../02-dashboard/index.html';
});
