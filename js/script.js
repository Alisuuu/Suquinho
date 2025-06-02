window.addEventListener('load', () => {
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const sidebarButtonsContainer = document.querySelector('.sidebar-buttons');
  const newsFrame = document.getElementById('newsFrame'); // Get iframe element

  let inactivityTimerId;
  const INACTIVITY_TIMEOUT_MS = 5000; // 5 segundos para inatividade

  if (toggleSidebarBtn && sidebarButtonsContainer) {
    const buttonsToToggle = Array.from(sidebarButtonsContainer.children)
      .filter(child => child.classList.contains('icon-button') && child.id !== 'toggleSidebarBtn');
    const toggleIconElement = toggleSidebarBtn.querySelector('i');

    // Function to reset the inactivity timer
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimerId);
      // Only start the timer if the sidebar is open (icon 'fa-times')
      if (toggleIconElement && toggleIconElement.classList.contains('fa-times')) {
        inactivityTimerId = setTimeout(() => {
          // console.log('Inactivity timeout, closing sidebar.'); // For debugging
          updateSidebarState(false); // Close the sidebar
        }, INACTIVITY_TIMEOUT_MS);
      }
    };

    // Main function to update the sidebar state
    const updateSidebarState = (showOtherButtons) => {
      buttonsToToggle.forEach(button => {
        if (showOtherButtons) {
          button.classList.remove('sidebar-item-hidden');
        } else {
          button.classList.add('sidebar-item-hidden');
        }
      });

      if (showOtherButtons) {
        // Sidebar is open or opening
        sidebarButtonsContainer.classList.remove('sidebar-container-condensed');
        toggleSidebarBtn.classList.remove('toggle-btn-shrunk');
        if (toggleIconElement) {
          toggleIconElement.classList.remove('fa-bars');
          toggleIconElement.classList.add('fa-times');
        }
        toggleSidebarBtn.setAttribute('title', 'Esconder ícones');
        resetInactivityTimer(); // Start/restart the timer when the sidebar opens
      } else {
        // Sidebar is closed or closing
        sidebarButtonsContainer.classList.add('sidebar-container-condensed');
        toggleSidebarBtn.classList.add('toggle-btn-shrunk');
        if (toggleIconElement) {
          toggleIconElement.classList.remove('fa-times');
          toggleIconElement.classList.add('fa-bars');
        }
        toggleSidebarBtn.setAttribute('title', 'Mostrar ícones');
        clearTimeout(inactivityTimerId); // Clear the timer when the sidebar closes
      }
    };

    // Click event for the toggle button
    toggleSidebarBtn.addEventListener('click', (event) => {
      event.preventDefault(); 
      event.stopPropagation(); 
      // Check if any button (other than toggle) is currently hidden to determine action
      const isAnyButtonHidden = buttonsToToggle.some(button => button.classList.contains('sidebar-item-hidden'));
      updateSidebarState(isAnyButtonHidden); // If any is hidden, show all; otherwise, hide all
    });
    
    // Reset timer with interactions in the sidebar area
    sidebarButtonsContainer.addEventListener('mousemove', resetInactivityTimer);
    sidebarButtonsContainer.addEventListener('touchstart', resetInactivityTimer, { passive: true });


    // Click event outside the sidebar to close it
    document.addEventListener('click', (event) => {
      const isSidebarOpen = toggleIconElement && toggleIconElement.classList.contains('fa-times');
      // Ensure the click was not within the sidebar container or its direct children (buttons)
      if (isSidebarOpen && !sidebarButtonsContainer.contains(event.target)) {
         updateSidebarState(false); 
      }
    });

    // Scroll event in the iframe to close the sidebar
    if (newsFrame) {
      const handleFrameScroll = () => {
        const isSidebarOpen = toggleIconElement && toggleIconElement.classList.contains('fa-times');
        if (isSidebarOpen) {
          // console.log('Iframe scrolled, closing sidebar.'); // For debugging
          updateSidebarState(false);
        }
      };

      // Add scroll listener after the iframe has loaded
      newsFrame.addEventListener('load', () => {
        try {
          if (newsFrame.contentWindow) {
            newsFrame.contentWindow.addEventListener('scroll', handleFrameScroll);
          }
        } catch (e) {
          console.warn("Could not add scroll listener to iframe contentWindow (possibly due to cross-origin restrictions).", e);
        }
      });
    }

    // Initial state setup and timer
    // Based on the premise that buttons start visible (without 'sidebar-item-hidden' class in HTML)
    const isAnyInitiallyHidden = buttonsToToggle.some(btn => btn.classList.contains('sidebar-item-hidden'));
    if (isAnyInitiallyHidden) {
        updateSidebarState(false); // Ensures icon is 'fa-bars' and timer is cleared if starting hidden
    } else {
        updateSidebarState(true);  // Ensures icon is 'fa-times' and timer starts if starting visible
    }
  }
});

