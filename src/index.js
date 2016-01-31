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

  function menuAim(element, options) {

    const rowSelector = options.rowSelector || '.menu-aim-item';
    const delay = options.delay || 250;
    const submenuDirection = options.submenuDirection || 'right';
    const activateCallback = options.activateCallback || noop;
    const deactivateCallback = options.deactivateCallback || noop;

    let activeRow = null;
    let timeoutId = null;
    let previousCoordinates = null;
    let currentCoordinates = null;
    let lastCheckedCoordinates = null;

    // Record the last 2 mouse coordinates.
    function saveMouseCoordinates(event) {
      previousCoordinates = currentCoordinates;
      currentCoordinates = {
        x: event.pageX,
        y: event.pageY
      };
    }

    // Cancel pending menu row activations.
    function cancelPendingRowActivations() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // Set `activeRow` to the given menu `row`, and activate it immediately.
    function activateRow(row) {
      if (row === activeRow) {
        // Exit if the menu `row` we want to activate is already
        // the `activeRow`.
        return;
      }
      if (activeRow) {
        // If there is an `activeRow`, deactivate it.
        deactivateCallback(activeRow);
      }
      // Activate the given menu `row`.
      activateCallback(row);
      activeRow = row;
    }

    // Check if we should activate the given menu `row`. If we find that the
    // mouse is moving towards the content of `activeRow`, attempt to activate
    // the row again after a `delay`.
    function possiblyActivateRow(row) {
      cancelPendingRowActivations();
      if (shouldChangeActiveRow()) {
        return activateRow(row);
      }
      timeoutId = setTimeout(() => {
        possiblyActivateRow(row);
      }, delay);
    }

    // Returns `true` if the `activeRow` should be set to a new row, else
    // returns `false`.
    function shouldChangeActiveRow() {

      // If there isn't an `activeRow`, activate the new row immediately.
      if (!activeRow) {
        return true;
      }

      const offset = computeElementOffset(element);
      const topLeft = {
        x: offset.left,
        y: offset.top
      };
      const topRight = {
        x: offset.left + element.offsetWidth,
        y: topLeft.y
      };
      const bottomLeft = {
        x: offset.left,
        y: offset.top + element.offsetHeight
      };
      const bottomRight = {
        x: offset.left + element.offsetWidth,
        y: bottomLeft.y
      };

      // Activate the new row immediately if `currentCoordinates` or
      // `previousCoordinates` are still their initial values.
      if (!currentCoordinates || !previousCoordinates) {
        return true;
      }

      // If the mouse was previously outside the menu's bounds, activate the
      // new row immediately.
      if (previousCoordinates.x < topLeft.x ||
          previousCoordinates.x > bottomRight.x ||
          previousCoordinates.y < topLeft.y ||
          previousCoordinates.y > bottomRight.y) {
        return true;
      }

      // If the mouse hasn't move since the last time we checked, activate the
      // new row immediately.
      if (lastCheckedCoordinates &&
          currentCoordinates.x === lastCheckedCoordinates.x &&
          currentCoordinates.y === lastCheckedCoordinates.y) {
        return true;
      }

      // Our expectations for decreasing or increasing gradients depends on
      // the direction that the submenu shows relative to the menu rows. For
      // example, if the submenu is on the right, expect the slope between the
      // mouse coordinate and the upper right corner to decrease over time.
      let decreasingCorner = topRight;
      let increasingCorner = bottomRight;
      if (submenuDirection === 'left') {
        decreasingCorner = bottomLeft;
        increasingCorner = topLeft;
      } else if (submenuDirection === 'below') {
        decreasingCorner = bottomRight;
        increasingCorner = bottomLeft;
      } else if (submenuDirection === 'above') {
        decreasingCorner = topLeft;
        increasingCorner = topRight;
      }
      const currentDecreasingSlope = computeGradient(currentCoordinates, decreasingCorner);
      const currentIncreasingSlope = computeGradient(currentCoordinates, increasingCorner);
      const previousDecreasingSlope = computeGradient(previousCoordinates, decreasingCorner);
      const previousIncreasingSlope = computeGradient(previousCoordinates, increasingCorner);
      if (currentDecreasingSlope < previousDecreasingSlope &&
          currentIncreasingSlope > previousIncreasingSlope) {
        // The mouse moved from `previousCoordinates` towards the content of
        // the `activeRow`, so we should wait before attempting to activate
        // the new menu row again.
        lastCheckedCoordinates = currentCoordinates;
        return false;
      }

      // The mouse was not moving towards the content of `activeRow`, so
      // immediately activate the new menu row.
      lastCheckedCoordinates = null;
      return true;
    }

    function onRowClick() {
      // Immediately activate the row that was clicked.
      cancelPendingRowActivations();
      activateRow(this);
    }

    function onRowMouseEnter() {
      // Attempt to activate the row that the mouse is currently mousing over.
      possiblyActivateRow(this);
    }

    // Hook up the required event listeners.
    const rows = [].slice.call(element.querySelectorAll(rowSelector));
    rows.forEach(row => {
      row.addEventListener('click', onRowClick);
      row.addEventListener('mouseenter', onRowMouseEnter);
    });
    document.addEventListener('mousemove', saveMouseCoordinates);
    element.addEventListener('mouseleave', cancelPendingRowActivations);

    // Return a function for unhooking all event listeners.
    return function() {
      rows.forEach(row => {
        row.removeEventListener('click', onRowClick);
        row.removeEventListener('mouseenter', onRowMouseEnter);
      });
      document.removeEventListener('mousemove', saveMouseCoordinates);
      element.removeEventListener('mouseleave', cancelPendingRowActivations);
    };

  }

  if (typeof module === 'object') {
    module.exports = menuAim;
  } else {
    window.menuAim = menuAim;
  }

})();
