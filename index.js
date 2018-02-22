// Returns the top-left (Ax, Ay) and bottom-right (Bx, By) coordinates of
// `element`. Returns an object in the form `{ x: [Ax, Bx], y: [Ay, By] }`.
function calculateExtremeCoordinates (element) {
  var rect = element.getBoundingClientRect()
  var topX =
    rect.left + (window.pageYOffset || document.documentElement.scrollTop)
  var topY =
    rect.top + (window.pageXOffset || document.documentElement.scrollLeft)
  return {
    x: [topX, topX + element.offsetWidth],
    y: [topY, topY + element.offsetHeight]
  }
}

// Returns the gradient of a line drawn between point `A` and point `B`.
function calculateGradient (A, B) {
  return (B.y - A.y) / (B.x - A.x)
}

module.exports = function (menuElement, options) {
  var delay = options.delay || 200
  var menuItemSelector = options.menuItemSelector || '.menu-aim__item'
  var menuItemSubMenuSelector =
    options.menuItemSubMenuSelector || '.menu-aim__item-submenu'
  var menuItemActiveClassName =
    options.menuItemActiveClassName || 'menu-aim__item--active'
  var delayingClassName = options.delayingClassName || 'menu-aim--delaying'

  var previousMouseCoordinates = {}
  var currentMouseCoordinates = {}
  var timeoutId
  var activeMenuItem
  var activeSubMenuTopLeftCoordinates
  var activeSubMenuBottomLeftCoordinates
  var menuElementCoordinates = calculateExtremeCoordinates(menuElement)
  var extremeCoordinates

  function saveMouseCoordinates(x, y) {
    previousMouseCoordinates.x = currentMouseCoordinates.x
    previousMouseCoordinates.y = currentMouseCoordinates.y
    currentMouseCoordinates.x = x
    currentMouseCoordinates.y = y
  }

  // Return `true` if there currently isn't an active menu item, or if 
  // `currentMouseCoordinates` is outside of the triangle drawn between
  // `previousMouseCoordinates`, `activeSubMenuTopLeftCoordinates` and
  // `activeSubMenuBottomLeftCoordinates`.
  function shouldChangeActiveMenuItem () {
    return (
      !activeMenuItem ||
      calculateGradient(previousMouseCoordinates, activeSubMenuTopLeftCoordinates) <
        calculateGradient(currentMouseCoordinates, activeSubMenuTopLeftCoordinates) ||
      calculateGradient(previousMouseCoordinates, activeSubMenuBottomLeftCoordinates) >
        calculateGradient(currentMouseCoordinates, activeSubMenuBottomLeftCoordinates)
    )
  }

  function possiblyActivateMenuItem (menuItem) {
    cancelPendingMenuItemActivations()
    if (shouldChangeActiveMenuItem()) {
      deactivateActiveMenuItem()
      activateMenuItem(menuItem)
      return true
    }
  }

  function activateMenuItem (menuItem) {
    activeMenuItem = menuItem
    activeMenuItem.classList.add(menuItemActiveClassName)
    var activeSubMenu = activeMenuItem.querySelector(menuItemSubMenuSelector)
    var activeSubMenuCoordinates = calculateExtremeCoordinates(activeSubMenu)
    activeSubMenuTopLeftCoordinates = {
      x: activeSubMenuCoordinates.x[0],
      y: activeSubMenuCoordinates.y[0]
    }
    activeSubMenuBottomLeftCoordinates = {
      x: activeSubMenuCoordinates.x[0],
      y: activeSubMenuCoordinates.y[1]
    }
    extremeCoordinates = {
      x: [
        menuElementCoordinates.x[0],
        activeSubMenuTopLeftCoordinates.x + activeSubMenu.offsetWidth
      ],
      y: [
        menuElementCoordinates.y[0],
        activeSubMenuTopLeftCoordinates.y + activeSubMenu.offsetHeight
      ]
    }
  }

  function possiblyDeactivateActiveMenuItem () {
    var x = currentMouseCoordinates.x
    var y = currentMouseCoordinates.y
    if (
      x < extremeCoordinates.x[0] ||
      x > extremeCoordinates.x[1] ||
      y < extremeCoordinates.y[0] ||
      y > extremeCoordinates.y[1]
    ) {
      cancelPendingMenuItemActivations()
      deactivateActiveMenuItem()
    }
  }

  function deactivateActiveMenuItem () {
    if (activeMenuItem) {
      menuElement.classList.remove(delayingClassName)
      activeMenuItem.classList.remove(menuItemActiveClassName)
      activeMenuItem = null
      extremeCoordinates = menuElementCoordinates
    }
  }

  function cancelPendingMenuItemActivations () {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  function onMenuItemMouseEnter (event) {
    if (!possiblyActivateMenuItem(event.target)) {
      menuElement.classList.add(delayingClassName)
      timeoutId = setTimeout(function () {
        possiblyActivateMenuItem(menuItem)
      }, delay)      
    }
  }
  var menuItems = menuElement.querySelectorAll(menuItemSelector)
  var i = menuItems.length
  while (i--) {
    menuItems[i].addEventListener('mouseenter', onMenuItemMouseEnter)
  }

  function onWindowMouseMove (event) {
    saveMouseCoordinates(event.pageX, event.pageY)
    if (activeMenuItem) {
      possiblyDeactivateActiveMenuItem()
    }
  }
  window.addEventListener('mousemove', onWindowMouseMove)

  return function () {
    i = menuItems.length
    while (i--) {
      menuItems[i].removeEventListener('mouseenter', onMenuItemMouseEnter)
    }
    window.removeEventListener('mousemove', onWindowMouseMove)
  }
}
