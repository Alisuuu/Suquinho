const linkInput = document.getElementById('link-input');
const saveButton = document.getElementById('save-button');
const linkList = document.getElementById('link-list');

// Função para carregar links do arquivo links.txt
async function loadLinks() {
    try {
        const response = await fetch('links.txt');
        if (!response.ok) {
            throw new Error(`Erro ao carregar links: ${response.status}`);
        }
        const links = await response.text();
        links.split('\n').forEach(link => {
            if (link) {
                addLinkToList(link);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar links:', error);
    }
}

// Função para salvar links no arquivo links.txt
async function saveLinks() {
    const links = Array.from(linkList.querySelectorAll('a')).map(a => a.href).join('\n');
    try {
        const response = await fetch('save_links.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `links=${encodeURIComponent(links)}`
        });
        if (!response.ok) {
            throw new Error(`Erro ao salvar links: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao salvar links:', error);
    }
}

saveButton.addEventListener('click', () => {
    const link = linkInput.value;
    if (link) {
        addLinkToList(link);
        saveLinks();
        linkInput.value = '';
    }
});

function addLinkToList(link) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <a href="${link}" target="_blank">${link}</a>
        <div class="link-buttons">
            <button class="copy-button"><i class="fas fa-copy"></i></button>
            <button class="edit-button"><i class="fas fa-edit"></i></button>
            <button class="remove-button"><i class="fas fa-trash"></i></button>
        </div>
    `;
    linkList.appendChild(listItem);

    const copyButton = listItem.querySelector('.copy-button');
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(link);
        alert('Link copiado!');
    });

    const editButton = listItem.querySelector('.edit-button');
    editButton.addEventListener('click', () => {
        const newLink = prompt('Editar link:', link);
        if (newLink) {
            listItem.querySelector('a').href = newLink;
            listItem.querySelector('a').textContent = newLink;
            saveLinks();
        }
    });

    const removeButton = listItem.querySelector('.remove-button');
    removeButton.addEventListener('click', () => {
        linkList.removeChild(listItem);
        saveLinks();
    });
}

// Carregar links ao carregar a página
loadLinks();