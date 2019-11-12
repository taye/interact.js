import { Scope } from '../core/scope';
import drag from './drag';
import drop from './drop/index';
import gesture from './gesture';
import resize from './resize';
declare function install(scope: Scope): void;
declare const id = "actions";
export { id, install, gesture, resize, drag, drop, };
