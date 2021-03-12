declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: ReturnType<DefineComponent<{}, {}, any>>
  export default component
}
