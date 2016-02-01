(() => {

  // Compute the top and left coordinate of the given `element`.
  function computeElementOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + (window.pageXOffset || document.documentElement.scrollLeft),
      left: rect.left + (window.pageYOffset || document.documentElement.scrollTop)
    };
  }

  // Compute the gradient of a line drawn from `pointA` to `pointB`.
  function computeGradient(pointA, pointB) {
    return (pointB.y - pointA.y) / (pointB.x - pointA.x);
  }

  function noop() {}

  const defaultOptions = {
    menuItemSelector: '.menu-aim__item',
    delayingClassName: 'menu-aim--delaying',
    activeMenuItemClassName: 'menu-aim__item--active',
    delay: 200,
    submenuDirection: 'right',
    activateCallback: noop,
    deactivateCallback: noop,
    mouseEnterCallback: noop,
    mouseLeaveCallback: noop
  };

  function menuAim(element, options = {}) {

    options = Object.assign({}, defaultOptions, options);

    let activeMenuItem = null;
    let timeoutId = null;

    let previousCoordinates = null;
    let currentCoordinates = null;
    let lastCheckedCoordinates = null;

    // Compute the pixel coordinates of the four corners of the block taken up
    // by all the items that match the `menuItemSelector`.
    const offset = computeElementOffset(element);
    const topLeft = {
      x: offset.left,
      y: offset.top - 100
    };
    const topRight = {
      x: offset.left + element.offsetWidth,
      y: topLeft.y
    };
    const bottomLeft = {
      x: offset.left,
      y: offset.top + element.offsetHeight + 100
    };
    const bottomRight = {
      x: offset.left + element.offsetWidth,
      y: bottomLeft.y
    };

    // Our expectations for decreasing or increasing gradients depends on
    // the direction that the submenu shows relative to the menu items. For
    // example, if the submenu is on the right, expect the slope between the
    // mouse coordinate and the upper right corner to decrease over time.
    let decreasingCorner;
    let increasingCorner;
    switch (options.submenuDirection) {
      case 'top':
        decreasingCorner = topLeft;
        increasingCorner = topRight;
        break;
      case 'bottom':
        decreasingCorner = bottomRight;
        increasingCorner = bottomLeft;
        break;
      case 'left':
        decreasingCorner = bottomLeft;
        increasingCorner = topLeft;
        break;
      default:
        decreasingCorner = topRight;
        increasingCorner = bottomRight;
        break;
    }

    // Record the last 2 mouse coordinates.
    function saveMouseCoordinates(event) {
      previousCoordinates = currentCoordinates;
      currentCoordinates = {
        x: event.pageX,
        y: event.pageY
      };
    }

    // Cancel pending menu item activations.
    function cancelPendingMenuItemActivations() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    function deactivateActiveMenuItem() {
      if (activeMenuItem) {
        // If there is an `activeMenuItem`, deactivate it.
        activeMenuItem.classList.remove(options.activeMenuItemClassName);
        options.deactivateCallback(activeMenuItem);
        activeMenuItem = null;
      }
    }

    // Set `activeMenuItem` to the given `menuItem`, and activate
    // it immediately.
    function activateMenuItem(menuItem) {
      if (menuItem === activeMenuItem) {
        // Exit if the `menuItem` we want to activate is already
        // the `activeMenuItem`.
        return;
      }
      deactivateActiveMenuItem();
      // Activate the given `menuItem`.
      menuItem.classList.add(options.activeMenuItemClassName);
      options.activateCallback(menuItem);
      activeMenuItem = menuItem;
    }

    // Check if we should activate the given `menuItem`. If we find that the
    // mouse is moving towards the submenu of the `activeMenuItem`, attempt to
    // activate the `menuItem` again after a short `delay`.
    function possiblyActivateMenuItem(menuItem) {
      cancelPendingMenuItemActivations();
      if (shouldChangeActiveMenuItem()) {
        return activateMenuItem(menuItem);
      }
      timeoutId = setTimeout(() => {
        possiblyActivateMenuItem(menuItem);
      }, options.delay);
    }

    // Returns `true` if the `activeMenuItem` should be set to a new menu
    // item, else returns `false`.
    function shouldChangeActiveMenuItem() {

      if (

        // If there isn't an `activeMenuItem`, activate the new menu item
        // immediately.
        !activeMenuItem ||

        // If `currentCoordinates` or `previousCoordinates` are still their
        // initial values, activate the new menu item immediately.
        !currentCoordinates || !previousCoordinates ||

        // If the mouse was previously outside the menu's bounds, activate the
        // new menu item immediately.
        previousCoordinates.x < topLeft.x ||
        previousCoordinates.x > bottomRight.x ||
        previousCoordinates.y < topLeft.y ||
        previousCoordinates.y > bottomRight.y ||

        // If the mouse hasn't moved since the last time we checked, activate the
        // new menu item immediately.
        (lastCheckedCoordinates &&
         currentCoordinates.x === lastCheckedCoordinates.x &&
         currentCoordinates.y === lastCheckedCoordinates.y) ||

        // Our expectations for decreasing or increasing gradients depends on
        // the direction that the submenu shows relative to the menu items. For
        // example, if the submenu is on the right, expect the slope between
        // the mouse coordinate and the upper right corner to decrease over
        // time. If either of the below two conditions are true, the mouse was
        // not moving towards the content of `activeMenuItem`, so we activate
        // the new menu item immediately.
        computeGradient(currentCoordinates,  decreasingCorner) >
        computeGradient(previousCoordinates, decreasingCorner) ||
        computeGradient(currentCoordinates,  increasingCorner) <
        computeGradient(previousCoordinates, increasingCorner)

      ) {
        lastCheckedCoordinates = null;
        element.classList.remove(options.delayingClassName);
        return true;
      }

      // The mouse moved from `previousCoordinates` towards the content of
      // the `activeMenuItem`, so we should wait before attempting to activate
      // the new menu item again.
      lastCheckedCoordinates = currentCoordinates;
      element.classList.add(options.delayingClassName);
      return false;
    }

    function onMouseLeave() {
      // Attempt to deactivate the `activeMenuItem` if we have left the menu
      // `element` entirely.
      if (shouldChangeActiveMenuItem()) {
        cancelPendingMenuItemActivations();
        options.mouseLeaveCallback(activeMenuItem);
        deactivateActiveMenuItem();
      }
    }

    function onMenuItemClick() {
      // Immediately activate the menu item that was clicked.
      cancelPendingMenuItemActivations();
      activateMenuItem(this);
    }

    function onMenuItemMouseEnter() {
      // Attempt to activate the menu item that the mouse is currently
      // mousing over.
      var isMouseEnter = activeMenuItem === null;
      possiblyActivateMenuItem(this);
      if (isMouseEnter) {
        options.mouseEnterCallback(activeMenuItem);
      }
    }

    // Hook up the required event listeners.
    const menuItems = [].slice.call(element.querySelectorAll(options.menuItemSelector));
    menuItems.forEach((menuItem) => {
      menuItem.addEventListener('click', onMenuItemClick);
      menuItem.addEventListener('mouseenter', onMenuItemMouseEnter);
    });
    document.addEventListener('mousemove', saveMouseCoordinates);
    element.addEventListener('mouseleave', onMouseLeave);

    // Return a function for unhooking all event listeners.
    return function() {
      menuItems.forEach((menuItem) => {
        menuItem.removeEventListener('click', onMenuItemClick);
        menuItem.removeEventListener('mouseenter', onMenuItemMouseEnter);
      });
      document.removeEventListener('mousemove', saveMouseCoordinates);
      element.removeEventListener('mouseleave', onMouseLeave);
    };

  }

  if (typeof module === 'object') {
    module.exports = menuAim;
  } else {
    window.menuAim = menuAim;
  }

})();
