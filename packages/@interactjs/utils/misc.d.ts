import type { ActionName, ActionProps } from '@interactjs/core/types';
export declare function warnOnce<T>(this: T, method: (...args: any[]) => any, message: string): (this: T) => any;
export declare function copyAction<T extends ActionName>(dest: ActionProps<any>, src: ActionProps<T>): ActionProps<any>;
export declare const sign: (n: number) => 1 | -1;
