if (window.PointerEvent) {
    var types = {
        down: 'pointerdown',
        move: 'pointermove',
        up: 'pointerup'
    };
}
else {
    var types = {
        down: 'touchstart',
        move: 'touchmove',
        up: 'touchend'
    };
}

window.data = {
    downMove2Up: [
        { x: 120, y:   55, type: 'mousedown', pointerId: 1 },
        { x:   0, y: -200, type: 'mousemove', pointerId: 1 },
        { x:  80, y: -100, type: 'mousemove', pointerId: 1 },
        { x:  80, y: -100, type: 'mouseup', pointerId: 1 }
    ],
    touch2Move2End2: [
        {
            type: types.down,
            pointerId: 1,
            x: -23,
            y: -78,
            touches: [
                { x: -23, y: -78, identifier: 1 }
            ],
            changed: []
        },
        {
            type: types.down,
            pointerId: 2,
            x: -100,
            y: -100,
            touches: [
                { x:  -23, y:  -78, identifier: 1 },
                { x:  100, y:  100, identifier: 2 }
            ],
            changed: []
        },
        {
            type: types.move,
            pointerId: 1,
            x: -50,
            y: -50,
            touches: [
                { x:  50, y: -50, identifier: 1 },
                { x: 100, y: 100, identifier: 2 }
            ],
            changed: []
        },
        {
            type: types.move,
            pointerId: 2,
            x: 50,
            y: -50,
            touches: [
                { x:  50, y: -50, identifier: 1 },
                { x: -50, y:  50, identifier: 2 }
            ],
            changed: []
        },
        {
            type: types.up,
            pointerId: 1,
            x: -50,
            y:  50,
            touches: [
                { x: -50, y:  50, identifier: 2 }
            ],
            changed: [
                { x:  50, y: -50, identifier: 1 }
            ]
        },
        {
            type: types.up,
            pointerId: 2,
            x: -50,
            y:  50,
            touches: [],
            changed: [
                { x: -50, y:  50, identifier: 2 }
            ]
        }
    ]
};
