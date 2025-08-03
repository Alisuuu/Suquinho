// Captura os elementos do DOM
const goBtn = document.getElementById('go-btn');
const linkInput = document.getElementById('link-input');
const entrarBtn = document.getElementById('entrar-btn');

// Função para atualizar o link do botão "Entrar"
function atualizarLinkEntrar() {
    const link = linkInput.value.trim(); // Remove espaços em branco

    if (link) {
        // Atualiza o link do botão "Entrar"
        entrarBtn.href = link;
        console.log('Link do botão "Entrar" atualizado para:', link); // Log para depuração
        alert('Link do botão "Entrar" atualizado com sucesso!');
    } else {
        alert('Por favor, insira um link válido.');
    }
}

// Adiciona o evento de clique ao botão "Ir"
goBtn.addEventListener('click', atualizarLinkEntrar);

// Adiciona o evento de "Enter" no campo de texto
linkInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        atualizarLinkEntrar();
    }
});