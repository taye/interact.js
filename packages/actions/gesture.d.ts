import { Scope } from '@interactjs/core/scope';
declare function install(scope: Scope): void;
declare const gesture: {
    install: typeof install;
    defaults: {};
    checker(_pointer: any, _event: any, _interactable: any, _element: any, interaction: any): {
        name: string;
    };
    getCursor(): string;
};
export default gesture;
