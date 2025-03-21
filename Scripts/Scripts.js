const buttons = document.querySelectorAll('.icons a');

buttons.forEach(button => {
button.addEventListener('click', () => {
button.blur(); // Remove o foco do botão
});
});
