import { VComponent, VElement, VNode, VText } from "./vdom";

export const renderElement = (elem: VNode): HTMLElement | Text => {
  if (elem.type == "text") {
    return document.createTextNode((elem as VText).value);
  }

  if (elem.type == "component") {
    elem = elem as VComponent;

    if (elem.instance) {
      const node = renderElement(elem.instance!.render());
      elem.instance.notifyMounted(node);
      return node;
    }
    elem.instance = new elem.component();

    const node = renderElement(elem.instance.initProps(elem.props));
    elem.instance.notifyMounted(node as HTMLElement);
    return node;
  }

  const vnode: VElement = elem as VElement;
  const result: HTMLElement = document.createElement(vnode.tagname);
  for (const att in vnode.props || {}) {
    if (vnode.props![att]) {
      (result as any)[att] = vnode.props![att];
    }
  }
  (vnode.children || []).forEach((child) => {
    result.appendChild(renderElement(child));
  });

  return result;
};
