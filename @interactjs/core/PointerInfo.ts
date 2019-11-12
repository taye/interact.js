/* eslint-disable @typescript-eslint/no-parameter-properties */
export class PointerInfo {
  constructor (
    public id: number,
    public pointer: Interact.PointerType,
    public event: Interact.PointerEventType,
    public downTime: number,
    public downTarget: Interact.EventTarget,
  ) {}
}

export default PointerInfo
