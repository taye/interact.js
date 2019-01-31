declare const finder: {
    methodOrder: string[];
    search: (details: any) => any;
    simulationResume: ({ pointerType, eventType, eventTarget, scope }: {
        pointerType: any;
        eventType: any;
        eventTarget: any;
        scope: any;
    }) => any;
    mouseOrPen: ({ pointerId, pointerType, eventType, scope }: {
        pointerId: any;
        pointerType: any;
        eventType: any;
        scope: any;
    }) => any;
    hasPointer: ({ pointerId, scope }: {
        pointerId: any;
        scope: any;
    }) => any;
    idle: ({ pointerType, scope }: {
        pointerType: any;
        scope: any;
    }) => any;
};
export default finder;
