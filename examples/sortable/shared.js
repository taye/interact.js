import interact from '@interactjs/interactjs'

function sortListener (event) {
  console.log(event.type, event.position)
}

export function getData () {
  return {
    lists: [
      {
        title: 'Animals',
        items: ['elephant', 'turtle', 'frog'],
      },
      {
        title: 'Numbers',
        items: ['first', 'second', 'third'],
      },
    ],
    tags: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  }
}

export const sortableOptions = {
  draggable: {
    // lockAxis: 'y',
    inertia: true,
    autoScroll: { container: '.container' },
    listeners: [interact.feedback.pointers()],
    modifiers: [
      interact.modifiers.restrict({
        restriction: 'html',
        elementRect: { left: 0, top: 0, right: 1, bottom: 1 },
      }),
      interact.modifiers.transform(),
      interact.modifiers.spring(),
    ],
  },
  _spillTo: document.getElementById('no-parent'),
  mirror: false,
  listeners: [
    {
      start: sortListener,
      change: sortListener,
      end: sortListener,
    },
  ],
}

export const swappableOptions = {
  draggable: {
    // lockAxis: 'y',
    inertia: true,
    modifiers: [interact.modifiers.spring()],
    listeners: interact.feedback.pointers(),
  },
}
