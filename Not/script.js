const apiKey = "14d21c9c36a74609be8200f5a3d89bea";
const url = `https://newsapi.org/v2/everything?q=cinema+filmes+séries&language=pt&apiKey=${apiKey}`;

async function carregarNoticias() {
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        const feed = document.getElementById("feed");

        feed.innerHTML = "";
        dados.articles.forEach(noticia => {
            const elemento = document.createElement("div");
            elemento.classList.add("noticia");
            elemento.innerHTML = `<h2>${noticia.title}</h2>`;
            elemento.onclick = () => abrirModal(noticia);
            feed.appendChild(elemento);
        });
    } catch (erro) {
        console.error("Erro ao carregar notícias:", erro);
    }
}

function abrirModal(noticia) {
    document.getElementById("modal-title").textContent = noticia.title;
    document.getElementById("modal-description").textContent = noticia.description || "Sem descrição disponível.";
    document.getElementById("modal-link").href = noticia.url;
    document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

carregarNoticias();