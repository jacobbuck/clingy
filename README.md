# clingy

Position elements relative to each other.

## Example

```js
var cling = require('clingy');

var whatever = document.querySelector('.whatever');
var target = document.querySelector('.target');

var myCling = cling(whatever, target, {
	from: '25%-10 top',
	to: 'left 75%'
});

myCling.forceUpdate();

myCling.destroy();
```

## Compatibility

Requires ES5 support and `requestAnimationFrame` support. Works with your usual shims.
