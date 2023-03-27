export { Component } from "./component";
export { renderElement } from "./render";
export { createElement, VAttributes } from "./vdom";
export namespace JSX {
  interface IntrinsicElements {
    [_: string]: VAttributes & { key?: string | number };
  }
}
