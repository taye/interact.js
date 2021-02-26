<template>
            <div class="i-vis" id="i-vis">
              <div v-for="(interaction, interactionIndex) of preparedInteractions" key="'interaction-' + interactionIndex">
                <svg>
                  <polygon
                    class="i-vis-quad"
                    :points="(interaction.visualizer.quadPoints as unknown) as string"
                  />

                  {interaction.visualizer.quadPoints.map(([x, y], i) => (
                    <circle
                      v-for="([x, y], i) of interaction.visualizer.quadPoints"
                      :key="'cursor-' + i"
                      class="i-vis-point"
                      :cx="x.toString()"
                      :cy="y.toString()"
                      :points="(interaction.visualizer.quadPoints as unknown) as string"
                    />
                  ))}

                  {pointerCoords.value.map((coords, i) => (
                    <g class="i-vis-crosshair" :key="'crosshair-' + i">
                      <polygon
                        :points="([
                        [0, coords.y],
                        [windowSize.value.x, coords.y],
                        ] as unknown) as string
                        "
                      />

                      <polygon
                        :points="([
                            [coords.x, 0],
                            [coords.x, windowSize.value.y],
                          ] as unknown) as string
                        "
                      />

                      <text :x="coords.x" :y="coords.y + 15">
                        ({coords.x.toFixed(2) + ', ' + coords.y.toFixed(2)})
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
          </div>
            </template>

              <script>
import type { Component } from '@vue/runtime-dom'

import type Interaction from '@interactjs/core/Interaction'
import type { Scope } from '@interactjs/core/scope'
import type { Point, Rect } from '@interactjs/types'
import * as rectUtils from '@interactjs/utils/rect'

import { onMounted, toRefs, computed, reactive, ref } from './vueModules'

interface Visualizer {
  scope: Scope
  preparedInteractions: Interaction[]
  show: boolean
  windowSize: Point
  pointerCoords: Point[]
}

const isProd = process.env.NODE_ENV === 'production'

export const Visualizer: Component = isProd
  ? null
  : {
    setup (props: { scope: Scope, show: boolean }) {
      const { scope } = props
      const { show } = toRefs(props)
      const windowSize = ref({ x: window.innerWidth, y: window.innerHeight })

      const interactions = reactive(scope.interactions.list)

      const pointerCoords = computed(() =>
        interactions.reduce((acc: Point[], interaction) => {
          acc.push(interaction.coords.cur.client)

          return acc
        }, []),
      )

      const preparedInteractions = computed(() =>
        interactions.filter(interaction => !!interaction.prepared.name),
      )

      onMounted(() => {
        const updateWindowSize = () => {
          windowSize.value = { x: window.innerWidth, y: window.innerHeight }
        }

        window.addEventListener('resize', updateWindowSize)

        return () => window.removeEventListener('resize', updateWindowSize)
      })

      return { pointerCoords, preparedInteractions, show, windowSize }
    },
  }

function rectStyle (scope: Scope, rect: Rect & Partial<Point>, subtractScroll = false) {
  if (!rect) {
    return {}
  }

  rect = rectUtils.tlbrToXywh(rect)

  if (subtractScroll) {
    rect.x -= scope.window.scrollX
    rect.y -= scope.window.scrollY
  }

  const { x, y, width, height } = rect

  return {
    transform: `translate(${x}px, ${y}px)`,
    width: `${width}px`,
    height: `${height}px`,
  }
}
  </script>

<style>
  .i-vis, .i-vis svg {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9002;
    transform: translateX(0);
  }

  .i-vis-crosshair * {
    stroke-dasharray: 4;
    stroke-width: 1;
    stroke: gray;
    font-family: monospace;
  }

  .i-vis-quad {
    stroke: #9e2;
    stroke-width: 4;
    fill: #9e24;
    stroke-dasharray: 8;
  }

  .i-vis-point {
    fill: none;
    stroke: #9e2;
    stroke-width: 2;
    r: 6;
  }
  </style>
