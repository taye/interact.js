export class PointerInfo {
  constructor (
    public id: number,
    public pointer: Interact.PointerType,
    public event: Interact.PointerEventType,
    public downTime: number,
    public downTarget: Node,
  ) {}
}

export default PointerInfo
