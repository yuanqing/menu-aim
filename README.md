# menu-aim [![npm Version](http://img.shields.io/npm/v/menu-aim.svg?style=flat)](https://www.npmjs.org/package/menu-aim) [![Build Status](https://img.shields.io/travis/yuanqing/menu-aim.svg?branch=master&style=flat)](https://travis-ci.org/yuanqing/menu-aim) ![Stability Experimental](http://img.shields.io/badge/stability-experimental-red.svg?style=flat)

> [Instant mega menus](http://bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown) in vanilla JavaScript.

## API

> [**Editable demo (CodePen)**](https://codepen.io/lyuanqing/pen/paLgwN)

```js
const menuAim = require('menu-aim')
```

### menuAim(element [, options])

`element` is a DOM element with the following HTML structure:

```html
<ul class="menu-aim">
  <li class="menu-aim__item">
    <a class="menu-aim__item-name"><!-- ... --></a>
    <ul class="menu-aim__item-submenu"><!-- ... --></ul>
  </li>
  <!-- ... -->
</ul>
```

See the [demo](https://codepen.io/lyuanqing/pen/paLgwN) for the CSS styles required on `element` and the various nested elements.

`options`is an optional object literal:

Key | Description | Default
:--|:--|:--
`menuItemSelector` | Selector for each menu item. | `.menu-aim__item`
`menuItemActiveClassName` | Class name assigned to a menu item when it is active. | `menu-aim__item--active`
`menuItemSubMenuSelector` | Selector for the sub-menu element nested within each menu item. | `.menu-aim__item-submenu`
`delayingClassName` | Class name applied to `element` when some menu item is active but the mouse is determined to be enroute to the active submenu. | `menu-aim--delaying`


## Installation

Install via [yarn](https://yarnpkg.com):

```sh
$ yarn add menu-aim
```

Or [npm](https://npmjs.com):

```sh
$ npm install --save menu-aim
```

## Prior art

- [jQuery-menu-aim](https://github.com/kamens/jQuery-menu-aim)

## License

[MIT](LICENSE.md)
