const suquinho = document.getElementById('suquinho');
const gridItems = document.querySelectorAll('.grid-item');
let clickCount = 0;

suquinho.addEventListener('click', () => {
    clickCount++;
    if (clickCount >= 10) {
        suquinho.style.color = 'mediumpurple';
        explodeSuquinho();
        window.location.href = 'game/index.html';
    } else {
        suquinho.style.color = `rgba(255, 255, 255, ${clickCount / 10})`;
    }
});

gridItems.forEach((item, index) => {
    setTimeout(() => {
        item.classList.add('animate');
    }, 200 * index);
});

function explodeSuquinho() {
    suquinho.style.transition = 'transform 0.20s ease, opacity 0.5s ease, display 0.20s ease';
    suquinho.style.transform = 'scale(7)';
    suquinho.style.opacity = '0';
    setTimeout(() => {
        suquinho.style.display = 'none';
    }, 500);
}

function aplicarCores(corFundoAviso, corTextoAviso) {
    const styleElement = document.getElementById('custom-colors');
    styleElement.innerHTML = `
        :root {
            --aviso-fundo: ${corFundoAviso};
            --aviso-texto: ${corTextoAviso};
        }
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    const orientacaoVertical = document.createElement('div');
    orientacaoVertical.id = 'orientacao-vertical';
    orientacaoVertical.innerHTML = '<i class="fas fa-arrows-rotate"></i><p>Por favor, gire seu dispositivo para a vertical.</p>';
    document.body.appendChild(orientacaoVertical);

    // Aplica as cores iniciais - Modifique aqui para personalizar
    aplicarCores('#f0f0f0', '#333'); // Cores padrão: fundo cinza claro, texto preto

    function checkOrientation() {
        if (window.orientation === 90 || window.orientation === -90) {
            // Orientação horizontal
            document.getElementById('conteudo-principal').style.display = 'none'; // Oculta o conteúdo principal
            document.getElementById('orientacao-vertical').style.display = 'flex'; // Exibe o aviso
        } else {
            // Orientação vertical
            document.getElementById('conteudo-principal').style.display = 'block'; // Exibe o conteúdo principal
            document.getElementById('orientacao-vertical').style.display = 'none'; // Oculta o aviso
        }
    }

    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation(); // Verifica a orientação inicial
});
