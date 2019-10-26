import { HasGetRect } from '@interactjs/types/types';
export default function (target: HasGetRect & {
    options: Interact.PerActionDefaults;
}, element: any, action?: any): {
    x: any;
    y: any;
};
