import { ApplyDiff, GetDiff, VNodeUpdater } from "./diff.js";
import { VNode } from "./vdom.js";

export abstract class Component<P, S> {
  protected props: P;
  protected state: S;

  private currentRootNode: VNode | null;
  private mountedElem: HTMLElement | Text | null;

  constructor() {
    this.currentRootNode = null;
    this.mountedElem = null;
  }

  private getUpdateDiff(): VNodeUpdater {
    const newRootNode = this.render();
    const diff = GetDiff(this.currentRootNode as VNode, newRootNode);
    if (diff.type === "replace") {
      diff.callback = ((elem: HTMLElement | Text) => {
        this.mountedElem = elem;
      }).bind(this);
    }

    this.currentRootNode = newRootNode;
    setTimeout(() => {
      this.componentDidUpdate();
    });
    return diff;
  }

  public setState(updater: (state: S) => S) {
    if (this.mountedElem === null) {
      throw new Error("component is unmounted");
    }

    this.state = updater(this.state);
    const diff = this.getUpdateDiff();
    ApplyDiff(this.mountedElem, diff);
  }

  public setProps(props: P): VNodeUpdater {
    if (this.mountedElem === null) {
      throw new Error("component is unmounted");
    }
    this.props = props;

    return this.getUpdateDiff();
  }

  public initProps(props: P): VNode {
    this.props = props;
    this.currentRootNode = this.render();
    return this.currentRootNode;
  }

  public notifyMounted(elem: HTMLElement | Text) {
    this.mountedElem = elem;
    // почему-то не работает с setTimeout, после выполнения хука свойства объекта не обновляются
    this.componentDidMount();
  }

  public unmount = () => {
    this.componentWillUnmount();
    this.mountedElem = null;
  };

  public componentDidMount() {}

  public componentWillUnmount() {}

  public componentDidUpdate() {}

  public abstract render(): VNode;
}
