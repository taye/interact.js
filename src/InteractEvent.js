'use strict';

var scope = require('./scope');
var utils = require('./utils');

function InteractEvent (interaction, event, action, phase, element, related) {
    var client,
        page,
        target      = interaction.target,
        snapStatus  = interaction.snapStatus,
        restrictStatus  = interaction.restrictStatus,
        pointers    = interaction.pointers,
        deltaSource = (target && target.options || scope.defaultOptions).deltaSource,
        sourceX     = deltaSource + 'X',
        sourceY     = deltaSource + 'Y',
        options     = target? target.options: scope.defaultOptions,
        origin      = scope.getOriginXY(target, element),
        starting    = phase === 'start',
        ending      = phase === 'end',
        coords      = starting? interaction.startCoords : interaction.curCoords;

    element = element || interaction.element;

    page   = utils.extend({}, coords.page);
    client = utils.extend({}, coords.client);

    page.x -= origin.x;
    page.y -= origin.y;

    client.x -= origin.x;
    client.y -= origin.y;

    var relativePoints = options[action].snap && options[action].snap.relativePoints ;

    if (scope.checkSnap(target, action) && !(starting && relativePoints && relativePoints.length)) {
        this.snap = {
            range  : snapStatus.range,
            locked : snapStatus.locked,
            x      : snapStatus.snappedX,
            y      : snapStatus.snappedY,
            realX  : snapStatus.realX,
            realY  : snapStatus.realY,
            dx     : snapStatus.dx,
            dy     : snapStatus.dy
        };

        if (snapStatus.locked) {
            page.x += snapStatus.dx;
            page.y += snapStatus.dy;
            client.x += snapStatus.dx;
            client.y += snapStatus.dy;
        }
    }

    if (scope.checkRestrict(target, action) && !(starting && options[action].restrict.elementRect) && restrictStatus.restricted) {
        page.x += restrictStatus.dx;
        page.y += restrictStatus.dy;
        client.x += restrictStatus.dx;
        client.y += restrictStatus.dy;

        this.restrict = {
            dx: restrictStatus.dx,
            dy: restrictStatus.dy
        };
    }

    this.pageX     = page.x;
    this.pageY     = page.y;
    this.clientX   = client.x;
    this.clientY   = client.y;

    this.x0        = interaction.startCoords.page.x - origin.x;
    this.y0        = interaction.startCoords.page.y - origin.y;
    this.clientX0  = interaction.startCoords.client.x - origin.x;
    this.clientY0  = interaction.startCoords.client.y - origin.y;
    this.ctrlKey   = event.ctrlKey;
    this.altKey    = event.altKey;
    this.shiftKey  = event.shiftKey;
    this.metaKey   = event.metaKey;
    this.button    = event.button;
    this.target    = element;
    this.t0        = interaction.downTimes[0];
    this.type      = action + (phase || '');

    this.interaction = interaction;
    this.interactable = target;

    var inertiaStatus = interaction.inertiaStatus;

    if (inertiaStatus.active) {
        this.detail = 'inertia';
    }

    if (related) {
        this.relatedTarget = related;
    }

    // end event dx, dy is difference between start and end points
    if (ending) {
        if (deltaSource === 'client') {
            this.dx = client.x - interaction.startCoords.client.x;
            this.dy = client.y - interaction.startCoords.client.y;
        }
        else {
            this.dx = page.x - interaction.startCoords.page.x;
            this.dy = page.y - interaction.startCoords.page.y;
        }
    }
    else if (starting) {
        this.dx = 0;
        this.dy = 0;
    }
    // copy properties from previousmove if starting inertia
    else if (phase === 'inertiastart') {
        this.dx = interaction.prevEvent.dx;
        this.dy = interaction.prevEvent.dy;
    }
    else {
        if (deltaSource === 'client') {
            this.dx = client.x - interaction.prevEvent.clientX;
            this.dy = client.y - interaction.prevEvent.clientY;
        }
        else {
            this.dx = page.x - interaction.prevEvent.pageX;
            this.dy = page.y - interaction.prevEvent.pageY;
        }
    }
    if (interaction.prevEvent && interaction.prevEvent.detail === 'inertia'
        && !inertiaStatus.active
        && options[action].inertia && options[action].inertia.zeroResumeDelta) {

        inertiaStatus.resumeDx += this.dx;
        inertiaStatus.resumeDy += this.dy;

        this.dx = this.dy = 0;
    }

    if (action === 'resize' && interaction.resizeAxes) {
        if (options.resize.square) {
            if (interaction.resizeAxes === 'y') {
                this.dx = this.dy;
            }
            else {
                this.dy = this.dx;
            }
            this.axes = 'xy';
        }
        else {
            this.axes = interaction.resizeAxes;

            if (interaction.resizeAxes === 'x') {
                this.dy = 0;
            }
            else if (interaction.resizeAxes === 'y') {
                this.dx = 0;
            }
        }
    }
    else if (action === 'gesture') {
        this.touches = [pointers[0], pointers[1]];

        if (starting) {
            this.distance = utils.touchDistance(pointers, deltaSource);
            this.box      = utils.touchBBox(pointers);
            this.scale    = 1;
            this.ds       = 0;
            this.angle    = utils.touchAngle(pointers, undefined, deltaSource);
            this.da       = 0;
        }
        else if (ending || event instanceof InteractEvent) {
            this.distance = interaction.prevEvent.distance;
            this.box      = interaction.prevEvent.box;
            this.scale    = interaction.prevEvent.scale;
            this.ds       = this.scale - 1;
            this.angle    = interaction.prevEvent.angle;
            this.da       = this.angle - interaction.gesture.startAngle;
        }
        else {
            this.distance = utils.touchDistance(pointers, deltaSource);
            this.box      = utils.touchBBox(pointers);
            this.scale    = this.distance / interaction.gesture.startDistance;
            this.angle    = utils.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

            this.ds = this.scale - interaction.gesture.prevScale;
            this.da = this.angle - interaction.gesture.prevAngle;
        }
    }

    if (starting) {
        this.timeStamp = interaction.downTimes[0];
        this.dt        = 0;
        this.duration  = 0;
        this.speed     = 0;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    else if (phase === 'inertiastart') {
        this.timeStamp = interaction.prevEvent.timeStamp;
        this.dt        = interaction.prevEvent.dt;
        this.duration  = interaction.prevEvent.duration;
        this.speed     = interaction.prevEvent.speed;
        this.velocityX = interaction.prevEvent.velocityX;
        this.velocityY = interaction.prevEvent.velocityY;
    }
    else {
        this.timeStamp = new Date().getTime();
        this.dt        = this.timeStamp - interaction.prevEvent.timeStamp;
        this.duration  = this.timeStamp - interaction.downTimes[0];

        if (event instanceof InteractEvent) {
            var dx = this[sourceX] - interaction.prevEvent[sourceX],
                dy = this[sourceY] - interaction.prevEvent[sourceY],
                dt = this.dt / 1000;

            this.speed = utils.hypot(dx, dy) / dt;
            this.velocityX = dx / dt;
            this.velocityY = dy / dt;
        }
        // if normal move or end event, use previous user event coords
        else {
            // speed and velocity in pixels per second
            this.speed = interaction.pointerDelta[deltaSource].speed;
            this.velocityX = interaction.pointerDelta[deltaSource].vx;
            this.velocityY = interaction.pointerDelta[deltaSource].vy;
        }
    }

    if ((ending || phase === 'inertiastart')
        && interaction.prevEvent.speed > 600 && this.timeStamp - interaction.prevEvent.timeStamp < 150) {

        var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI,
            overlap = 22.5;

        if (angle < 0) {
            angle += 360;
        }

        var left = 135 - overlap <= angle && angle < 225 + overlap,
            up   = 225 - overlap <= angle && angle < 315 + overlap,

            right = !left && (315 - overlap <= angle || angle <  45 + overlap),
            down  = !up   &&   45 - overlap <= angle && angle < 135 + overlap;

        this.swipe = {
            up   : up,
            down : down,
            left : left,
            right: right,
            angle: angle,
            speed: interaction.prevEvent.speed,
            velocity: {
                x: interaction.prevEvent.velocityX,
                y: interaction.prevEvent.velocityY
            }
        };
    }
}

InteractEvent.prototype = {
    preventDefault: utils.blank,
    stopImmediatePropagation: function () {
        this.immediatePropagationStopped = this.propagationStopped = true;
    },
    stopPropagation: function () {
        this.propagationStopped = true;
    }
};

module.exports = InteractEvent;
