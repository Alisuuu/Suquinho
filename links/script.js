async function loadLinks() {
  const list = document.getElementById('link-list');
  try {
    const response = await fetch('links.txt');
    const text = await response.text();
    const lines = text.trim().split('\n');
    list.innerHTML = '';

    lines.forEach(link => {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.textContent = link;

      const btn = document.createElement('button');
      btn.className = 'copy-button';
      btn.innerText = 'Copiar';
      btn.onclick = () => {
        navigator.clipboard.writeText(link);
        btn.innerText = 'Copiado!';
        setTimeout(() => btn.innerText = 'Copiar', 1000);
      };

      li.appendChild(span);
      li.appendChild(btn);
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = '<li>Erro ao carregar links.</li>';
  }
}

loadLinks();
