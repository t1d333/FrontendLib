import { Component } from "./component";

export interface VAttributes {
  [_: string]: string | number | boolean | Function | (string | VNode)[];
}

export interface VElement {
  type: "element";
  tagname: string;
  props?: VAttributes;
  children?: VNode[];
  key: string | number | undefined;
}

export interface VText {
  type: "text";
  value: string;
  key: string | number | undefined;
}

export interface VComponent {
  type: "component";
  instance?: Component<any, any>;
  component: { new (): Component<any, any> };
  props: object;
  key: string | number | undefined;
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
  const { key, ...restProps } = props;
  return {
    type: "component",
    key: key,
    component: component,
    props: restProps,
  };
};

export const createElement = (
  tag: string | { new (): Component<any, any> },
  props: VAttributes & { key?: string | number },
  ...children: (VNode | string)[]
): VNode => {
  const newChilds: VNode[] = [];
  if (typeof tag == "string") {
    children.forEach((child) => {
      if (typeof child === "string") {
        newChilds.push(createText(child));
      } else {
        newChilds.push(child);
      }
    });

    const { key, ...restProps } = props ?? {};

    return {
      type: "element",
      tagname: tag as string,
      props: restProps,
      children: newChilds,
      key: key,
    };
  }
  return createComponent(tag, { ...(props || {}), children: children });
};
