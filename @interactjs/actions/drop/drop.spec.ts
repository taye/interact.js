import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'

import drop from '../drop/plugin'

test('actions/drop options', t => {
  const {
    interactable,
  } = helpers.testEnv({ plugins: [drop] })

  const funcs = Object.freeze({
    drop () {},
    activate () {},
    deactivate () {},
    dropmove () {},
    dragenter () {},
    dragleave () {},
  })

  interactable.dropzone({
    listeners: [funcs],
  })

  t.equal(interactable.events.types.drop[0], funcs.drop)
  t.equal(interactable.events.types.dropactivate[0], funcs.activate)
  t.equal(interactable.events.types.dropdeactivate[0], funcs.deactivate)
  t.equal(interactable.events.types.dropmove[0], funcs.dropmove)
  t.equal(interactable.events.types.dragenter[0], funcs.dragenter)
  t.equal(interactable.events.types.dragleave[0], funcs.dragleave)

  t.end()
})

test('actions/drop start', t => {
  const {
    scope,
    interactable,
    down,
    start,
    move,
    interaction,
  } = helpers.testEnv({ plugins: [drop] })

  interactable.draggable({})
  const dropzone = scope.interactables.new('[data-drop]').dropzone({})

  t.doesNotThrow(() => {
    scope.interactStatic.dynamicDrop(false)

    down()
    start({ name: 'drag' })
    move()
    interaction.end()
  }, 'no error with dynamicDrop === false')

  t.doesNotThrow(() => {
    scope.interactStatic.dynamicDrop(true)
    down()
    start({ name: 'drag' })
    move()
    interaction.end()
  }, 'no error with dynamicDrop === true')

  for (const i of [0, 1, 2]) {
    const dropEl = scope.document.createElement('div')

    dropEl.dataset.drop = `${i}`
    scope.document.body.appendChild(dropEl)
  }

  dropzone.on('dropactivate', event => {
    if (event.target.dataset.drop === '0') {
      event.reject()
    }
  })

  let activated = []
  const deactivated = []

  scope.addListeners({
    'actions/drop:start' ({ interaction: { dropState } }) {
      activated = dropState.activeDrops.map(d => d.element.dataset.drop)
    },
  })

  dropzone.on('dropdeactivate', event => {
    deactivated.push(event.target)
  })

  down()
  start({ name: 'drag' })
  move()

  t.deepEqual(
    interaction.dropState.activeDrops.map(d => d.element.dataset.drop),
    ['1', '2'],
    'rejected dropzones are removed from activeDrops')

  t.deepEqual(
    activated,
    ['1', '2'],
    'actions/drop:start is fired with activeDrops')

  t.deepEqual(
    deactivated.map(d => d.dataset.drop),
    ['0'],
    'rejected dropzones are deactivated')

  interaction.end()

  t.end()
})
