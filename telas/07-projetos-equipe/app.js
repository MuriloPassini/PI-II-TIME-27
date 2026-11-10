// Tela de Projetos e Equipe — PI2 / Time 27
// Time 27

// telas que existem no protótipo
const telas = ['dashboard', 'demands', 'kanban', 'form', 'detail', 'projects'];

// mostra uma mensagem rápida no canto da tela
function mostrarToast(mensagem){
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');

    setTimeout(function(){
        toast.classList.remove('show');
    }, 3000);
}

// troca a tela que está sendo mostrada
function mostrarTela(tela){
    for(let i = 0; i < telas.length; i++){
        const pagina = document.getElementById('page-' + telas[i]);

        if(pagina != null){
            if(telas[i] == tela){
                pagina.classList.add('active');
            } else {
                pagina.classList.remove('active');
            }
        }
    }

    // marca o botão do menu que está ativo
    const itensDoMenu = document.querySelectorAll('.nav-item[data-page]');
    for(let i = 0; i < itensDoMenu.length; i++){
        if(itensDoMenu[i].dataset.page == tela){
            itensDoMenu[i].classList.add('active');
        } else {
            itensDoMenu[i].classList.remove('active');
        }
    }

    // nesta tela a trilha é sempre projetos e equipe
    const trilha = document.getElementById('crumb');
    if(trilha != null){
        trilha.textContent = 'Projetos e equipe';
    }

    window.scrollTo(0, 0);
}

// clique nos botões do menu lateral
const botoesDeNavegacao = document.querySelectorAll('[data-page]');
for(let i = 0; i < botoesDeNavegacao.length; i++){
    botoesDeNavegacao[i].addEventListener('click', function(){
        mostrarTela(botoesDeNavegacao[i].dataset.page);
    });
}

// botões que levam para outra tela
const botoesIr = document.querySelectorAll('[data-go]');
for(let i = 0; i < botoesIr.length; i++){
    botoesIr[i].addEventListener('click', function(){
        mostrarTela(botoesIr[i].dataset.go);
    });
}

// clique nos cards de projeto
const cardsDeProjeto = document.querySelectorAll('.project-card');
for(let i = 0; i < cardsDeProjeto.length; i++){
    cardsDeProjeto[i].addEventListener('click', function(){
        const tituloDoProjeto = cardsDeProjeto[i].querySelector('h2');

        if(tituloDoProjeto != null){
            mostrarToast('Projeto selecionado: ' + tituloDoProjeto.textContent);
        } else {
            mostrarToast('Projeto selecionado');
        }
    });
}

// começa na tela de projetos e equipe
document.getElementById('app').style.display = 'flex';
mostrarTela('projects');
