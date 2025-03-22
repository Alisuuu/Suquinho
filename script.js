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
    suquinho.style.transition = 'transform 0.5s ease, opacity 0.5s ease, display 0.5s ease';
    suquinho.style.transform = 'scale(2)';
    suquinho.style.opacity = '0';
    setTimeout(() => {
        suquinho.style.display = 'none';
    }, 500);
}