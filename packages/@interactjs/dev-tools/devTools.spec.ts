import drag from '@interactjs/actions/drag/plugin'
import resize from '@interactjs/actions/resize/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'

import type { Check, Logger } from './plugin'
import devTools from './plugin'

const { checks, links, prefix } = devTools
const checkMap = checks.reduce((acc, check) => {
  acc[check.name] = check
  return acc
}, {} as { [name: string]: Check })

test('devTools', () => {
  const devToolsWithLogger = {
    install: (s) =>
      s.usePlugin(devTools, {
        logger: {
          warn (...args: any[]) {
            log(args, 'warn')
          },
          log (...args: any[]) {
            log(args, 'log')
          },
          error (...args: any[]) {
            log(args, 'error')
          },
        },
      }),
  }

  const { scope, interaction, interactable, target: element, down, start, move, stop } = helpers.testEnv({
    plugins: [devToolsWithLogger, drag, resize],
  })

  const logs: Array<{ args: any[], type: keyof Logger }> = []

  function log (args: any, type: any) {
    logs.push({ args, type })
  }

  scope.usePlugin(drag)
  scope.usePlugin(resize)

  interactable.draggable(true).resizable({ onmove: () => {} })

  down()
  start({ name: 'drag' })
  // warning about missing touchAction
  expect(logs[0]).toEqual({
    args: [prefix + checkMap.touchAction.text, element, links.touchAction],
    type: 'warn',
  })

  // warning about missing move listeners
  expect(logs[1]).toEqual({ args: [prefix + checkMap.noListeners.text, 'drag', interactable], type: 'warn' })

  stop()

  // resolve touchAction
  element.style.touchAction = 'none'
  // resolve missing listeners
  interactable.on('dragmove', () => {})

  interaction.start({ name: 'resize' }, interactable, element)
  move()
  stop()

  // warning about resizing without "box-sizing: none"
  expect(logs[2]).toEqual({
    args: [prefix + checkMap.boxSizing.text, element, links.boxSizing],
    type: 'warn',
  })

  logs.splice(0)

  interaction.start({ name: 'resize' }, interactable, element)
  move()
  stop()

  interactable.options.devTools.ignore = { boxSizing: true }

  interaction.start({ name: 'resize' }, interactable, element)
  move()
  stop()

  // warning removed with options.devTools.ignore
  expect(logs).toHaveLength(1)

  logs.splice(0)

  // resolve boxSizing
  interactable.options.devTools.ignore = {}
  element.style.boxSizing = 'border-box'

  interaction.start({ name: 'resize' }, interactable, element)
  move(true)
  stop()

  interaction.start({ name: 'drag' }, interactable, element)
  move()
  stop()

  // no warnings when issues are resolved
  expect(logs).toHaveLength(0)
})
