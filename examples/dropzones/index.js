let transformProp;

interact.maxInteractions(Infinity);

// setup draggable elements.
interact('.js-drag')
  .draggable({
    max: Infinity,
    snap: {
      targets: [interact.createSnapGrid({ x: 100, y: 100 })],
      relativePoints: [{ x: 0.5, y: 0.5 }],
    },
  })
  .on('dragstart', function (event) {
    const interaction = event._interaction
    interaction.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
    interaction.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
  })
  .on('dragmove', function (event) {
    const interaction = event._interaction
    interaction.x += event.dx;
    interaction.y += event.dy;

    if (transformProp) {
      event.target.style[transformProp] =
        'translate(' + interaction.x + 'px, ' + interaction.y + 'px)';
    }
    else {
      event.target.style.left = interaction.x + 'px';
      event.target.style.top  = interaction.y + 'px';
    }
  })
  .on('dragend', function (event) {
    event.target.setAttribute('data-x', interaction.x);
    event.target.setAttribute('data-y', interaction.y);
  });

// setup drop areas.
// dropzone #1 accepts draggable #1
setupDropzone('#drop1', '#drag1');
// dropzone #2 accepts draggable #1 and #2
setupDropzone('#drop2', '#drag1, #drag2');
// every dropzone accepts draggable #3
setupDropzone('.js-drop', '#drag3');

/**
 * Setup a given element as a dropzone.
 *
 * @param {HTMLElement|String} el
 * @param {String} accept
 */
function setupDropzone (el, accept) {
  interact(el)
    .on('dropactivate', e => { console.log(e.type); e.reject(); })
    .dropzone({
      accept: accept,
      ondropactivate: function (event) {
        addClass(event.relatedTarget, '-drop-possible');
      },
      ondropdeactivate: function (event) {
        removeClass(event.relatedTarget, '-drop-possible');
      },
    })
    .on('dropactivate', function (event) {
      const active = event.target.getAttribute('active')|0;

      // change style if it was previously not active
      if (active === 0) {
        addClass(event.target, '-drop-possible');
        event.target.textContent = 'Drop me here!';
      }

      event.target.setAttribute('active', active + 1);
    })
    .on('dropdeactivate', function (event) {
      const active = event.target.getAttribute('active')|0;

      // change style if it was previously active
      // but will no longer be active
      if (active === 1) {
        removeClass(event.target, '-drop-possible');
        event.target.textContent = 'Dropzone';
      }

      event.target.setAttribute('active', active - 1);
    })
    .on('dragenter', function (event) {
      addClass(event.target, '-drop-over');
      event.relatedTarget.textContent = 'I\'m in';
    })
    .on('dragleave', function (event) {
      removeClass(event.target, '-drop-over');
      event.relatedTarget.textContent = 'Drag me…';
    })
    .on('drop', function (event) {
      removeClass(event.target, '-drop-over');
      event.relatedTarget.textContent = 'Dropped';
    });
}

function addClass (element, className) {
  if (element.classList) {
    return element.classList.add(className);
  }
  else {
    element.className += ' ' + className;
  }
}

function removeClass (element, className) {
  if (element.classList) {
    return element.classList.remove(className);
  }
  else {
    element.className = element.className.replace(new RegExp(className + ' *', 'g'), '');
  }
}

interact(document).on('ready', function () {
  transformProp = 'transform' in document.body.style
    ? 'transform': 'webkitTransform' in document.body.style
      ? 'webkitTransform': 'mozTransform' in document.body.style
        ? 'mozTransform': 'oTransform' in document.body.style
          ? 'oTransform': 'msTransform' in document.body.style
            ? 'msTransform': null;
});
