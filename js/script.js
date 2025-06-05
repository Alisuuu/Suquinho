window.addEventListener('load', () => {
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarButtonsContainer = document.querySelector('.sidebar-buttons');
  const newsFrame = document.getElementById('newsFrame');
  const iframeBackButton = document.getElementById('iframeBackButton');

  let inactivityTimerId;
  const INACTIVITY_TIMEOUT_MS = 4000;

  const newsFeedHref = 'https://feed-pearl.vercel.app/';
  let iframeSrcHistory = ['inicio.html'];
  const backButtonTriggerHrefs = ['not2/index', 'links/links', 'Catalogo1/index1', newsFeedHref];

  if (sidebarToggleBtn && sidebarButtonsContainer && newsFrame && iframeBackButton) {
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
      iframeBackButton.style.display = (canGoBack && currentPageIsTargetForBackButton) ? 'flex' : 'none';
    };

    const updateSidebarState = (expand) => {
      buttonsToToggleVisibility.forEach(button => {
        button.classList.toggle('sidebar-item-hidden', !expand);
      });

      sidebarButtonsContainer.classList.toggle('sidebar-container-condensed', !expand);
      // Não aplicamos 'toggle-btn-shrunk' ao sidebarToggleBtn se ele vai ficar invisível
      // Mas a lógica de display abaixo o controla.
      
      if (toggleIconElement) {
        toggleIconElement.classList.remove('fa-times');
        toggleIconElement.classList.add('fa-bars');
      }
      
      if (expand) { // Sidebar está expandida
        sidebarToggleBtn.style.display = 'none'; // Esconde o botão de toggle
        sidebarToggleBtn.setAttribute('title', 'Recolher Menu'); // Título se estivesse visível
        resetInactivityTimer();
      } else { // Sidebar está recolhida
        sidebarToggleBtn.style.display = 'flex'; // Mostra o botão de toggle
        sidebarToggleBtn.classList.add('toggle-btn-shrunk'); // Aplica estilo 'shrunk' quando visível e fechado
        sidebarToggleBtn.setAttribute('title', 'Mostrar Menu');
        clearTimeout(inactivityTimerId);
      }
    };
    
    const setupIframeContentListeners = () => {
        if (newsFrame.contentWindow) {
            const handleFrameInteraction = () => {
                const isSidebarExpandedCurrent = !sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
                if (isSidebarExpandedCurrent) {
                    updateSidebarState(false);
                }
            };
            // Remove listeners antigos para evitar duplicação se chamados múltiplas vezes
            newsFrame.contentWindow.removeEventListener('scroll', handleFrameInteraction);
            newsFrame.contentWindow.removeEventListener('click', handleFrameInteraction);
            newsFrame.contentWindow.removeEventListener('touchstart', handleFrameInteraction);
            
            // Adiciona novos listeners
            newsFrame.contentWindow.addEventListener('scroll', handleFrameInteraction);
            newsFrame.contentWindow.addEventListener('click', handleFrameInteraction);
            newsFrame.contentWindow.addEventListener('touchstart', handleFrameInteraction, { passive: true });
        } else {
             console.warn("newsFrame.contentWindow não está acessível para adicionar listeners de interação.");
        }
    };

    sidebarToggleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Se o botão está visível, significa que a sidebar está fechada. Clicar deve abrir.
      updateSidebarState(true); // Força a expansão e esconde o botão de toggle
    });
    
    iframeBackButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (iframeSrcHistory.length > 1) {
        iframeSrcHistory.pop(); 
        const previousUrlOrIdentifier = iframeSrcHistory[iframeSrcHistory.length - 1];
        newsFrame.src = previousUrlOrIdentifier; 
        // A visibilidade do botão Voltar será atualizada pelo listener 'load' do newsFrame
      }
    });

    sidebarButtonsContainer.addEventListener('mousemove', resetInactivityTimer);
    sidebarButtonsContainer.addEventListener('touchstart', resetInactivityTimer, { passive: true });

    document.addEventListener('click', (event) => {
      const isSidebarExpanded = !sidebarButtonsContainer.classList.contains('sidebar-container-condensed');
      // Se a sidebar está expandida e o clique foi fora dela (e não no toggle button, que já estaria escondido)
      if (isSidebarExpanded && !sidebarButtonsContainer.contains(event.target)) {
         updateSidebarState(false);
      }
    });

    if (newsFrame) {
      newsFrame.addEventListener('load', () => {
        updateIframeBackButtonVisibility();
        try {
          setupIframeContentListeners(); 
        } catch (e) {
          console.warn("Erro ao tentar re-anexar listeners ao iframe após novo carregamento de conteúdo.", e);
        }
      });
      
      try { // Tentativa inicial de configurar listeners
        setupIframeContentListeners();
      } catch (e) {
        // Silencioso, pois o listener 'load' acima tentará novamente.
      }
    }

    const iframeButtonLinks = sidebarButtonsContainer.querySelectorAll('a.icon-button:not(#sidebarToggleBtn):not(#iframeBackButton)');
    iframeButtonLinks.forEach(button => {
      button.addEventListener('click', event => {
        const targetHref = button.getAttribute('href');

        if (targetHref === 'Hyper/hyper' || targetHref === 'Yt/yt') {
          return; 
        }
        if (targetHref === '#') return;

        event.preventDefault();
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
          // A visibilidade do botão Voltar será atualizada pelo listener 'load' do newsFrame
        }
      });
    });

    updateSidebarState(true); // Começa expandida, o que esconderá o sidebarToggleBtn
    updateIframeBackButtonVisibility();

  } else {
    console.warn('Elementos essenciais da sidebar (toggle, container, iframe ou botão voltar) não encontrados.');
  }
});
