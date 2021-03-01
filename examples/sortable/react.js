import interact from '@interactjs/interactjs/index.js'

import { getData } from './shared.js'

// eslint-disable-next-line no-undef
const e = React.createElement
const data = getData()

const { Interactable, Sortable } = interact.react.components

// eslint-disable-next-line no-undef
ReactDOM.render(
  e(() => {
    return e(
      'div',
      {},
      data.lists.map((list) => {
        // eslint-disable-next-line no-undef
        const [items, setItems] = React.useState(list.items)

        return e('div', { className: 'box' }, [
          list.title,
          e('pre', {}, JSON.stringify(items, null, 2)),
          e(
            Sortable,
            { className: 'container', key: `list-${list.title}`, items, onUpdate: setItems },
            items.map((item) =>
              e(
                Interactable,
                { onTap: (event) => console.log(event), className: 'item card' },
                e('div', { className: 'card-content' }, item),
              ),
            ),
          ),
        ])
      }),
    )
  }),
  document.getElementById('react-app'),
)
