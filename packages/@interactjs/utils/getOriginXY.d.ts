import type { PerActionDefaults } from '@interactjs/core/options';
import type { ActionName, HasGetRect } from '@interactjs/core/types';
export default function getOriginXY(target: HasGetRect & {
    options: PerActionDefaults;
}, element: Node, actionName?: ActionName): {
    x: number;
    y: number;
};
