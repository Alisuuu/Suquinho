// Criar estrelas dinamicamente
const starContainer = document.getElementById('stars');
const colors = ['#ffffff', '#ffd700', '#00ffff', '#ff69b4', '#ffa07a'];

for (let i = 0; i < 40; i++) {
  const star = document.createElement('div');
  const size = Math.random() * 3 + 1;
  const color = colors[Math.floor(Math.random() * colors.length)];
  star.classList.add('star');
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.left = `${Math.random() * 100}%`;
  star.style.background = color;
  star.style.animationDuration = `${Math.random() * 2 + 1}s`;
  starContainer.appendChild(star);
}