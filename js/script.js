window.addEventListener('load', () => {
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarButtonsContainer = document.querySelector('.sidebar-buttons');
  const newsFrame = document.getElementById('newsFrame');
  const iframeBackButton = document.getElementById('iframeBackButton');

  let inactivityTimerId;
  const INACTIVITY_TIMEOUT_MS = 4000;
  let iframeSrcHistory = ['Catalogo1/index.html'];

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
      if (iframeSrcHistory.length > 1) {
        // Mostra APENAS o botão de voltar (fixo no topo)
        iframeBackButton.style.display = 'flex';
        iframeBackButton.style.position = 'fixed';
        iframeBackButton.style.top = '10px';
        iframeBackButton.style.left = '10px';
        iframeBackButton.style.zIndex = '1000';

        // Oculta TODOS os outros botões (exceto o toggle)
        buttonsToToggleVisibility.forEach(button => {
          button.style.display = 'none';
        });
      } else {
        // Volta ao normal (mostra outros botões, esconde o de voltar)
        iframeBackButton.style.display = 'none';
        buttonsToToggleVisibility.forEach(button => {
          button.style.display = 'flex'; // Ou o valor original (block/inline-flex)
        });
      }
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
        resetInactivityTimer();
      } else {
        sidebarToggleBtn.style.display = 'flex';
        sidebarToggleBtn.classList.add('toggle-btn-shrunk');
        clearTimeout(inactivityTimerId);
      }
    };
    
    const setupIframeContentListeners = () => {
      if (newsFrame.contentWindow) {
        const handleFrameInteraction = () => {
          if (!sidebarButtonsContainer.classList.contains('sidebar-container-condensed')) {
            updateSidebarState(false);
          }
        };
        
        newsFrame.contentWindow.addEventListener('scroll', handleFrameInteraction);
        newsFrame.contentWindow.addEventListener('click', handleFrameInteraction);
        newsFrame.contentWindow.addEventListener('touchstart', handleFrameInteraction, { passive: true });
      }
    };

    const setupIframeLinks = () => {
      try {
        const iframeDoc = newsFrame.contentDocument || newsFrame.contentWindow.document;
        
        iframeDoc.addEventListener('click', (event) => {
          const link = event.target.closest('a');
          
          if (link && link.href && !link.target && !link.href.startsWith('javascript:')) {
            event.preventDefault();
            
            if (link.href.startsWith('http') && !link.href.startsWith(window.location.origin)) {
              newsFrame.src = link.href;
            } else {
              iframeSrcHistory.push(link.href);
              newsFrame.src = link.href;
            }
            
            updateIframeBackButtonVisibility();
          }
        });
      } catch (e) {
        console.warn("Não foi possível configurar links da iframe:", e);
      }
    };

    sidebarToggleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateSidebarState(true);
    });
    
    iframeBackButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (iframeSrcHistory.length > 1) {
        iframeSrcHistory.pop();
        newsFrame.src = iframeSrcHistory[iframeSrcHistory.length - 1];
        updateIframeBackButtonVisibility();
      }
    });

    sidebarButtonsContainer.addEventListener('mousemove', resetInactivityTimer);
    sidebarButtonsContainer.addEventListener('touchstart', resetInactivityTimer, { passive: true });

    document.addEventListener('click', (event) => {
      if (!sidebarButtonsContainer.classList.contains('sidebar-container-condensed') && 
          !sidebarButtonsContainer.contains(event.target)) {
        updateSidebarState(false);
      }
    });

    newsFrame.addEventListener('load', () => {
      updateIframeBackButtonVisibility();
      setupIframeContentListeners();
      setupIframeLinks();
    });

    const iframeButtonLinks = sidebarButtonsContainer.querySelectorAll('a.icon-button:not(#sidebarToggleBtn):not(#iframeBackButton)');
    iframeButtonLinks.forEach(button => {
      button.addEventListener('click', event => {
        const targetHref = button.getAttribute('href');

        if (targetHref === 'Hyper/hyper' || targetHref === 'Yt/yt') return;
        if (targetHref === '#') return;

        event.preventDefault();
        let urlToLoad = targetHref === 'index' ? 'Catalogo1/index.html' : targetHref;
        
        iframeSrcHistory.push(urlToLoad);
        newsFrame.src = urlToLoad;
        updateIframeBackButtonVisibility();
      });
    });

    updateSidebarState(false);
    updateIframeBackButtonVisibility();
  }
});
