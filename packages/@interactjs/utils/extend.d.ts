export default function extend<T, U extends object>(dest: U & Partial<T>, source: T): T & U;
