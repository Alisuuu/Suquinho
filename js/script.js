window.addEventListener('load', () => {
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarButtonsContainer = document.querySelector('.sidebar-buttons');
  const newsFrame = document.getElementById('newsFrame');
  const iframeBackButton = document.getElementById('iframeBackButton'); // Novo botão

  let inactivityTimerId;
  const INACTIVITY_TIMEOUT_MS = 4000;

  // Histórico para o iframe e identificadores das páginas que ativam o botão "Voltar"
  let iframeSrcHistory = ['inicio.html']; // A página inicial é o primeiro item
  const backButtonTriggerHrefs = ['not2/index', 'links/links', 'Catalogo1/index1'];

  if (sidebarToggleBtn && sidebarButtonsContainer && newsFrame && iframeBackButton) {
    // Filtra botões para esconder/mostrar, excluindo o toggle principal E o botão voltar
    const buttonsToToggleVisibility = Array.from(sidebarButtonsContainer.children)
      .filter(child => child.classList.contains('icon-button') && 
                       child.id !== 'sidebarToggleBtn' &&
                       child.id !== 'iframeBackButton');
    const toggleIconElement = sidebarToggleBtn.querySelector('i');

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimerId);
      const isExpanded = !sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
      if (isExpanded) {
        inactivityTimerId = setTimeout(() => {
          updateSidebarState(false);
        }, INACTIVITY_TIMEOUT_MS);
      }
    };

    const updateIframeBackButtonVisibility = () => {
      const canGoBack = iframeSrcHistory.length > 1;
      let currentPageIsTargetForBackButton = false;
      if (iframeSrcHistory.length > 0) {
        const currentIdentifierInHistory = iframeSrcHistory[iframeSrcHistory.length - 1];
        currentPageIsTargetForBackButton = backButtonTriggerHrefs.includes(currentIdentifierInHistory);
      }

      if (canGoBack && currentPageIsTargetForBackButton) {
        iframeBackButton.style.display = 'flex';
      } else {
        iframeBackButton.style.display = 'none';
      }
    };

    const updateSidebarState = (expand) => {
      buttonsToToggleVisibility.forEach(button => {
        button.classList.toggle('sidebar-item-hidden', !expand);
      });

      sidebarButtonsContainer.classList.toggle('sidebar-container-condensed', !expand);
      sidebarToggleBtn.classList.toggle('toggle-btn-shrunk', !expand);
      
      if (toggleIconElement) {
        toggleIconElement.classList.remove('fa-times');
        toggleIconElement.classList.add('fa-bars');
      }
      sidebarToggleBtn.setAttribute('title', expand ? 'Recolher Menu' : 'Mostrar Menu');
      
      if (expand) {
        resetInactivityTimer();
      } else {
        clearTimeout(inactivityTimerId);
      }
    };

    sidebarToggleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isCurrentlyShrunk = sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
      updateSidebarState(isCurrentlyShrunk);
    });
    
    iframeBackButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (iframeSrcHistory.length > 1) {
        iframeSrcHistory.pop(); 
        const previousUrlOrIdentifier = iframeSrcHistory[iframeSrcHistory.length - 1];
        newsFrame.src = previousUrlOrIdentifier; 
        updateIframeBackButtonVisibility(); 
      }
    });

    sidebarButtonsContainer.addEventListener('mousemove', resetInactivityTimer);
    sidebarButtonsContainer.addEventListener('touchstart', resetInactivityTimer, { passive: true });

    document.addEventListener('click', (event) => {
      const isSidebarExpanded = !sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
      if (isSidebarExpanded && !sidebarButtonsContainer.contains(event.target)) {
         updateSidebarState(false);
      }
    });

    if (newsFrame) {
      newsFrame.addEventListener('load', () => {
        // updateIframeBackButtonVisibility(); // Descomente se necessário
      });
      
      try {
        const setupIframeContentListeners = () => {
            if (newsFrame.contentWindow) {
                const handleFrameInteraction = () => {
                    const isSidebarExpandedCurrent = !sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
                    if (isSidebarExpandedCurrent) {
                        updateSidebarState(false);
                    }
                };
                newsFrame.contentWindow.addEventListener('scroll', handleFrameInteraction);
                newsFrame.contentWindow.addEventListener('click', handleFrameInteraction);
                newsFrame.contentWindow.addEventListener('touchstart', handleFrameInteraction, { passive: true });
            } else {
                 console.warn("newsFrame.contentWindow não está acessível para adicionar listeners de interação.");
            }
        };

        if (newsFrame.contentWindow) {
            setupIframeContentListeners();
        }
        newsFrame.addEventListener('load', setupIframeContentListeners, { once: true });

      } catch (e) {
        console.warn("Erro ao adicionar ouvintes de evento ao contentWindow do iframe.", e);
      }
    }

    // Configurar listeners para os botões que carregam conteúdo no iframe
    const iframeButtonLinks = sidebarButtonsContainer.querySelectorAll('a.icon-button:not(#sidebarToggleBtn):not(#iframeBackButton)');
    iframeButtonLinks.forEach(button => {
      button.addEventListener('click', event => {
        const targetHref = button.getAttribute('href');

        // ****** ALTERAÇÃO AQUI ******
        // Verifica se o botão é o Yt ou Hyper. Se for, não faz nada e deixa o link seguir.
        if (targetHref === 'Hyper/hyper' || targetHref === 'Yt/yt') {
          // Opcional: pode querer fechar a sidebar se estiver aberta
          // const isSidebarExpanded = !sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
          // if (isSidebarExpanded) {
          //   updateSidebarState(false);
          // }
          return; // Permite o comportamento padrão do link
        }
        // ****** FIM DA ALTERAÇÃO ******

        if (targetHref === '#') return;

        event.preventDefault(); // Previne navegação apenas para os botões que carregam no iframe
        let urlToLoad = targetHref;
        let identifierForHistory = targetHref;

        if (targetHref === 'index') {
          urlToLoad = 'inicio.html';
          identifierForHistory = urlToLoad;
        }
        
        if (newsFrame) {
          if (iframeSrcHistory.length === 0 || iframeSrcHistory[iframeSrcHistory.length - 1] !== identifierForHistory) {
            iframeSrcHistory.push(identifierForHistory);
          }
          newsFrame.src = urlToLoad;
          updateIframeBackButtonVisibility();
        }
      });
    });

    updateSidebarState(true); // Começa expandida
    updateIframeBackButtonVisibility(); // Define o estado inicial do botão voltar

  } else {
    console.warn('Elementos essenciais da sidebar (toggle, container, iframe ou botão voltar) não encontrados.');
  }
});

