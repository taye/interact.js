import interact from '@interactjs/interactjs'
// import Vue from '../../node_modules/vue/dist/vue.esm.browser.js'

interact('.item')
  .draggable({
    origin: 'parent',
    // inertia: true,
    modifiers: [
      interact.modifiers.snap({
        // enabled: false,
        // targets: [interact.snappers.grid({ x: 20, y: 20 })],
        targets: [interact.snappers.elements({ targets: '.item', range: 20 })],
        relativePoints: [{ x: 0, y: 0 }],
      }),
      interact.modifiers.avoid({ targets: ['.item'] }),
      interact.modifiers.spring({ allowResume: true }),
      interact.modifiers.transform(),
    ],
  })
  .resizable({
    enabled: true,
    origin: 'self',
    edges: { left: true, right: true, top: true, bottom: true },
    modifiers: [
      // interact.modifiers.snapSize({
      // targets: [interact.snappers.grid({ x: 100, y: 100 })],
      // }),
      // interact.modifiers.aspectRatio({ ratio: 'preserve' }),
      // interact.modifiers.restrictSize({
      // max: { width: 350, y: 200 },
      // }),
      interact.modifiers.spring({ allowResume: true }),
      // interact.modifiers.avoid({ targets: ['.item'] }),
      interact.modifiers.transform(),
    ],
  })
  .on('resizemove', (event) => {
    console.log(event.rect.width / event.rect.height)
  })
  .on('resize drag', interact.feedback.dragResize())
