export default function extend<T, U extends Partial<T>>(dest: U, source: T): T & U;
