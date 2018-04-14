let svg;
const svgNS = 'http://www.w3.org/2000/svg';
const SVGElement = window.SVGElement;

function DemoGraphic (id) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const group = svg.appendChild(document.createElementNS(svgNS, 'g'));
  const ellipse = group.appendChild(document.createElementNS(svgNS, 'ellipse'));
  const text = group.appendChild(document.createElementNS( svgNS, 'text'));
  const title = group.appendChild(document.createElementNS(svgNS, 'text'));


  ellipse.demo = true;
  ellipse.text = text;
  window[id] = ellipse;

  ellipse.dragX = Math.random()*(width - 200);
  ellipse.dragY = Math.random()*(height - 200);
  ellipse.resizeWidth  = 80;
  ellipse.resizeHeight = 80;

  group.setAttribute('transform', ['translate(', ellipse.dragX, ellipse.dragY, ')'].join(' '));
  group.setAttribute('class', 'demo-node');

  ellipse.setAttribute('cx', 0);
  ellipse.setAttribute('cy', 0);
  ellipse.setAttribute('rx', ellipse.resizeWidth);
  ellipse.setAttribute('ry', ellipse.resizeHeight);
  group.setAttribute('class', 'interactive');

  title.textContent = id;
  title.setAttribute('class', 'title');
  text.setAttribute('class', 'eventData');


  this.group = group;
  this.ellipse = ellipse;
  this.text = text;
  this.title = title;
}

function DemoNode (id) {
  this.element = document.body.appendChild(document.createElement('div'));
  this.element.className = 'demo-node interactive';
  this.element.id = id;
  this.element.demo = true;
  this.element.style.width  = '230px';
  this.element.style.height = '273px';

  this.element.text = this.element.appendChild(document.createElement('pre'));
  this.element.appendChild(document.createElement('br'));
  this.element.style.left = Math.random()*((window.innerWidth || 800) - 200) + 'px';
  this.element.style.top = Math.random()*((window.innerHeight || 800) - 200) + 'px';

  window[id] = this.element;
}

function nodeEventDebug (e) {
  const target = e.target;

  target.text.textContent = '\n' + e.type;
  target.text.textContent += '\n x0, y0      : (' + e.x0 + ', ' + e.y0 + ')';
  target.text.textContent += '\n dx, dy      : (' + e.dx + ', ' + e.dy + ')';
  target.text.textContent += '\n pageX, pageY: (' + e.pageX + ', ' + e.pageY + ')';
  target.text.textContent += '\n speed       :  ' + e.speed;

  if (/gesture/.test(e.type)) {
    target.text.textContent += '\n distance: ' + e.distance;
    target.text.textContent += '\n scale   : ' + e.scale;
    target.text.textContent += '\n angle   : ' + e.angle;
    target.text.textContent += '\n rotation: ' + e.rotation;
  }
}

function dragMove (e) {
  const target = e.target;

  if ('SVGElement' in window && e.target instanceof SVGElement) {
    target.dragX += e.dx;
    target.dragY += e.dy;

    target.parentNode.setAttribute('transform', ['translate(', target.dragX, target.dragY, ')'].join(' '));
  } else {
    target.style.left = parseInt(target.style.left || 0, 10) + e.dx + 'px';
    target.style.top  = parseInt(target.style.top || 0, 10)  + e.dy + 'px';
  }
}

function resizeMove (event) {
  const target = event.target;

  if ('SVGElement' in window && target instanceof SVGElement) {
    target.dragX += (event.edges.left? event.deltaRect.left : event.deltaRect.right ) / 2;
    target.dragY += (event.edges.top ? event.deltaRect.top  : event.deltaRect.bottom) / 2;

    target.resizeWidth  += event.deltaRect.width  / 2;
    target.resizeHeight += event.deltaRect.height / 2;

    target.setAttribute('rx',  target.resizeWidth);
    target.setAttribute('ry', target.resizeHeight);

    target.parentNode.setAttribute('transform', ['translate(', target.dragX, target.dragY, ')'].join(' '));
  }
  else {
    target.style.left = parseInt(target.style.left || 0, 10) + event.deltaRect.left + 'px';
    target.style.top  = parseInt(target.style.top  || 0, 10) + event.deltaRect.top  + 'px';

    target.style.width  = Math.max(parseInt(target.style.width  || 0, 10) + event.deltaRect.width , 50) + 'px';
    target.style.height = Math.max(parseInt(target.style.height || 0, 10) + event.deltaRect.height, 50) + 'px';

    //target.style.left = event.rect.left + 'px';
    //target.style.top  = event.rect.top  + 'px';

    //target.style.width  = event.rect.width  + 'px';
    //target.style.height = event.rect.height + 'px';
  }
}

interact.on('resizemove', resizeMove);
interact.on('dragmove', dragMove);

function dropNode (e) {
  if ('SVGElement' in window && e.draggable instanceof SVGElement) {
    return;
  }

  const dropzone = e.target;
  const draggable = e.relatedTarget;
  const dropzoneRect = dropzone.getClientRects()[0];
  const parent = draggable.parentNode;
  const dropRect = {
    x: dropzoneRect.left + 20,
    y: dropzoneRect.top  + 20,
  };

  dropRect.x += (window.scrollX || document.documentElement.scrollLeft);
  dropRect.y += (window.scrollY || document.documentElement.scrollTop);
  dropRect.width  = (dropzoneRect.right  - dropzoneRect.left) / 2;
  dropRect.height = (dropzoneRect.bottom - dropzoneRect.top)  / 2;

  draggable.style.left = dropRect.x + 'px';
  draggable.style.top  = dropRect.y + 'px';
  draggable.style.width  = dropRect.width  + 'px';
  draggable.style.height = dropRect.height + 'px';

  parent.appendChild(parent.removeChild(draggable));
}

function onReady () {
  let i;

  if ('SVGElement' in window) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    svg = document.createElementNS(svgNS, 'svg');
    svg.id = 'svg';
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    document.body.appendChild(svg);

    window.svg = svg;

    for (i = 0; i < 2; i++) {
      new DemoGraphic('graphic' + i);
    }
  }

  for (i = 0; i < 2; i++) {
    new DemoNode('node' + i);
  }

  interact('.interactive')
    .draggable({
      snap: {
        targets: [
          { x: 0, y: 0, range: 100 },
          // interact.snappers.elements({
          //   targets: 'div.demo-node',
          //   range: 100,
          // }),
          interact.createSnapGrid({ x: 100, y: 100 }),
        ],
        endOnly: true,
        relativePoints: [
          { x: 0, y: 0 },
          // { x: 0.5, y: 0.5 },
        ],
      },
      restrict: {
        restriction: 'body',
        elementRect: { top: 0, left: 0, right: 1, bottom: 1 },
      },
      max: 2,
      autoScroll: true,
      inertia: true,
    })
    .gesturable({ max: 1 })
    .resizable({
      max: 2,
      inertia: { resistance: 40 },
      edges: { left: true, right: true, top: true, bottom: true },
      snapSize: {
        enabled: true,
        targets: [ interact.createSnapGrid({ x: 100, y: 100 }) ],
      },
    })
    .dropzone({ ondrop: dropNode })
    // Display event properties for debugging
    .on('resize gesture drag', { start: nodeEventDebug, move: nodeEventDebug, end: nodeEventDebug });
}

interact(document).on('DOMContentLoaded', onReady);
