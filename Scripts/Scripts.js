setTimeout(() => {
    document.querySelector('.loader').style.display = 'none';
    document.querySelector('.icons').style.display = 'flex';
}, 2000);

const invisibleButton = document.getElementById('invisibleButton');
let clickCount = 0;
let isMouseDown = false;
let fireworkInterval;

invisibleButton.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    invisibleButton.classList.add('active');
    createFireworks(event);
    fireworkInterval = setInterval(() => {
        if (isMouseDown) {
            createFireworks({clientX: event.clientX, clientY: event.clientY});
        }
    }, 200);
});

invisibleButton.addEventListener('mouseup', () => {
    isMouseDown = false;
    clearInterval(fireworkInterval);
    invisibleButton.classList.remove('active');
});

invisibleButton.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 10) {
        window.location.href = 'game/index.html';
    }
});

function createFireworks(event) {
    const x = event.clientX;
    const y = event.clientY;
    const numSparks = 47;

    for (let i = 0; i < numSparks; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.backgroundColor = getRandomColor();

        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 7.5 + 3.75;
        spark.style.animationDelay = Math.random() * 0.9 + 's';

        spark.style.setProperty('--dx', Math.cos(angle) * speed + 'px');
        spark.style.setProperty('--dy', Math.sin(angle) * speed + 'px');

        document.body.appendChild(spark);
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
