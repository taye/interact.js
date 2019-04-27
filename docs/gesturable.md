Gesturable
==========

```html
<div id="rotate-area">
  <div id="angle-info">0&deg;</div>
  <svg id="arrow" viewbox="0 0 100 100">
    <polygon points="50,0 75,25 62.5,25 62.5,100 37.5,100 37.5,25 25,25" fill="#29e"></polygon>
  </svg>
</div>
```

```css
.draggable {
  touch-action: none;
  user-select: none;
}
```

```js
var angle = 0;

interact('#rotate-area').gesturable({
  onmove: function (event) {
    var arrow = document.getElementById('arrow');

    angle += event.da;

    arrow.style.webkitTransform =
    arrow.style.transform =
      'rotate(' + angle + 'deg)';

    document.getElementById('angle-info').textContent =
      angle.toFixed(2) + '\u00b0';
  }
});
```

Gesture events are triggered when two pointers go down and are moved.  In
gesture events, page and client coordinates are the averages of touch
coordinates and velocity is calculated from these averages. The events also have
the following properties:

| Gesture Event property  | Description                                       |
| ----------------------- | --------------------------------------------------|
| `distance`              | The distance between the event's first two touches|
| `angle`                 | The angle of the line made by the two touches     |
| `da`                    | The change in angle since previous event          |
| `scale`                 | The ratio of the distance of the start event to the distance of the current event |
| `ds`                    | The change in scale since the previous event      |
| `box`                   | A box enclosing all touch points                  |

<aside class="notice">
Remember to use CSS `touch-action: none` to prevent the browser from panning
when the user drags with a touch pointer, and `user-select: none` to disable
text selection.
</aside>
