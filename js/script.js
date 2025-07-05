document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader-overlay');
  const lazyIframes = document.querySelectorAll('iframe[data-src]');
  
  if (lazyIframes.length > 0) {
    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          if (iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
            iframe.removeAttribute('data-src');
          }
          observerInstance.unobserve(iframe);
        }
      });
    }, { 
      rootMargin: '50px' 
    });

    lazyIframes.forEach(iframe => {
      observer.observe(iframe);
    });
  }

  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarButtonsContainer = document.querySelector('.sidebar-buttons');
  const newsFrame = document.getElementById('newsFrame');
  const iframeBackButton = document.getElementById('iframeBackButton');

  const HOME_PAGE = 'Catalogo1/index.html';
  
  const urlParams = new URLSearchParams(window.location.search);
  const paginaParaCarregar = urlParams.get('pagina');
  const initialPage = paginaParaCarregar ? decodeURIComponent(paginaParaCarregar) : HOME_PAGE;

  let iframeSrcHistory = [initialPage]; 

  if (!sidebarToggleBtn || !sidebarButtonsContainer || !newsFrame || !iframeBackButton) return;

  if (!newsFrame.src) {
      newsFrame.dataset.src = initialPage;
  }

  const toggleIconElement = sidebarToggleBtn.querySelector('i');
  
  const buttonsToToggleVisibility = Array.from(sidebarButtonsContainer.children)
    .filter(child =>
      child.classList.contains('icon-button') &&
      child.id !== 'sidebarToggleBtn' &&
      child.id !== 'iframeBackButton' &&
      !['index', HOME_PAGE].includes(child.getAttribute('href'))
    );

  const isIframeHome = () => {
    const currentSrc = newsFrame.src || (newsFrame.dataset && newsFrame.dataset.src);
    return currentSrc && currentSrc.endsWith(HOME_PAGE);
  };

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

  const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const setupIframeContentListeners = () => {
    if (newsFrame.contentWindow) {
      const handleFrameInteraction = () => {
        if (!sidebarButtonsContainer.classList.contains('sidebar-container-condensed')) {
          if (isIframeHome()) updateSidebarState(false);
        }
      };

      newsFrame.contentWindow.addEventListener('scroll', debounce(handleFrameInteraction, 200));
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

  const iframeButtonLinks = sidebarButtonsContainer.querySelectorAll('a.icon-button:not(#sidebarToggleBtn):not(#iframeBackButton):not(#openThemeModalBtn)');
  
  iframeButtonLinks.forEach(button => {
    const href = button.getAttribute('href');
    if (href === 'index' || href === HOME_PAGE) {
      button.style.display = 'none';
      return;
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const href = button.getAttribute('href');
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
    const loader = document.getElementById('loader-overlay');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 100);
    }
  });
  
  history.replaceState({ iframe: initialPage }, '', '');
  updateSidebarState(false);
  updateIframeBackButtonVisibility();

  const fullscreenBtn = document.getElementById('fullscreenBtn');

  const checkScreen = () => {
    if(fullscreenBtn){
      if (window.innerWidth > 768) {
        fullscreenBtn.style.display = 'flex';
      } else {
        fullscreenBtn.style.display = 'none';
      }
    }
  };

  window.addEventListener('resize', checkScreen);
  checkScreen();
  
  if(fullscreenBtn) {
    fullscreenBtn.addEventListener('mouseenter', () => {
      fullscreenBtn.style.background = 'rgba(255,255,255,0.1)';
    });
    fullscreenBtn.addEventListener('mouseleave', () => {
      fullscreenBtn.style.background = 'rgba(0,0,0,0.4)';
    });
  
    fullscreenBtn.addEventListener('click', () => {
      const docEl = document.documentElement;
  
      if (!document.fullscreenElement) {
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) docEl.webkitExitFullscreen();
        else if (document.msExitFullscreen) docEl.msExitFullscreen();
      }
    });
  
    document.addEventListener('fullscreenchange', () => {
      const icon = fullscreenBtn.querySelector('i');
      if (!icon) return;

      if (document.fullscreenElement) {
        icon.classList.remove('fa-expand');
        icon.classList.add('fa-compress');
      } else {
        icon.classList.remove('fa-compress');
        icon.classList.add('fa-expand');
      }
    });
  }

  const themeModal = document.getElementById('themeSelectionModal');
  const openThemeModalBtn = document.getElementById('openThemeModalBtn');
  const closeThemeModalBtn = themeModal ? themeModal.querySelector('.theme-modal-close') : null;
  const themeButtons = themeModal ? themeModal.querySelectorAll('.theme-modal-button') : [];

  if (openThemeModalBtn && themeModal && closeThemeModalBtn) {
    openThemeModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      themeModal.style.display = 'flex';
    });

    closeThemeModalBtn.addEventListener('click', () => {
      themeModal.style.display = 'none';
    });

    themeModal.addEventListener('click', (event) => {
      if (event.target === themeModal) {
        themeModal.style.display = 'none';
      }
    });

    themeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const theme = e.target.dataset.theme;
        const loader = document.getElementById('loader-overlay');
        
        if (loader) {
            loader.classList.remove('hidden');
        }

        localStorage.setItem('selectedTheme', theme);
        
        setTimeout(() => {
            location.reload();
        }, 200); 
      });
    });
  }
});
