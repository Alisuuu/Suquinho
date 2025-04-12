const linkList = document.getElementById('link-list');
const refreshButton = document.getElementById('refresh-button');

// Função para carregar links do arquivo links.txt
async function loadLinks() {
    try {
        const response = await fetch('links.txt');
        if (!response.ok) {
            throw new Error(`Erro ao carregar links: ${response.status}`);
        }
        const links = await response.text();
        // Limpa a lista de links antes de adicionar os novos
        linkList.innerHTML = '';
        links.split('\n').forEach(link => {
            const trimmedLink = link.trim();
            if (trimmedLink) {
                addLinkToList(trimmedLink);
            }
        });
        console.log('Links carregados com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar links:', error);
    }
}

function addLinkToList(link) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <a href="${link}" target="_blank">${link}</a>
        <div class="link-buttons">
            <button class="copy-button"><i class="fas fa-copy"></i></button>
        </div>
    `;
    linkList.appendChild(listItem);

    const copyButton = listItem.querySelector('.copy-button');
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(link);
        console.log('Link copiado!');
    });
    console.log(`Link "${link}" adicionado à lista.`);
}

// Carregar links ao carregar a página
loadLinks();

// Adiciona o evento de clique ao botão de atualizar
refreshButton.addEventListener('click', loadLinks);
