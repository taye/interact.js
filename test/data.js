window.data = {
    downMove2Up: [
        { x: 120, y:   55, type: 'mousedown' },
        { x:   0, y: -200, type: 'mousemove' },
        { x:  80, y: -100, type: 'mousemove' },
        { x:  80, y: -100, type: 'mouseup' }
    ],
    touch2Move2End2: [
        {
            type: 'touchstart',
            touches: [
                { x: -23, y: -78 }
            ]
        },
        {
            type: 'touchstart',
            touches: [
                { x: -100, y: -100 },
                { x:  100, y:  100 }
            ]
        },
        {
            type: 'touchmove',
            touches: [
                { x:  50, y: -50 },
                { x: 100, y: 100 }
            ]
        },
        {
            type: 'touchmove',
            touches: [
                { x:  50, y: -50 },
                { x: -50, y:  50 }
            ]
        },
        {
            type: 'touchend',
            touches: [
                { x: -50, y:  50 }
            ],
            changed: [
                { x:  50, y: -50 }
            ]
        },
        {
            type: 'touchend',
            touches: [],
            changed: [
                { x: -50, y:  50 }
            ]
        }
    ]
};
