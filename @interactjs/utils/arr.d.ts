declare type Filter<T> = (element: T, index: number, array: T[]) => boolean;
export declare function contains<T>(array: T[], target: T): boolean;
export declare function remove<T>(array: T[], target: T): T[];
export declare function merge<T, U>(target: Array<T | U>, source: U[]): (T | U)[];
export declare function from<T = any>(source: ArrayLike<T>): T[];
export declare function findIndex<T>(array: T[], func: Filter<T>): number;
export declare function find<T = any>(array: T[], func: Filter<T>): T;
export {};
