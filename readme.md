> # :rotating_light: Deprecated
> 
> This project is no longer being maintained. I'd recommend using the popular [Popper](https://github.com/popperjs/popper-core) package instead as it's	mature, better tested, and offers more features.

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
