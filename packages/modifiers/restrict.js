import * as is   from '@interactjs/utils/is';
import extend    from '@interactjs/utils/extend';
import rectUtils from '@interactjs/utils/rect';

function start ({ rect, startOffset, status }) {
  const { options } = status;
  const { elementRect } = options;
  const offset = {};

  if (rect && elementRect) {
    offset.left = startOffset.left - (rect.width  * elementRect.left);
    offset.top  = startOffset.top  - (rect.height * elementRect.top);

    offset.right  = startOffset.right  - (rect.width  * (1 - elementRect.right));
    offset.bottom = startOffset.bottom - (rect.height * (1 - elementRect.bottom));
  }
  else {
    offset.left = offset.top = offset.right = offset.bottom = 0;
  }

  status.offset = offset;
}

function set ({ coords, interaction, status, phase }) {
  const { options, offset } = status;

  if (phase === 'start' && options.elementRect) { return; }

  const page = extend({}, coords);
  const restriction = getRestrictionRect(options.restriction, interaction, page);

  if (!restriction) { return status; }

  status.delta.x = 0;
  status.delta.y = 0;

  const rect = restriction;
  let modifiedX = page.x;
  let modifiedY = page.y;

  // object is assumed to have
  // x, y, width, height or
  // left, top, right, bottom
  if ('x' in restriction && 'y' in restriction) {
    modifiedX = Math.max(Math.min(rect.x + rect.width  - offset.right , page.x), rect.x + offset.left);
    modifiedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top );
  }
  else {
    modifiedX = Math.max(Math.min(rect.right  - offset.right , page.x), rect.left + offset.left);
    modifiedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top  + offset.top );
  }

  status.delta.x = modifiedX - page.x;
  status.delta.y = modifiedY - page.y;

  status.modifiedX = modifiedX;
  status.modifiedY = modifiedY;
}

function getRestrictionRect (value, interaction, page) {
  if (is.func(value)) {
    return rectUtils.resolveRectLike(value, interaction.target, interaction.element, [page.x, page.y, interaction]);
  } else {
    return rectUtils.resolveRectLike(value, interaction.target, interaction.element);
  }
}

const restrict = {
  start,
  set,
  getRestrictionRect,
  defaults: {
    restriction: null,
    elementRect: null,
  },
};

export default restrict;
