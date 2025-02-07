/// <reference path="../types/index.d.ts" preserve="true"/>
class Capacitor<T> implements Nocta.Capacitor<T> {
  *[Symbol.iterator]() {
    for (const v of this.store) {
      yield v;
    }
  }
  private readonly store: T[] = [];
  private _closed: boolean = false;
  private generator: null | Generator<T, void, unknown> = null;
  private *__get_next() {
    let index = 0;
    while (true) {
      if (this.store.length === 0) {
        return;
      }
      yield this.store[index];
      index = (index + 1) % this.store.length;
    }
  }
  public get(): T {
    if (!this.generator) this.generator = this.__get_next();
    const r = this.generator.next();
    if (r.done) {
      this.generator = null;
      throw new Error("Capacitor get error");
    }
    return r.value;
  }
  public add(v: T): T {
    this.store.push(v);
    return v;
  }
  public set closed(closed: boolean) {
    this._closed = closed;
    if (this.generator) this.generator = null;
  }
  public get closed() {
    return this._closed;
  }
  public get empty() {
    return this.store.length === 0;
  }
  public reset() {
    if (this.generator) this.generator = null;
    this.store.length = 0;
    this._closed = false;
  }
}
const NODE_TYPE_PARENT: Nocta.NodeType.Parent = -1;
const NODE_TYPE_FRAGMENT: Nocta.NodeType.Fragment = 0;
const NODE_TYPE_TAG: Nocta.NodeType.Tag = 1;
const NODE_TYPE_CONTENT: Nocta.NodeType.Content = 2;
const NODE_TYPE_COMPONENT: Nocta.NodeType.Component = 3;
const NodePrototype = Object.create(Object.prototype, {
  __node: {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: false,
  },
});
const currentNodeContext: Nocta.Component[] = [];
const updateNodeQueue = new Set<Nocta.Component>();
let updateScheduled = false;

function node<T extends Nocta.AnyNode>(n: Nocta.AnyNode): T {
  Object.setPrototypeOf(n, NodePrototype);
  return n as T;
}
function isNode(t: any): t is Nocta.AnyNode {
  return Reflect.has(t, "__node");
}
function isFragmentNode(t: Nocta.AnyNode): t is Nocta.Fragment {
  return t.type === NODE_TYPE_FRAGMENT;
}
function isTagNode(t: Nocta.AnyNode): t is Nocta.Tag {
  return t.type === NODE_TYPE_TAG;
}
function isContentNode(t: Nocta.AnyNode): t is Nocta.Content {
  return t.type === NODE_TYPE_CONTENT;
}
function isComponentNode(t: Nocta.AnyNode): t is Nocta.Component {
  return t.type === NODE_TYPE_COMPONENT;
}
function isParentNode(t: Nocta.AnyNode): t is Nocta.Parent {
  return t.type === NODE_TYPE_PARENT;
}
function Parent(
  root: HTMLElement,
  ...children: Nocta.NodeChildren
): Nocta.Parent {
  if (children.length === 0)
    throw new Error("A main node must have at least one children");
  return node({
    type: NODE_TYPE_PARENT,
    dom: root,
    children,
  });
}
function Fragment(...children: Nocta.NodeChildren): Nocta.Fragment {
  return node<Nocta.Fragment>({
    type: NODE_TYPE_FRAGMENT,
    children,
    needsRehydrate: false,
    parent: null,
    indexOf: 0,
  });
}
function Tag<T extends Nocta.HTMLTags>(tag: T): Nocta.Tag<T>;
function Tag<T extends Nocta.HTMLTags>(
  tag: T,
  props: Nocta.HTMLProps<T>
): Nocta.Tag<T>;
function Tag<T extends Nocta.HTMLTags>(
  tag: T,
  children: Nocta.NodeChildren
): Nocta.Tag<T>;
function Tag<T extends Nocta.HTMLTags>(
  tag: T,
  props: Nocta.HTMLProps<T>,
  children: Nocta.NodeChildren
): Nocta.Tag<T>;
function Tag<T extends Nocta.HTMLTags>(tag: T, ...args: any[]): Nocta.Tag<T> {
  if (args.length) {
    if (Array.isArray(args[0])) {
      return node({
        type: NODE_TYPE_TAG,
        tag,
        props: {},
        children: args[0],
        dom: null,
        parent: null,
        needsRehydrate: false,
        indexOf: 0,
      });
    } else {
      if (args[1] && Array.isArray(args[1]))
        return node({
          type: NODE_TYPE_TAG,
          tag,
          props: args[0],
          children: args[1],
          dom: null,
          parent: null,
          needsRehydrate: false,
          indexOf: 0,
        });
      else
        return node({
          type: NODE_TYPE_TAG,
          tag,
          props: args[0],
          children: [],
          dom: null,
          parent: null,
          needsRehydrate: false,
          indexOf: 0,
        });
    }
  }
  return node({
    type: NODE_TYPE_TAG,
    tag,
    props: {},
    children: [],
    dom: null,
    parent: null,
    needsRehydrate: false,
    indexOf: 0,
  });
}
function Content(content: string): Nocta.Content {
  return node({
    type: NODE_TYPE_CONTENT,
    content,
    dom: null,
    parent: null,
    needsRehydrate: false,
    indexOf: 0,
  });
}
function Component<
  T extends Nocta.AnyNode = Nocta.AnyNode,
  P extends Nocta.ComponentProps | void = void
>(
  component: Nocta.Forwarder<T, P>,
  props: P = undefined as P
): Nocta.Component<T, P> {
  return node({
    type: NODE_TYPE_COMPONENT,
    component,
    props,
    capacitors: {
      effect: new Capacitor(),
      state: new Capacitor(),
      memory: new Capacitor(),
      cleanUp: new Capacitor(),
    },
    parent: null,
    virtual: null,
    needsRehydrate: false,
    indexOf: 0,
  });
}
function generateComponent(node: Nocta.Component): Nocta.AnyNode | null {
  setCurrentNodeContext(node);
  executeCleanups(node);
  const comp = node.component(node.props);
  if (comp instanceof Promise) {
    exitCurrentNodeContext();
    throw new Error("Component Forwarder cant be a promise.");
  }
  if (comp) {
    if (!isNode(comp)) {
      exitCurrentNodeContext();
      throw new Error("Not a valid node");
    }
    relateChild(node, comp);
  }
  exitCurrentNodeContext();
  return comp;
}
function relateChild(node: Nocta.AnyNode, child: Nocta.AnyNode) {
  if (isParentNode(child)) {
    return;
  } else child.parent = node;
}
function generateTree(node: Nocta.Component) {
  if (!isComponentNode(node)) throw new Error("Need to be a component");
  try {
    const virtual = generateComponent(node);
    if (!virtual) {
      if (node.virtual) {
        clear(node.virtual);
      } else clearReactivity(node);
      node.virtual = null;
      return;
    }
    if (node.virtual) {
      if (node.virtual.type !== virtual.type) {
        clear(node.virtual);
        relateChild(node, virtual);
        node.virtual = virtual;
      } else diff(node.virtual, virtual);
    } else {
      relateChild(node, virtual);
      node.virtual = virtual;
    }
  } catch (error) {
    console.error(error);
    return node.virtual;
  }
}
function clearDom(node: Nocta.Tag | Nocta.Content) {
  if (node.dom) node.dom.remove();
  node.dom = null;
}
function clearReactivity(node: Nocta.Component) {
  node.capacitors.state.reset();
  node.capacitors.effect.reset();
  node.capacitors.memory.reset();
}
function clear(node: Nocta.AnyNode) {
  if (isComponentNode(node)) {
    if (node.virtual) {
      clear(node.virtual);
    }
    clearReactivity(node);
    node.virtual = null;
  } else {
    if (!isContentNode(node)) {
      clearChild(node);
    }
    if (!isFragmentNode(node) && !isParentNode(node)) clearDom(node);
  }
}
function clearChild(node: Nocta.Fragment | Nocta.Parent | Nocta.Tag) {
  if (node.children.length)
    for (const c of node.children) {
      if (c) clear(c);
    }
}
function diffChild<T extends Nocta.Fragment | Nocta.Parent | Nocta.Tag>(
  node: T,
  target: T
) {
  if (target.children.length === 0) {
    clearChild(node);
    node.children.length = 0;
    return;
  } else if (node.children.length === 0) {
    node.children = target.children;
    return;
  }
  const cmax = Math.max(node.children.length, target.children.length);
  for (let i = 0; i < cmax; i++) {
    const child = node.children[i];
    const dchild = target.children[i];

    if (child) {
      if (!dchild) {
        clear(child);
        node.children[i] = null;
      } else {
        if (child.type !== dchild.type) {
          if (!isParentNode(dchild)) {
            dchild.indexOf = i;
          }
          clear(child);
          node.children[i] = dchild;
        } else diff(child, dchild);
      }
    } else {
      if (dchild) {
        if (!isParentNode(dchild)) {
          dchild.indexOf = i;
        }
        node.children[i] = dchild;
      }
    }
  }
}
function clearStyle(node: Nocta.Tag) {
  if (node.dom)
    for (const s in node.props.style) {
      Reflect.set(node.dom.style, s, "");
    }
}
function diffProps(node: Nocta.Tag, target: Nocta.Tag) {
  for (const k in node.props) {
    if (!(k in target.props) && node.tag === target.tag) {
      if (k === "style") {
        clearStyle(node);
      } else if (k === "className" && node.dom) {
        node.dom.className = "";
      } else if (node.dom) {
        node.dom.removeAttribute(k);
      }
    }
    if (k === "style" && target.props.style) {
      if (node.dom)
        for (const s in node.props.style) {
          if (!(k in target.props.style)) Reflect.set(node.dom.style, s, "");
        }
    }
    if (k.startsWith("on")) {
      if (node.dom) {
        const ev_name = k.slice(2);
        node.dom.removeEventListener(ev_name, Reflect.get(node.props, k));
      }
    }
  }
}
function applyProps(node: Nocta.Tag) {
  if (!node.dom) throw new Error("Dom is null");
  for (const k in node.props) {
    if (k === "style" && node.props["style"]) {
      for (const s in node.props.style) {
        const v = node.props.style[s];
        if (!v) {
          Reflect.set(node.dom.style, s, "");
        } else {
          Reflect.set(node.dom.style, s, v);
        }
      }
    } else if (k.startsWith("on")) {
      const ev_name = k.slice(2);
      node.dom.addEventListener(ev_name, Reflect.get(node.props, k));
    } else if (k === "className") {
      const name = Reflect.get(node.props, k);
      node.dom.className = name ? name : "";
    } else {
      const v = Reflect.get(node.props, k);
      if (typeof v === "boolean") {
        if (v) node.dom.setAttribute(k, "");
        else if (node.dom.hasAttribute(k)) {
          node.dom.removeAttribute(k);
        }
      } else node.dom.setAttribute(k, v);
    }
  }
}
function diff<T extends Nocta.AnyNode>(node: T, target: T) {
  if (isParentNode(node)) {
    diffChild(node, target as Nocta.Parent);
  } else if (isFragmentNode(node)) {
    diffChild(node, target as Nocta.Fragment);
  } else if (isTagNode(node)) {
    const _target = target as Nocta.Tag;
    diffProps(node, _target);
    diffChild(node, _target);
    if (node.tag !== _target.tag && node.dom) {
      node.tag = _target.tag;
      if (node.dom.isConnected) {
        const ndom = document.createElement(node.tag);
        node.dom.replaceWith(ndom);
        node.dom = ndom;
      } else {
        clear(node);
      }
    }
    node.props = _target.props;
  } else if (isContentNode(node)) {
    const _target = target as Nocta.Content;
    if (node.content !== _target.content) node.content = _target.content;
  } else if (isComponentNode(node)) {
    if (updateNodeQueue.size > 0 && updateNodeQueue.has(node)) {
      console.warn(
        "Current component found in updatequeue. Deleting to prevent overload."
      );
      updateNodeQueue.delete(node);
    }
    const _target = target as Nocta.Component;
    node.props = _target.props;
    if (node.component !== _target.component) clearReactivity(node);
    node.component = _target.component;

    const virtual = generateComponent(node);
    if (!virtual) {
      if (node.virtual) {
        clear(node.virtual);
      } else clearReactivity(node);
      node.virtual = null;
      return;
    }
    if (node.virtual) {
      diff(node.virtual, virtual);
    } else {
      relateChild(node, virtual);
      node.virtual = virtual;
    }
  }
}
function renderChild(node: Nocta.Parent | Nocta.Tag | Nocta.Fragment) {
  if (node.children.length) {
    let idxof = isFragmentNode(node) ? node.indexOf : 0;
    let lastNode: undefined | Nocta.AnyNode = undefined;
    for (const c of node.children) {
      if (c) {
        if (!isParentNode(c)) {
          if (lastNode && isFragmentNode(lastNode)) {
            c.indexOf =
              lastNode.indexOf +
              lastNode.children.filter((c) => c !== null).length;
          } else c.indexOf = idxof;
        }
        relateChild(node, c);
        render(c);
        lastNode = c;
        idxof++;
      } else lastNode = undefined;
    }
  }
}
function attach(node: Nocta.Tag | Nocta.Content) {
  if (!node.dom) return;
  const parent = getRoot(node);
  if (!parent) throw new Error("Parent is null");
  if (node.indexOf !== 0) {
    if (node.indexOf > parent.childNodes.length) parent.appendChild(node.dom);
    else parent.insertBefore(node.dom, parent.childNodes[node.indexOf]);
  } else parent.appendChild(node.dom);
}
function render(node: Nocta.AnyNode) {
  if (isParentNode(node) || isFragmentNode(node)) {
    renderChild(node);
  } else if (isContentNode(node)) {
    if (node.dom) {
      node.dom.nodeValue = node.content;
      if (!node.dom.isConnected) {
        attach(node);
      }
      return;
    }
    node.dom = document.createTextNode(node.content);
    attach(node);
  } else if (isTagNode(node)) {
    if (node.dom) {
      applyProps(node);
      renderChild(node);
      if (!node.dom.isConnected) {
        attach(node);
      }
      return;
    }
    node.dom = document.createElement(node.tag);
    applyProps(node);
    renderChild(node);
    attach(node);
  } else if (isComponentNode(node)) {
    if (node.virtual) {
      render(node.virtual);
      Promise.resolve().then(() => {
        executeEffects(node);
      });
    } else {
      generateTree(node);
      if (node.virtual) {
        if (!isParentNode(node.virtual))
          (node.virtual as Nocta.AnyNodeExceptParent).indexOf = node.indexOf;
        render(node.virtual);
        Promise.resolve().then(() => {
          executeEffects(node);
        });
      }
    }
  }
}
function renderNodes(root: HTMLElement, ...nodes: Nocta.NodeChildren) {
  const main = Parent(root, ...nodes);
  Promise.resolve().then(() => {
    render(main);
  });
  return main;
}
function setCurrentNodeContext(context: Nocta.Component) {
  if (!context || !isNode(context) || !isComponentNode(context))
    throw new Error("Null execution context provided");
  currentNodeContext.push(context);
}
function getCurrentNodeContext() {
  if (currentNodeContext.length === 0)
    throw new Error("Execution context is null");
  return currentNodeContext[currentNodeContext.length - 1];
}
function clearNodeContext(context: Nocta.Component) {
  if (context && isComponentNode(context)) {
    if (!context.capacitors.state.empty)
      if (!context.capacitors.state.closed) {
        context.capacitors.state.closed = true;
      }
    if (!context.capacitors.memory.empty) {
      if (!context.capacitors.memory.closed) {
        context.capacitors.memory.closed = true;
      }
    }
  } else throw new Error("Execution context is null.");
}
function exitCurrentNodeContext() {
  if (currentNodeContext.length === 0) return;
  clearNodeContext(currentNodeContext.pop()!);
}

function queueNodeUpdate(node: Nocta.Component) {
  node.needsRehydrate = true;
  updateNodeQueue.add(node);
  scheduleNodeUpdate();
}
function scheduleNodeUpdate() {
  if (!updateScheduled) {
    updateScheduled = true;
    Promise.resolve().then(() => {
      updateScheduled = false;
      processNodeUpdateQueue();
    });
  }
}
function processNodeUpdateQueue() {
  for (const node of updateNodeQueue) {
    updateNodeQueue.delete(node);
    if (!node.needsRehydrate) return;
    generateTree(node);
    render(node);
    node.needsRehydrate = false;
  }
}
function getRoot(node: Nocta.AnyNode): HTMLElement | undefined {
  if (isParentNode(node)) return node.dom;
  if (node.parent) {
    if (isTagNode(node.parent)) {
      return node.parent.dom ?? undefined;
    } else {
      return getRoot(node.parent);
    }
  } else throw new Error("No parent found in node.");
}

function performStateGet<T>(state: Nocta.StateContainer<T>) {
  return state.holded;
}
function performStateUpdate<T>(
  node: Nocta.Component,
  state: Nocta.StateContainer<T>,
  val: T | Nocta.StateMemoUpdate<T>
) {
  state.holded =
    typeof val === "function"
      ? (val as Nocta.StateMemoUpdate<T>)(state.holded)
      : val;
  if (state.effect) {
    state.effect(state.holded);
  }
  queueNodeUpdate(node);
}
function executeEffects(node: Nocta.Component) {
  if (!node.capacitors.effect.empty) {
    for (const effect of node.capacitors.effect) {
      const cleanup = effect();
      if (cleanup && typeof cleanup === "function")
        node.capacitors.cleanUp.add(cleanup);
    }
    node.capacitors.effect.reset();
  }
}
function executeCleanups(node: Nocta.Component) {
  if (!node.capacitors.cleanUp.empty) {
    for (const cleanUp of node.capacitors.cleanUp) {
      cleanUp();
    }
    node.capacitors.cleanUp.reset();
  }
}

function getCurrentNodeContextOrThrow() {
  const ctx = getCurrentNodeContext();
  if (!isNode(ctx) || !isComponentNode(ctx))
    throw new Error("Couldnt get current context.");
  return ctx;
}
function state<T extends any>(initialValue?: T): Nocta.StateWithEffect<T> {
  const ctx = getCurrentNodeContextOrThrow();
  const curr_state: Nocta.StateContainer<T> = ctx.capacitors.state.closed
    ? ctx.capacitors.state.get()
    : ctx.capacitors.state.add({
        holded: initialValue,
        effect: null,
      });
  const get: Nocta.StateGetter<T> = () => {
    return performStateGet(curr_state);
  };
  const set: Nocta.StateSetter<T> = (val) =>
    performStateUpdate(ctx, curr_state, val);
  const effect: Nocta.StateEffectSuscriber<T> = (eff) => {
    curr_state.effect = eff;
  };
  return [get, set, effect];
}
function effect(f: VoidFunction) {
  const ctx = getCurrentNodeContextOrThrow();
  ctx.capacitors.effect.add(f);
}
function memory<T extends any>(initialValue?: T): Nocta.Holder<T> {
  const ctx = getCurrentNodeContextOrThrow();
  const curr_memo = ctx.capacitors.memory.closed
    ? ctx.capacitors.memory.get()
    : ctx.capacitors.memory.add({ holded: initialValue });
  return curr_memo;
}
function createContext<
  T extends Record<string | symbol, any>
>(): Nocta.Context<T> {
  const ctx: Nocta.Holder<T | undefined> = { holded: undefined };
  return Object.create(Object.prototype, {
    consume: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: () => {
        if (ctx.holded === undefined) {
          throw new Error("Cant consume a context that is not defined.");
        }
        return ctx.holded;
      },
    },
    define: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: (v: T) => {
        ctx.holded = v;
      },
    },
  });
}

export {
  Parent,
  Fragment,
  Tag,
  Content,
  Component,
  renderNodes,
  state,
  effect,
  memory,
  createContext,
};
