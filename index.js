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

function computeGradient (pointA, pointB) {
  return (pointB.y - pointA.y) / (pointB.x - pointA.x)
}

module.exports = function (menuElement, options) {
  var delay = options.delay || 200
  var menuItemSelector = options.menuItemSelector || '.menu-aim__item'
  var menuItemSubMenuSelector =
    options.menuItemSubMenuSelector || '.menu-aim__item-submenu'
  var menuItemActiveClassName =
    options.menuItemActiveClassName || 'menu-aim__item--active'
  var delayingClassName = options.delayingClassName || 'menu-aim--delaying'

  var timeoutId
  var activeMenuItem
  var activeSubMenu
  var activeSubMenuOffset
  var increasingCorner
  var decreasingCorner
  var previousCoordinates = {}
  var currentCoordinates = {}

  function cancelPendingMenuItemActivations () {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  function shouldChangeActiveMenuItem () {
    return (
      !activeMenuItem ||
      computeGradient(previousCoordinates, increasingCorner) <
        computeGradient(currentCoordinates, increasingCorner) ||
      computeGradient(previousCoordinates, decreasingCorner) >
        computeGradient(currentCoordinates, decreasingCorner)
    )
  }

  function calculateMenuElementExtremeCoordinates () {
    var menuElementCoordinates = calculateExtremeCoordinates(menuElement)
    if (!activeMenuItem) {
      return menuElementCoordinates
    }
    return {
      x: [
        menuElementCoordinates.x[0],
        activeSubMenuOffset.x[0] + activeSubMenu.offsetWidth
      ],
      y: [
        menuElementCoordinates.y[0],
        activeSubMenuOffset.y[0] + activeSubMenu.offsetHeight
      ]
    }
  }

  function possiblyDeactivateActiveMenuItem () {
    var x = currentCoordinates.x
    var y = currentCoordinates.y
    var coordinates = calculateMenuElementExtremeCoordinates()
    if (
      x < coordinates.x[0] ||
      x > coordinates.x[1] ||
      y < coordinates.y[0] ||
      y > coordinates.y[1]
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
      increasingCorner = null
      decreasingCorner = null
    }
  }

  function activateMenuItem (menuItem) {
    activeMenuItem = menuItem
    activeMenuItem.classList.add(menuItemActiveClassName)
    activeSubMenu = activeMenuItem.querySelector(menuItemSubMenuSelector)
    activeSubMenuOffset = calculateExtremeCoordinates(activeSubMenu)
    increasingCorner = {
      x: activeSubMenuOffset.x[0],
      y: activeSubMenuOffset.y[0]
    }
    decreasingCorner = {
      x: activeSubMenuOffset.x[0],
      y: activeSubMenuOffset.y[1]
    }
  }

  function onMenuItemMouseEnter (event) {
    possiblyActivateMenuItem(event.target)
  }

  function possiblyActivateMenuItem (menuItem) {
    cancelPendingMenuItemActivations()
    if (shouldChangeActiveMenuItem()) {
      deactivateActiveMenuItem()
      activateMenuItem(menuItem)
      return
    }
    menuElement.classList.add(delayingClassName)
    timeoutId = setTimeout(function () {
      possiblyActivateMenuItem(menuItem)
    }, delay)
  }

  function onWindowMouseMove (event) {
    previousCoordinates.x = currentCoordinates.x
    previousCoordinates.y = currentCoordinates.y
    currentCoordinates.x = event.pageX
    currentCoordinates.y = event.pageY
    if (activeMenuItem) {
      possiblyDeactivateActiveMenuItem()
    }
  }

  var menuItems = menuElement.querySelectorAll(menuItemSelector)
  var i = menuItems.length
  while (i--) {
    menuItems[i].addEventListener('mouseenter', onMenuItemMouseEnter)
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
