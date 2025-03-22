
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

    for (let i = 0; i < numSparks;
         
