var expect = chai.expect,
    should = chai.should(),
    debug = interact.debug();

function blank () {}

function mockEvent (options) {
    'use strict';

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
            expect(function () {
                interact('<< invalid selector >>');
            }).to.throw(Error);
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
            resizeable   : 'resizeable',
            squareResize : 'squareResize',
            gestureable  : 'gestureable',
            styleCursor  : 'styleCursor',
            restrict     : 'restrictions', 
            origin       : 'origin',
            deltaSource  : 'deltaSource'
        },
        enableOptions = [
            'snap',
            'autoScroll'
        ],
        checkerOptions = {
            actionChecker: 'getAction',
            rectChecker  : 'getRect'
        };

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

            for (option in checkerOptions) {
                iable[option]().should.equal(debug.Interactable.prototype[checkerOptions[option]]);
            }
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
                .resizeable(true)
                .gestureable(true),
            i,
            action,
            actions = ['drag', 'resizexy', 'resizex', 'resizey', 'gesture'],
            returnActionI = function alwaysResize () { return actions[i]; };

        it('should set set the function used to determine actions on pointer down events', function () {
            iDiv.actionChecker(returnActionI);
            iDiv.getAction.should.equal(returnActionI);

            for (i = 0; action = actions[i], i < actions.length; i++) {
                debug.pointerDown.call(div, mockEvent({
                    target: div,
                    x: -123,
                    y: 209
                }));

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
        mockEvents = data.downMove2Up.map(mockEvent),
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

        debug.pointerDown.call(dragElement, mockEvents[0]);
        debug.pointerMove.call(dragElement, mockEvents[1]);
        debug.pointerMove.call(dragElement, mockEvents[2]);
        debug.pointerUp  .call(dragElement, mockEvents[3]);

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
            iElement = interact(element).gestureable({
                onstart: pushEvent,
                onmove: pushEvent,
                onend: pushEvent
            }).actionChecker(function () { return 'gesture'; }),
            mockEvents = data.touch2Move2End2.map(mockEvent),
            gestureEvents = [],
            eventMap = [1, 2, 3, 4];

        debug.pointerDown.call(element, mockEvents[0]);
        debug.pointerDown.call(element, mockEvents[1]);
        debug.pointerMove.call(element, mockEvents[2]);
        debug.pointerMove.call(element, mockEvents[3]);
        debug.pointerUp.call(element, mockEvents[4]);
        debug.pointerUp.call(element, mockEvents[5]);

        it('should be started by 2 touches starting and moving and end when there are fewer than two active touches', function () {
            gestureEvents.length.should.equal(4);

            gestureEvents[0].type.should.equal('gesturestart');
            gestureEvents[1].type.should.equal('gesturemove');
            gestureEvents[2].type.should.equal('gesturemove');
            gestureEvents[3].type.should.equal('gestureend');
        });

        describe('touches', function () {

            it('should be the original list of touches in the correspoinding touch event', function () {
                for (var i = 0, gEvent, mEvent;
                     mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                     i++) {
                         gEvent.touches.should.equal(mEvent.touches);
                     }
            });
        });

        describe('coordinates', function () {
            it('should be the averages of touches', function () {
                for (var i = 0, gEvent, mEvent;
                     mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                     i++) {

                    var average = interact.touchAverage(mEvent);

                    gEvent.pageX.should.equal(average.pageX);
                    gEvent.pageY.should.equal(average.pageY);
                    gEvent.clientX.should.equal(average.clientX);
                    gEvent.clientY.should.equal(average.clientY);
                }
            });
        });

        describe('angle', function () {
            it('should be the angle of the line joining the first two touches of the correspoinding touch event', function () {
                for (var i = 0, gEvent, mEvent;
                     mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                     i++) {

                    gEvent.angle.should.equal(interact.touchAngle(mEvent));
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
                for (var i = 0, gEvent, mEvent;
                     mEvent = mockEvents[eventMap[i]], gEvent = gestureEvents[i], i < gestureEvents.length;
                     i++) {

                    gEvent.distance.should.equal(interact.touchDistance(mEvent));
                    gEvent.distance.should.equal(interact.touchDistance(mEvent));
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
