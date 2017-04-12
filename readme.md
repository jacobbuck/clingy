# clingy

Position elements relative to each other.

## Example

```js
import cling from 'clingy';

const whatever = document.querySelector('.whatever');
const target = document.querySelector('.target');

const myCling = cling(whatever, target, {
	from: '25%-10 top',
	to: 'left 75%'
});

myCling.forceUpdate();

myCling.destroy();
```

## Compatibility

Requires ES5 support and `requestAnimationFrame` support. Works with your usual shims.
