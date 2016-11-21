Cling
======

Position elements relative to each other.

Example
-------

```js
var $whatever = document.querySelector('.whatever');
var $target = document.querySelector('.target');

var myCling = cling($whatever, $target, {
	from: '25%-10 top',
	to: 'left 75%'
});

myCling.forceUpdate();

<<<<<<< HEAD
myCling.destroy();
=======
Or manually update the position:

```js
$('.whatever').cling('update')
```

And when you're done:

```js
$('.whatever').cling('destory')
>>>>>>> 40c2e6408eba70bbd222458bf578e20dace491da
```

Compatibility
-------------

Requires ES5 support and `requestAnimationFrame` support. Works with polyfills.
