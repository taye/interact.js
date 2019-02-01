/// <reference path="types.d.ts" />
import { Scope } from '@interactjs/core/scope';
import drag from './drag';
import drop from './drop';
import gesture from './gesture';
import resize from './resize';
declare function install(scope: Scope): void;
export { gesture, resize, drag, drop, install, };
