import * as actions from '@interactjs/actions';
import autoScroll from '@interactjs/auto-scroll';
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault';
import inertia from '@interactjs/inertia';
import modifiersBase from '@interactjs/modifiers/base';
import * as pointerEvents from '@interactjs/pointer-events';
import reflow from '@interactjs/reflow';
import interact from './interact';
export declare function init(window: Window): typeof interact;
export declare namespace init {
    var version: string;
}
export default interact;
export { interact, actions, autoScroll, interactablePreventDefault, inertia, modifiersBase as modifiers, pointerEvents, reflow, };
