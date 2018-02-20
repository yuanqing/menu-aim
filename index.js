// Compute the top and left coordinate of the given `element`.
function computeElementOffset (element) {
  var rect = element.getBoundingClientRect()
  return {
    top: rect.top + (window.pageXOffset || document.documentElement.scrollLeft),
    left: rect.left + (window.pageYOffset || document.documentElement.scrollTop)
  }
}

// Compute the gradient of a line drawn from `pointA` to `pointB`.
function computeGradient (pointA, pointB) {
  return (pointB.y - pointA.y) / (pointB.x - pointA.x)
}

function noop () {}

function manipulateClass (classListMethod) {
  return function (element, classNames) {
    classNames.forEach(function (className) {
      element.classList[classListMethod](className)
    })
  }
}
var addClasses = manipulateClass('add')
var removeClasses = manipulateClass('remove')

module.exports = function menuAim (menuElement, options) {
  var contentDirection = options.contentDirection || 'right'
  var delay = options.delay || 200
  var menuItemSelector = options.menuItemSelector || '.menu-aim__item'
  var menuItemActiveClassName = [].concat(
    options.menuItemActiveClassName || 'menu-aim__item--active'
  )
  var delayingClassName = [].concat(
    options.delayingClassName || 'menu-aim--delaying'
  )
  var activateCallback = options.activateCallback || noop
  var deactivateCallback = options.deactivateCallback || noop
  var mouseEnterCallback = options.mouseEnterCallback || noop
  var mouseLeaveCallback = options.mouseLeaveCallback || noop

  var activeMenuItem = null
  var timeoutId = null

  var previousCoordinates = null
  var currentCoordinates = null
  var lastCheckedCoordinates = null

  // Compute the pixel coordinates of the four corners of the block taken up
  // by all the items that match the `menuItemSelector`.
  var offset = computeElementOffset(menuElement)
  var topLeft = {
    x: offset.left,
    y: offset.top
  }
  var topRight = {
    x: offset.left + menuElement.offsetWidth,
    y: topLeft.y
  }
  var bottomLeft = {
    x: offset.left,
    y: offset.top + menuElement.offsetHeight
  }
  var bottomRight = {
    x: offset.left + menuElement.offsetWidth,
    y: bottomLeft.y
  }

  // Our expectations for decreasing or increasing gradients depends on
  // the direction that the menu content shows relative to the menu items.
  // For example, if the content is on the right, expect the slope between
  // the mouse coordinate and the upper right corner to decrease over time.
  var decreasingCorner
  var increasingCorner
  switch (contentDirection) {
    case 'top':
      decreasingCorner = topLeft
      increasingCorner = topRight
      break
    case 'bottom':
      decreasingCorner = bottomRight
      increasingCorner = bottomLeft
      break
    case 'left':
      decreasingCorner = bottomLeft
      increasingCorner = topLeft
      break
    default:
      decreasingCorner = topRight
      increasingCorner = bottomRight
      break
  }

  // Record the last 2 mouse coordinates.
  function saveMouseCoordinates (event) {
    previousCoordinates = currentCoordinates
    currentCoordinates = {
      x: event.pageX,
      y: event.pageY
    }
  }

  // Cancel pending menu item activations.
  function cancelPendingMenuItemActivations () {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  function deactivateActiveMenuItem () {
    if (activeMenuItem) {
      // If there is an `activeMenuItem`, deactivate it.
      removeClasses(activeMenuItem, menuItemActiveClassName)
      deactivateCallback(activeMenuItem)
      activeMenuItem = null
    }
  }

  // Set `activeMenuItem` to the given `menuItem`, and activate
  // it immediately.
  function activateMenuItem (menuItem) {
    if (menuItem === activeMenuItem) {
      // Exit if the `menuItem` we want to activate is already
      // the `activeMenuItem`.
      return
    }
    deactivateActiveMenuItem()
    // Activate the given `menuItem`.
    addClasses(menuItem, menuItemActiveClassName)
    activateCallback(menuItem)
    activeMenuItem = menuItem
  }

  // Returns `true` if the `activeMenuItem` should be set to a new menu
  // item, else returns `false`.
  function shouldChangeActiveMenuItem () {
    if (
      // If there isn't an `activeMenuItem`, activate the new menu item
      // immediately.
      !activeMenuItem ||
      // If `currentCoordinates` or `previousCoordinates` are still their
      // initial values, activate the new menu item immediately.
      !currentCoordinates ||
      !previousCoordinates ||
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
      // the direction that the content shows relative to the menu items. For
      // example, if the content is on the right, expect the slope between
      // the mouse coordinate and the upper right corner to decrease over
      // time. If either of the below two conditions are true, the mouse was
      // not moving towards the content of `activeMenuItem`, so we activate
      // the new menu item immediately.
      computeGradient(currentCoordinates, decreasingCorner) >
        computeGradient(previousCoordinates, decreasingCorner) ||
      computeGradient(currentCoordinates, increasingCorner) <
        computeGradient(previousCoordinates, increasingCorner)
    ) {
      lastCheckedCoordinates = null
      removeClasses(menuElement, delayingClassName)
      return true
    }

    // The mouse moved from `previousCoordinates` towards the content of
    // the `activeMenuItem`, so we should wait before attempting to activate
    // the new menu item again.
    lastCheckedCoordinates = currentCoordinates
    addClasses(menuElement, delayingClassName)
    return false
  }

  // Check if we should activate the given `menuItem`. If we find that the
  // mouse is moving towards the content of the `activeMenuItem`, attempt to
  // activate the `menuItem` again after a short `delay`.
  function possiblyActivateMenuItem (menuItem) {
    cancelPendingMenuItemActivations()
    if (shouldChangeActiveMenuItem()) {
      return activateMenuItem(menuItem)
    }
    timeoutId = setTimeout(function () {
      possiblyActivateMenuItem(menuItem)
    }, delay)
  }

  function onMouseLeave () {
    // Attempt to deactivate the `activeMenuItem` if we have left the menu
    // `menuElement` entirely.
    if (shouldChangeActiveMenuItem()) {
      cancelPendingMenuItemActivations()
      mouseLeaveCallback(activeMenuItem)
      deactivateActiveMenuItem()
    }
  }

  function onMenuItemClick () {
    // Immediately activate the menu item that was clicked.
    cancelPendingMenuItemActivations()
    activateMenuItem(this)
  }

  function onMenuItemMouseEnter () {
    // Attempt to activate the menu item that the mouse is currently
    // mousing over.
    var isMouseEnter = activeMenuItem === null
    possiblyActivateMenuItem(this)
    if (isMouseEnter) {
      mouseEnterCallback(activeMenuItem)
    }
  }

  function deactivateIfClickedOutsideMenu (event) {
    var targetElement = event.target
    while (targetElement && targetElement !== menuElement) {
      targetElement = targetElement.parentNode
    }
    if (!targetElement) {
      deactivateActiveMenuItem()
    }
  }

  // Bind the required event listeners.
  var menuItems = [].slice.call(menuElement.querySelectorAll(menuItemSelector))
  menuItems.forEach(function (menuItem) {
    menuItem.addEventListener('click', onMenuItemClick)
    menuItem.addEventListener('mouseenter', onMenuItemMouseEnter)
  })
  window.addEventListener('mousemove', saveMouseCoordinates)
  window.addEventListener('scroll', deactivateActiveMenuItem)
  window.addEventListener('click', deactivateIfClickedOutsideMenu)
  menuElement.addEventListener('mouseleave', onMouseLeave)

  // Return a function for unbinding all event listeners.
  return function () {
    menuItems.forEach(function (menuItem) {
      menuItem.removeEventListener('click', onMenuItemClick)
      menuItem.removeEventListener('mouseenter', onMenuItemMouseEnter)
    })
    window.removeEventListener('mousemove', saveMouseCoordinates)
    window.removeEventListener('scroll', deactivateActiveMenuItem)
    window.removeEventListener('click', deactivateIfClickedOutsideMenu)
    menuElement.removeEventListener('mouseleave', onMouseLeave)
  }
}
