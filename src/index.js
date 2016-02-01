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

    // Set `activeMenuItem` to the given menu `row`, and activate it immediately.
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

    // Returns `true` if the `activeMenuItem` should be set to a new row, else
    // returns `false`.
    function shouldChangeActiveMenuItem() {

      // If there isn't an `activeMenuItem`, activate the new row immediately.
      if (!activeMenuItem) {
        return true;
      }

      // Activate the new menu item immediately if `currentCoordinates` or
      // `previousCoordinates` are still their initial values.
      if (!currentCoordinates || !previousCoordinates) {
        return true;
      }

      // If the mouse was previously outside the menu's bounds, activate the
      // new menu item immediately.
      if (previousCoordinates.x < topLeft.x ||
          previousCoordinates.x > bottomRight.x ||
          previousCoordinates.y < topLeft.y ||
          previousCoordinates.y > bottomRight.y) {
        return true;
      }

      // If the mouse hasn't moved since the last time we checked, activate the
      // new menu item immediately.
      if (lastCheckedCoordinates &&
          currentCoordinates.x === lastCheckedCoordinates.x &&
          currentCoordinates.y === lastCheckedCoordinates.y) {
        return true;
      }

      // Our expectations for decreasing or increasing gradients depends on
      // the direction that the submenu shows relative to the menu items. For
      // example, if the submenu is on the right, expect the slope between the
      // mouse coordinate and the upper right corner to decrease over time.
      const currentDecreasingGradient = computeGradient(currentCoordinates, decreasingCorner);
      const currentIncreasingGradient = computeGradient(currentCoordinates, increasingCorner);
      const previousDecreasingGradient = computeGradient(previousCoordinates, decreasingCorner);
      const previousIncreasingGradient = computeGradient(previousCoordinates, increasingCorner);
      if (currentDecreasingGradient < previousDecreasingGradient &&
          currentIncreasingGradient > previousIncreasingGradient) {
        // The mouse moved from `previousCoordinates` towards the content of
        // the `activeMenuItem`, so we should wait before attempting to activate
        // the new menu row again.
        lastCheckedCoordinates = currentCoordinates;
        return false;
      }

      // The mouse was not moving towards the content of `activeMenuItem`, so
      // immediately activate the new menu row.
      lastCheckedCoordinates = null;

      return true;
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
      // Immediately activate the row that was clicked.
      cancelPendingMenuItemActivations();
      activateMenuItem(this);
    }

    function onMenuItemMouseEnter() {
      // Attempt to activate the row that the mouse is currently mousing over.
      possiblyActivateMenuItem(this);
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
