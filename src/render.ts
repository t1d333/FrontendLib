import { VComponent, VElement, VNode, VText } from "./vdom";

const renderComponent = (elem: VComponent): HTMLElement | Text => {
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
};

const renderNode = (elem: VElement): HTMLElement | Text => {
  const vnode: VElement = elem;
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

export const renderElement = (elem: VNode): HTMLElement | Text => {
  switch (elem.type) {
    case "text":
      return document.createTextNode(elem.value);
    case "component":
      return renderComponent(elem);
    default:
      return renderNode(elem);
  }
};
