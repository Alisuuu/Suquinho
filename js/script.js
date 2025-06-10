window.addEventListener('load', () => {
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarButtonsContainer = document.querySelector('.sidebar-buttons');
  const newsFrame = document.getElementById('newsFrame');
  const iframeBackButton = document.getElementById('iframeBackButton');

  const HOME_PAGE = 'Catalogo1/index.html';
  let iframeSrcHistory = [HOME_PAGE];

  if (!sidebarToggleBtn || !sidebarButtonsContainer || !newsFrame || !iframeBackButton) return;

  const toggleIconElement = sidebarToggleBtn.querySelector('i');
  const buttonsToToggleVisibility = Array.from(sidebarButtonsContainer.children)
    .filter(child =>
      child.classList.contains('icon-button') &&
      child.id !== 'sidebarToggleBtn' &&
      child.id !== 'iframeBackButton' &&
      !['index', HOME_PAGE].includes(child.getAttribute('href'))
    );

  const isIframeHome = () => newsFrame.src.endsWith(HOME_PAGE);

  const updateIframeBackButtonVisibility = () => {
    const isHome = isIframeHome();
    iframeBackButton.style.display = isHome ? 'none' : 'flex';
    sidebarToggleBtn.style.display = isHome ? 'flex' : 'none';
    buttonsToToggleVisibility.forEach(btn => {
      btn.style.display = isHome ? 'flex' : 'none';
    });
  };

  const updateSidebarState = (expand) => {
    buttonsToToggleVisibility.forEach(button => {
      button.classList.toggle('sidebar-item-hidden', !expand);
    });

    sidebarButtonsContainer.classList.toggle('sidebar-container-condensed', !expand);

    if (toggleIconElement) {
      toggleIconElement.classList.remove('fa-times');
      toggleIconElement.classList.add('fa-bars');
    }

    if (expand) {
      sidebarToggleBtn.style.display = 'none';
    } else if (isIframeHome()) {
      sidebarToggleBtn.style.display = 'flex';
    }
  };

  const setupIframeLinks = () => {
    try {
      const iframeDoc = newsFrame.contentDocument || newsFrame.contentWindow.document;
      iframeDoc.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (link && link.href && !link.target && !link.href.startsWith('javascript:')) {
          event.preventDefault();
          const href = link.href;
          iframeSrcHistory.push(href);
          history.pushState({ iframe: href }, '', '');
          newsFrame.src = href;
          updateIframeBackButtonVisibility();
        }
      });
    } catch (e) {
      console.warn("Erro ao configurar links da iframe:", e);
    }
  };

  const setupIframeContentListeners = () => {
    if (newsFrame.contentWindow) {
      const handleFrameInteraction = () => {
        if (!sidebarButtonsContainer.classList.contains('sidebar-container-condensed')) {
          if (isIframeHome()) updateSidebarState(false);
        }
      };

      newsFrame.contentWindow.addEventListener('scroll', handleFrameInteraction);
      newsFrame.contentWindow.addEventListener('click', handleFrameInteraction);
      newsFrame.contentWindow.addEventListener('touchstart', handleFrameInteraction, { passive: true });
    }
  };

  sidebarToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateSidebarState(true);
  });

  iframeBackButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (iframeSrcHistory.length > 1) {
      iframeSrcHistory.pop();
      const previous = iframeSrcHistory[iframeSrcHistory.length - 1];
      newsFrame.src = previous;
      history.back();
    } else {
      newsFrame.src = HOME_PAGE;
      iframeSrcHistory = [HOME_PAGE];
      history.pushState({ iframe: HOME_PAGE }, '', '');
    }
    updateIframeBackButtonVisibility();
  });

  const iframeButtonLinks = sidebarButtonsContainer.querySelectorAll('a.icon-button:not(#sidebarToggleBtn):not(#iframeBackButton)');
  iframeButtonLinks.forEach(button => {
    const href = button.getAttribute('href');
    if (href === 'index' || href === HOME_PAGE) {
      button.style.display = 'none'; // Esconde esses botões diretamente no DOM também
      return;
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      iframeSrcHistory.push(href);
      history.pushState({ iframe: href }, '', '');
      newsFrame.src = href;
      updateIframeBackButtonVisibility();
    });
  });

  window.addEventListener('popstate', () => {
    if (iframeSrcHistory.length > 1) iframeSrcHistory.pop();
    const prev = iframeSrcHistory[iframeSrcHistory.length - 1] || HOME_PAGE;
    newsFrame.src = prev;
    updateIframeBackButtonVisibility();
  });

  document.addEventListener('click', (e) => {
    if (!sidebarButtonsContainer.classList.contains('sidebar-container-condensed') &&
        !sidebarButtonsContainer.contains(e.target)) {
      updateSidebarState(false);
    }
  });

  newsFrame.addEventListener('load', () => {
    updateIframeBackButtonVisibility();
    setupIframeContentListeners();
    setupIframeLinks();
  });

  newsFrame.src = HOME_PAGE;
  history.replaceState({ iframe: HOME_PAGE }, '', '');
  updateSidebarState(false);
  updateIframeBackButtonVisibility();
});
