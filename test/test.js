var expect = chai.expect,
    should = chai.should(),
    debug = interact.debug(),
    PointerEvent = window.PointerEvent || window.MSPointerEvent;

function blank () {}

function mockEvent (options, target, currentTarget) {
    'use strict';

    options.target = options.target || target;
    options.currentTarget = options.currentTarget || currentTarget;

    return {
        target: options.target,
        currentTarget: options.current || options.target,
        type: options.type,
        pageX: options.x,
        pageY: options.y,
        clientX: options.x - (options.scrollX|0),
        clientY: options.y - (options.scrollY|0),
        touches: options.touches && options.touches.map(mockEvent),
        changedTouches: options.changed && options.changed.map(mockEvent),
        pointerId: options.pointerId || 0,
        identifier: options.identifier || 0,

        preventDefault: blank,
        stopPropagation: blank,
        stopImmediatePropagation: blank
    };
}

describe('interact', function () {
    'use strict';

    describe('when called as a function', function () {
        var validSelector = 'svg .draggable, body button';

        it('should return an Interactable when given an Element', function () {
            var bod = interact(document.body);

            expect(bod).to.be.an.instanceof(debug.Interactable);

            bod.element().should.equal(document.body);
        });

        it('should return an Interactable when given a valid CSS selector string', function () {
            var interactable = interact(validSelector);

            expect(interactable).to.be.an.instanceof(debug.Interactable);
        });

        it('should throw an error when given a string that is not a valid selector', function () {
            var error = 0;

            try {
                interact('<< invalid selector >>');
            }
            catch (e) {
                error = e;
            }

            error.should.be.instanceof(DOMException);
        });

        it('should return the same value from a given parameter unless returned Interactable is unset', function () { var iBody = interact(document.body),
                iSelector = interact(validSelector);

            interact(document.body).should.equal(iBody);
            interact(validSelector).should.equal(iSelector);

            iBody.unset();
            iSelector.unset();

            interact(document.body).should.not.equal(iBody);
            interact(validSelector).should.not.equal(iSelector);
        });
    });

    describe('gobal options', function () {

    });
});

describe('Interactable', function () {
    'use strict';

    var defaults = debug.defaultOptions,
        iable = interact(document.createElement('div')),
        simpleOptions = {
            draggable    : 'draggable',
            dropzone     : 'dropzone',
            resizable   : 'resizable',
            squareResize : 'squareResize',
            gesturable  : 'gesturable',
            styleCursor  : 'styleCursor',
            origin       : 'origin',
            deltaSource  : 'deltaSource'
        },
        enableOptions = [
            'snap',
            'autoScroll',
            'restrict',
            'inertia'
        ];

    describe('options', function () {
        it('should return the default setting if they were never previously set', function () {
            var option, i;

            for (option in simpleOptions) {
                iable[option]().should.equal(defaults[simpleOptions[option]]);
            }

            for (i = 0; option = enableOptions[i], i < enableOptions.length; i++) {
                if (iable[option]()) {
                    iable[option]().should.equal(defaults[option]);
                }
                else {
                    iable[option]().should.equal(defaults[option + 'Enabled']);
                }
            }

            iable.rectChecker().should.equal(debug.Interactable.prototype.getRect);
            expect(iable.actionChecker()).to.equal(null);
        });
    });

    describe('#element', function () {
        it('should return the element if this is not a selector Interactable', function () {
            var p = document.createElement('p');

            interact(p).element().should.equal(p);
        });
    });

    describe('#actionChecker', function () {
        var div = document.createElement('div'),
            iDiv = interact(div)
                .draggable(true)
                .resizable(true)
                .gesturable(true),
            i,
            action,
            actions = ['drag', 'resizexy', 'resizex', 'resizey', 'gesture'],
            returnActionI = function () { return actions[i]; };

        it('should set set the function used to determine actions on pointer down events', function () {
            iDiv.actionChecker(returnActionI);

            for (i = 0; action = actions[i], i < actions.length; i++) {
                debug.pointerDown.call(div, mockEvent({
                    target: div,
                    pointerId: 1
                }));

                if (PointerEvent && action === 'gesture') {
                    debug.pointerDown.call(div, mockEvent({
                        target: div,
                        pointerId: 2
                    }));
                }

                interact.debug().prepared.should.equal(action);

                interact.stop();
            }
        });
    });
});

describe('Events', function () {
    'use strict';

    interact.stop();

    var dragElement = document.createElement('div'),
        draggable = interact(dragElement),
        events = [],
        mockEvents = data.downMove2Up.map(function (e) {
            return mockEvent(e, dragElement);
        }),
        pushEvent = function (event) {
            events.push(event);
        };

    describe('drag sequence', function () {
        draggable.draggable({
                onstart: pushEvent,
                onmove: pushEvent,
                onend: pushEvent
        }).actionChecker(function () {
            return 'drag';
        });

        debug.pointerDown(mockEvents[0]);
        debug.pointerMove(mockEvents[1]);
        debug.pointerMove(mockEvents[2]);
        debug.pointerUp  (mockEvents[3]);

        it('should be triggered by mousedown -> mousemove -> mouseup sequence', function () {
            events.length.should.equal(4);
            
            events[0].type.should.equal('dragstart');
            events[1].type.should.equal('dragmove');
            events[2].type.should.equal('dragmove');
            events[3].type.should.equal('dragend');
        });

        it('should have the same coordinates as the original events', function () {
            var event, mock, i;

            for (i = 0; event = events[i], mock = mockEvents[i], i < events.length; i++) {
                event.pageX.should.equal(mock.pageX);
                event.pageY.should.equal(mock.pageY);
                event.clientX.should.equal(mock.clientX);
                event.clientY.should.equal(mock.clientY);
            }
        });

        it('should have the same x0/y0 and clientX0/Y0 as the start event of the sequence', function () {
            var startEvent = mockEvents[0],
                event, i;

            for (i = 0; event = events[i], i < events.length; i++) {
                event.x0.should.equal(startEvent.pageX);
                event.y0.should.equal(startEvent.pageY);
                event.clientX0.should.equal(startEvent.clientX);
                event.clientY0.should.equal(startEvent.clientY);
            }
        });

        it('should keep the same target', function () {
            var event, i;

            for (i = 0; event = events[i], i < events.length; i++) {
                event.target.should.equal(dragElement);
            }
        });

        describe('dragstart', function () {
            var downEvent = mockEvents[0],
                startEvent = events[0];

            it('should have dy/dx of 0', function () {
                startEvent.dx.should.equal(0);
                startEvent.dy.should.equal(0);
            });
        });

        describe('dragmove', function () {

            it('should have dy/dx of this event\'s coordinates - the previous event\'s', function () {
                events[1].dx.should.equal(events[1].pageX - events[0].pageX);
                events[1].dy.should.equal(events[1].pageY - events[0].pageY);

                events[2].dx.should.equal(events[2].pageX - events[1].pageX);
                events[2].dy.should.equal(events[2].pageY - events[1].pageY);
            });
        });

        describe('dragend', function () {
            it('should have dy/dx of the end event\'s coordinates - the start event\'s', function () {
                events[3].dx.should.equal(events[2].pageX - events[0].pageX);
                events[3].dy.should.equal(events[2].pageY - events[0].pageY);
            });
        });
    });

    describe('Gesture sequence', function () {
        interact.stop();

        var pushEvent = function (event) {
                gestureEvents.push(event);
            },
            element = document.createElement('button'),
            iElement = interact(element).gesturable({
                onstart: pushEvent,
                onmove: pushEvent,
                onend: pushEvent
            }).actionChecker(function () { return 'gesture'; }),
            mockEvents = data.touch2Move2End2.map(function (e) {
                return mockEvent(e, element);
            }),
            gestureEvents = [],
            eventMap = [1, 2, 3, 4];

        // The pointers must be recorded here since event listeners
        // don't call the related functions. The recorded pointermove events
        // are used to calculate gesture angle, scale, etc.

        debug.pointerDown(mockEvents[0]);
        debug.pointerDown(mockEvents[1]);

        debug[PointerEvent? 'recordPointers': 'recordTouches'](mockEvents[2]);
        debug.pointerMove(mockEvents[2]);

        debug[PointerEvent? 'recordPointers': 'recordTouches'](mockEvents[3]);
        debug.pointerMove(mockEvents[3]);

        debug.pointerUp(mockEvents[4]);
        debug.pointerUp(mockEvents[5]);

        it('should be started by 2 touches starting and moving and end when there are fewer than two active touches', function () {
            gestureEvents.length.should.equal(4);

            gestureEvents[0].type.should.equal('gesturestart');
            gestureEvents[1].type.should.equal('gesturemove');
            gestureEvents[2].type.should.equal('gesturemove');
            gestureEvents[3].type.should.equal('gestureend');
        });

        describe('touches', function () {

            it('should be the original list of touches in the correspoinding touch event', function () {

                if (PointerEvent) {
                    gestureEvents[0].touches.should.eql([mockEvents[2], mockEvents[1]]);
                    gestureEvents[1].touches.should.eql([mockEvents[2], mockEvents[1]]);
                    gestureEvents[2].touches.should.eql([mockEvents[2], mockEvents[3]]);
                    gestureEvents[3].touches.should.eql([mockEvents[2], mockEvents[3]]);
                }
                else {
                    for (var i = 0, gEvent, mEvent;
                         mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                         i++) {

                        gEvent.touches.should.eql(mEvent.touches);
                    }
                }
            });
        });

        describe('coordinates', function () {
            it('should be the averages of touches', function () {
                for (var i = 0, gEvent, mEvent;
                     mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                     i++) {

                    var average = PointerEvent? mEvent: interact.getTouchAverage(mEvent),
                        coords = ['pageX', 'pageY', 'clientX', 'clientY'];
                   
                        coords.forEach(function (coord) {
                            gEvent[coord].should.equal(average[coord]);
                        });
                }
            });
        });

        describe('angle', function () {
            it('should be the angle of the line joining the first two touches of the correspoinding touch event', function () {
                if (PointerEvent) {
                    gestureEvents[0].angle.should.eql(interact.getTouchAngle([mockEvents[2], mockEvents[1]]));
                    gestureEvents[1].angle.should.eql(interact.getTouchAngle([mockEvents[2], mockEvents[1]]));
                    gestureEvents[2].angle.should.eql(interact.getTouchAngle([mockEvents[2], mockEvents[3]]));
                    gestureEvents[3].angle.should.eql(interact.getTouchAngle([mockEvents[2], mockEvents[3]]));
                }
                else {
                    for (var i = 0, gEvent, mEvent;
                         mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                         i++) {

                        gEvent.angle.should.equal(interact.getTouchAngle(mEvent));
                    }
                }
            });
        });

        describe('da', function () {
            describe('in a gesturestart', function () {
                it('should be 0', function () {
                    gestureEvents[0].da.should.equal(0);
                });
            });

            describe('in a gesturemove', function () {
                it('should be (thisEvent.angle - previousEvent.angle)', function () {
                    gestureEvents[1].da.should.equal(gestureEvents[1].angle - gestureEvents[0].angle);
                    gestureEvents[2].da.should.equal(gestureEvents[2].angle - gestureEvents[1].angle);
                });
            });

            describe('in a gestureend', function () {
                it('should be (lastMoveEvent.angle - startEvent.angle)', function () {
                    gestureEvents[3].da.should.equal(gestureEvents[2].angle - gestureEvents[0].angle);
                });
            });
        });

        describe('distance', function () {
            it('should be the distance between the first two touches of the correspoinding touch event', function () {
                if (PointerEvent) {
                    gestureEvents[0].distance.should.eql(interact.getTouchDistance([mockEvents[2], mockEvents[1]]));
                    gestureEvents[1].distance.should.eql(interact.getTouchDistance([mockEvents[2], mockEvents[1]]));
                    gestureEvents[2].distance.should.eql(interact.getTouchDistance([mockEvents[2], mockEvents[3]]));
                    gestureEvents[3].distance.should.eql(interact.getTouchDistance([mockEvents[2], mockEvents[3]]));
                }
                else {
                    for (var i = 0, gEvent, mEvent;
                         mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                         i++) {

                        gEvent.distance.should.equal(interact.getTouchDistance(mEvent));
                        gEvent.distance.should.equal(interact.getTouchDistance(mEvent));
                    }
                }
            });
        });

        describe('scale', function () {
            describe('in a gesturestart', function () {
                it('should be 1', function () {
                    gestureEvents[0].scale.should.equal(1);
                });
            });

            describe('in a gesturemove', function () {
                it('should be the (thisevent.distance / startevent.distance)', function () {
                    gestureEvents[1].scale.should.equal(gestureEvents[1].distance / gestureEvents[0].distance);
                    gestureEvents[2].scale.should.equal(gestureEvents[2].distance / gestureEvents[0].distance);
                });
            });

            describe('in a gestureend', function () {
                it('should be the scale of the last gesturemove event', function () {
                    gestureEvents[3].scale.should.equal(gestureEvents[2].scale);
                });
            });
        });

        describe('ds', function () {
            describe('in a gesturestart', function () {
                it('should be 0', function () {
                    gestureEvents[0].ds.should.equal(0);
                });
            });

            describe('in a gesturemove', function () {
                it('should be the difference between this event\'s scale and that of the previous event', function () {
                    gestureEvents[1].ds.should.equal(gestureEvents[1].scale - gestureEvents[0].scale);
                    gestureEvents[2].ds.should.equal(gestureEvents[2].scale - gestureEvents[1].scale);
                });
            });

            describe('in a gestureend', function () {
                it('should be (lastMoveEvent.scale - startEvent.scale)', function () {
                    gestureEvents[3].ds.should.equal(gestureEvents[2].scale - gestureEvents[0].scale);
                });
            });
        });
    });
});
