Cling
======

Position elements relative to each other with this jQuery plugin.

Usage
-----

```js
$('.whatever').cling('.target', {
	from: '25% top',
	to: 'left 75%',
	offset: '-10 0'
})
```

If you need to update the options:

```js
$('.whatever').cling('options', {
	from: '25% bottom'
})
```

Or manually update the position:

```js
$('.whatever').cling('update')
```

And when you're done:

```js
$('.whatever').cling('destory')
```

Compatibility
-------------

Works on all major browsers jQuery supports. Cling also requires `requestAnimationFrame` to work properly, so you might need a [polyfill](http://paulirish.com/2011/requestanimationframe-for-smart-animating/) for older browsers.
