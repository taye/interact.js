export default function clone<T extends {
    [key: string]: any;
}>(source: T): Partial<T>;
