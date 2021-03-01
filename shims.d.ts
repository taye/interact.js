declare namespace React {
  interface HTMLAttributes<T> {
    class?: string
  }
  interface SVGProps<T> {
    class?: string
  }
}

declare module '*.vue' {
  const x: any
  export default x
}
