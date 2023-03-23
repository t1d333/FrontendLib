import { Component } from "./component.js";

export type VAttributes = {
  [_: string]: string | number | boolean | Function;
};

export interface VElement {
  type: "element";
  tagname: string;
  props?: VAttributes;
  children?: VNode[];
  key: string | number;
}

export interface VText {
  type: "text";
  value: string;
  key: string | number;
}

export interface VComponent {
  type: "component";
  instance?: Component<any, any>;
  component: { new (): Component<any, any> };
  props: object;
  key: string | number;
}

export type VNode = VElement | VText | VComponent;

const createText = (value: string, key: string | number = ""): VText => {
  return {
    value: value,
    key: key,
    type: "text",
  };
};

const createComponent = (
  component: { new (): Component<any, any> },
  props: VAttributes & { key?: string | number }
): VComponent => {
  let key = props.key || "";
  delete props.key;
  return {
    type: "component",
    key: key,
    component: component,
    props: props,
  };
};

export const createElement = (
  tag: string | { new (): Component<any, any> },
  props: VAttributes & { key?: string | number },
  ...children: (VNode | string)[]
): VNode => {
  const newChilds: VNode[] = [];
  if (typeof tag == "function") {
    return createComponent(tag as { new (): Component<any, any> }, props || {});
  }

  children.forEach((child) => {
    if (typeof child === "string") {
      newChilds.push(createText(child));
    } else {
      newChilds.push(child);
    }
  });

  let key: string | number = "";

  if (props) {
    key = props.key || "";
    delete props.key;
  }

  return {
    type: "element",
    tagname: tag as string,
    props: props,
    children: newChilds,
    key: key,
  };
};
