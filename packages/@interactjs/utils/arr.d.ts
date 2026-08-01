type Filter<T> = (element: T, index: number, array: T[]) => boolean;
export declare const contains: <T>(array: T[], target: T) => boolean;
export declare const remove: <T>(array: T[], target: T) => T[];
export declare const merge: <T, U>(target: (T | U)[], source: U[]) => (T | U)[];
export declare const from: <T = any>(source: ArrayLike<T>) => T[];
export declare const findIndex: <T>(array: T[], func: Filter<T>) => number;
export declare const find: <T = any>(array: T[], func: Filter<T>) => T;
export {};
