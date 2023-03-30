import { renderElement } from "./render";
import { VAttributes, VComponent, VElement, VNode, VText } from "./vdom";

const removeDunderFields = (obj: any) => {
  return Object.keys(obj)
    .filter((key) => !key.startsWith("__"))
    .reduce((acc: object, key: string) => {
      return { ...acc, key: obj[key] };
    }, {});
};

const compareObjects = (obj1: any, obj2: any): boolean => {
  return (
    JSON.stringify(removeDunderFields(obj1)) ===
    JSON.stringify(removeDunderFields(obj2))
  );
};

type AttributesUpdater = {
  remove: string[];
  set: VAttributes;
};

interface UpdateOperation {
  type: "update";
  attrUpdater: AttributesUpdater;
  childUpdater: ChildUpdater[];
}

interface ReplaceOperation {
  type: "replace";
  newNode: VNode;
  callback?: (elem: HTMLElement | Text) => void;
}

interface SkipOperation {
  type: "skip";
}

interface DeleteOperation {
  type: "delete";
}

interface InsertOperation {
  type: "insert";
  node: VNode;
}

const createSkip = (): SkipOperation => {
  return {
    type: "skip",
  };
};

const createReplace = (node: VNode): ReplaceOperation => {
  return {
    type: "replace",
    newNode: node,
  };
};

const createDelete = (): DeleteOperation => {
  return {
    type: "delete",
  };
};

const createInsert = (node: VNode): InsertOperation => {
  return {
    type: "insert",
    node: node,
  };
};

const createUpdate = (
  attrUpdater: AttributesUpdater,
  childUpdater: ChildUpdater[]
): UpdateOperation => {
  return {
    type: "update",
    attrUpdater: attrUpdater,
    childUpdater: childUpdater,
  };
};

export type VNodeUpdater = UpdateOperation | ReplaceOperation | SkipOperation;

export type ChildUpdater = VNodeUpdater | DeleteOperation | InsertOperation;

export const GetDiff = (oldNode: VNode, newNode: VNode): VNodeUpdater => {
  if (
    oldNode.type == "text" &&
    newNode.type == "text" &&
    (oldNode as VText).value === (newNode as VText).value
  ) {
    return createSkip();
  }

  if (oldNode.type == "text" || newNode.type == "text") {
    return createReplace(newNode);
  }

  if (oldNode.type == "component" && newNode.type == "component") {
    oldNode = oldNode as VComponent;
    newNode = newNode as VComponent;

    if (oldNode.component === newNode.component && oldNode.instance) {
      newNode.instance = oldNode.instance;
      if (compareObjects(oldNode.props, newNode.props)) {
        return createSkip();
      }
      return newNode.instance.setProps(newNode.props);
    }
  }

  if (oldNode.type == "component") {
    oldNode.instance!.unmount();
    return createReplace(newNode);
  }

  if (newNode.type == "component") {
    newNode.instance = new newNode.component();
    return {
      type: "replace",
      newNode: newNode.instance.initProps(newNode.props),
      callback: (e) => newNode.instance.notifyMounted(e),
    };
  }

  const oldElem: VElement = oldNode as VElement;
  const newElem: VElement = newNode as VElement;

  if (oldElem.tagname != newElem.tagname) {
    return createReplace(newNode);
  }

  const attrUpdater: AttributesUpdater = {
    remove: Object.keys(oldElem.props || {}).filter(
      (att) => Object.keys(newElem.props || {}).indexOf(att) == -1
    ),

    set: Object.keys(newElem.props || {})
      .filter((att) => oldElem.props![att] != newElem.props![att])
      .reduce((obj, att) => ({ ...obj, [att]: newElem.props![att] }), {}),
  };

  const childUpdater: ChildUpdater[] = GetChildsDiff(
    oldElem.children || [],
    newElem.children || []
  );
  return createUpdate(attrUpdater, childUpdater);
};

const deleteBeforKey = (
  operations: ChildUpdater[],
  elems: [string | number, VNode][],
  key: string | number | undefined
) => {
  while (elems[0] && elems[0][0] !== key) {
    if (elems[0][1].type === "component") {
      elems[0][1].instance!.unmount();
      elems[0][1].instance = undefined;
    }
    operations.push(createDelete());
    elems.shift();
  }
};

const insertAfterKey = (
  operations: ChildUpdater[],
  elems: [string | number, VNode][],
  key: string | number | undefined
) => {
  while (elems[0] && elems[0][0] !== key) {
    operations.push(createInsert(elems.shift()![1]));
  }
};

/*
 Возможна оптимизация, каждая пара remove и insert выполняется с помощью одной replace. 
*/

export const GetChildsDiff = (
  oldChilds: VNode[],
  newChilds: VNode[]
): ChildUpdater[] => {
  const remainingOldChilds: [string | number, VNode][] = oldChilds.map(
    (node) => [node.key || "", node]
  );
  const remainingNewChilds: [string | number, VNode][] = newChilds.map(
    (node) => [node.key || "", node]
  );

  let [updateKey] = remainingOldChilds.find(
    (k) => remainingNewChilds.map((p) => p[0]).indexOf(k[0]) != -1
  ) || [null];
  const operations: ChildUpdater[] = [];
  while (updateKey || updateKey == "") {
    deleteBeforKey(operations, remainingOldChilds, updateKey);
    insertAfterKey(operations, remainingNewChilds, updateKey);
    operations.push(
      GetDiff(remainingOldChilds.shift()![1], remainingNewChilds.shift()![1])
    );
    [updateKey] = remainingOldChilds.find(
      (k) => remainingNewChilds.map((p) => p[0]).indexOf(k[0]) != -1
    ) || [null];
  }

  deleteBeforKey(operations, remainingOldChilds, undefined);
  insertAfterKey(operations, remainingNewChilds, undefined);
  return operations;
};

export const ApplyDiff = (
  node: HTMLElement | Text,
  diff: VNodeUpdater
): HTMLElement | Text => {
  switch (diff.type) {
    case "skip":
      return node;
    case "replace":
      const newNode = renderElement(diff.newNode);
      node.replaceWith(newNode);
      if (diff.callback) diff.callback(newNode);
      return newNode;
    default:
      if (node.nodeType === Node.TEXT_NODE) {
        throw new Error("invalid update for Text node");
      }

      diff.attrUpdater.remove.forEach((att) => {
        (node as HTMLElement).removeAttribute(att);
      });

      Object.keys(diff.attrUpdater.set).forEach((att) => {
        (node as any)[att] = diff.attrUpdater.set[att];
      });

      ApplyChildsDiff(node as HTMLElement, diff.childUpdater);

      return node;
  }
};

export const ApplyChildsDiff = (
  node: HTMLElement,
  operations: ChildUpdater[]
) => {
  let offset: number = 0;

  for (let i = 0; i < operations.length; ++i) {
    switch (operations[i].type) {
      case "skip":
        break;
      case "delete":
        node.childNodes[i - offset].remove();
        ++offset;
        break;
      case "insert":
        const newChild = (operations[i] as InsertOperation).node;

        if (node.childNodes[i - offset - 1]) {
          node.childNodes[i - offset - 1].after(renderElement(newChild));
        } else {
          node.appendChild(renderElement(newChild));
        }
        break;
      default:
        ApplyDiff(
          node.childNodes[i - offset] as HTMLElement,
          operations[i] as VNodeUpdater
        );
        break;
    }
  }
};
