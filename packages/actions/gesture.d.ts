import { Scope } from '@interactjs/core/scope';
export declare type GesturableMethod = (options?: Interact.GesturableOptions | boolean) => Interact.Interactable | Interact.GesturableOptions;
declare function install(scope: Scope): void;
declare const gesture: {
    install: typeof install;
    defaults: {};
    checker(_pointer: any, _event: any, _interactable: any, _element: any, interaction: {
        pointers: {
            length: number;
        };
    }): {
        name: string;
    };
    getCursor(): string;
};
export default gesture;
