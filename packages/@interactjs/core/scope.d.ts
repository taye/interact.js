import type Interaction from '@interactjs/core/Interaction';
import './events';
import './interactions';
import { Interactable as InteractableBase } from './Interactable';
import './InteractableSet';
import type { OptionsArg } from './options';
export interface SignalArgs {
    'scope:add-document': DocSignalArg;
    'scope:remove-document': DocSignalArg;
    'interactable:unset': {
        interactable: InteractableBase;
    };
    'interactable:set': {
        interactable: InteractableBase;
        options: OptionsArg;
    };
    'interactions:destroy': {
        interaction: Interaction;
    };
}
export type ListenerName = keyof SignalArgs;
export type ListenerMap = {
    [P in ListenerName]?: (arg: SignalArgs[P], scope: Scope, signalName: P) => void | boolean;
};
interface DocSignalArg {
    doc: Document;
    window: Window;
    scope: Scope;
    options: Record<string, any>;
}
export interface Plugin {
    [key: string]: any;
    id?: string;
    listeners?: ListenerMap;
    before?: string[];
    install?(scope: Scope, options?: any): void;
}
export interface Scope {
    fire<T extends ListenerName>(name: T, arg: SignalArgs[T]): void | false;
}
export {};
