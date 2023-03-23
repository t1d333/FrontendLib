import {VNode, VElement, createElement} from "./vdom.js";
import {renderElement} from "./render.js";
import { ApplyDiff, GetDiff } from "./diff.js";


const root = document.querySelector("#root");

//
// const test = createElement("div", {classList: "test", id:"hui", key:"test", "innerHTML": "ebanaya", onclick: () => {console.log(123)}});
//
// const test2 = createElement("div", {classList: "test", id:"hui2", key:"test1", style:"width: 100px; height: 100px; background: #f00;", "innerHTML": "huinya", onclick: () => {console.log(123)}}, test);
//
// const test3 = createElement("div", {classList: "test3", id:"hui3", key:"test3","innerHTML": "test3", onclick: () => {console.log(123)}}, test);
//
//
// let el = renderElement(test2);
// root?.appendChild(el);
// const diff = GetDiff(test2, test3);
//
//setTimeout(() => {el = ApplyDiff(el, diff); root?.children[0].remove(); root?.appendChild(el); }, 5000);
