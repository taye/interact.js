import { createElement as h, useState } from 'react'
import ReactDOM from 'react-dom'

import interact from '@interactjs/interactjs'

import { getData } from './shared.js'

// eslint-disable-next-line no-undef
const data = getData()

const { Interactable, Sortable } = interact.react.components

// eslint-disable-next-line no-undef
ReactDOM.render(
  h(() => {
    return h(
      'div',
      {},
      data.lists.map((list, index) => {
        const [items, setItems] = useState(list.items)

        return h('div', { key: list.title, className: 'box' }, [
          list.title,
          h('pre', {}, JSON.stringify(items, null, 2)),
          h(
            Sortable,
            { className: 'container', key: `list-${list.title}`, items, onUpdate: setItems },
            items.map((item) =>
              h(
                Interactable,
                { key: item, onTap: (event) => console.log(event), className: 'item card' },
                h('div', { className: 'card-content' }, item),
              ),
            ),
          ),
        ])
      }),
    )
  }),
  document.getElementById('react-app'),
)
