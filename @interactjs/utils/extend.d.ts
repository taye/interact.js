export default function extend<T, U extends object>(dest: U, source: T): T & U;
