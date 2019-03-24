import { Scope } from '@interactjs/core/scope';
import drag, { DragEvent } from './drag';
import drop from './drop';
import gesture, { GestureEvent } from './gesture';
import resize, { ResizeEvent } from './resize';
declare function install(scope: Scope): void;
declare const id = "actions";
export { id, install, gesture, GestureEvent, resize, ResizeEvent, drag, DragEvent, drop, };
