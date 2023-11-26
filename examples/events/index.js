/* eslint-disable import/no-absolute-path */
import interact from '@interactjs/interactjs'

const dirs = ['up', 'down', 'left', 'right']

interact('#swipe')
  .draggable(true)
  .on('dragend', (event) => {
    if (!event.swipe) {
      return
    }

    let str = 'swipe'

    for (const dir of dirs) {
      if (event.swipe[dir]) {
        str += ' ' + dir
      }
    }

    str += '<br>' + event.swipe.angle.toFixed(2) + '°' + '<br>' + event.swipe.speed.toFixed(2) + 'px/sec'

    event.target.innerHTML = str
    window.console.log(str.replace(/<br>/g, ' '))
  })

const pointerEvents = ['tap', 'doubletap', 'hold', 'down', 'move', 'up']

function logEvent(event) {
  event.currentTarget.innerHTML = event.pointerType

  if (/tap|up|click|down/.test(event.type) && event.interaction.prevTap) {
    window.console.log(
      event.type + ' -- ' + event.dt + ', ' + (new Date().getTime() - event.interaction.prevTap.timeStamp),
    )
  }

  if (interact.supportsTouch() || interact.supportsPointerEvent()) {
    event.target.innerHTML += ' #' + event.pointerId
  }

  const interactionIndex = interact.debug().interactions.list.indexOf(event.interaction)

  event.currentTarget.innerHTML +=
    ' ' +
    event.type +
    '<br>(' +
    event.pageX +
    ', ' +
    event.pageY +
    ')<br>' +
    'interaction #' +
    interactionIndex

  // window.console.log(event.pointerType, event.pointerId, event.type, event.pageX, event.pageY, interactionIndex);

  event.preventDefault()
}

for (let i = 0; i < pointerEvents.length; i++) {
  const eventType = pointerEvents[i]

  interact('#swipe').on(eventType, logEvent)
}

function changeTolerance(event) {
  const value = event.target.value | 0

  interact.pointerMoveTolerance(value)

  document.getElementById('tolerance-display').textContent = value
}

interact('.tolerance-slider').on('input', changeTolerance)
interact('.tolerance-slider').on('change', changeTolerance)
