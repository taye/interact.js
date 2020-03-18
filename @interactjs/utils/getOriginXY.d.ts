export default function (target: Interact.HasGetRect & {
    options: Interact.PerActionDefaults;
}, element: Node, actionName?: Interact.ActionName): {
    x: any;
    y: any;
};
