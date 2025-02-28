/// <reference path="../types/index.d.ts" preserve="true"/>

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
const currentNodeContext: Nocta.AnyComponent[] = [];
const updateNodeQueue = new Set<Nocta.AnyComponent>();
let updateScheduled = false;

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
function node<T extends Nocta.AnyNode>(n: Nocta.AnyNode): T {
  Object.setPrototypeOf(n, NodePrototype);
  return n as T;
}
function isNode(t: any): t is Nocta.AnyNode {
  return Reflect.get(t, "__node") === 1;
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
function isComponentNode(t: Nocta.AnyNode): t is Nocta.AnyComponent {
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
    treeId: Symbol(),
    treeIdx: 0,
  });
}
function Fragment(...children: Nocta.NodeChildren): Nocta.Fragment {
  return node<Nocta.Fragment>({
    type: NODE_TYPE_FRAGMENT,
    children,
    needsRehydrate: false,
    parent: null,
    indexOf: 0,
    validIndexOf: 0,
    treeId: undefined,
    treeIdx: 0,
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
        treeId: undefined,
        treeIdx: 0,
      });
    }
    return node({
      type: NODE_TYPE_TAG,
      tag,
      props: args[0],
      children: args[1] && Array.isArray(args[1]) ? args[1] : [],
      dom: null,
      parent: null,
      needsRehydrate: false,
      indexOf: 0,
      treeId: undefined,
      treeIdx: 0,
    });
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
    treeId: undefined,
    treeIdx: 0,
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
    treeId: undefined,
    treeIdx: 0,
  });
}
function Component<T extends Nocta.AnyValidNode = Nocta.AnyValidNode>(
  template: Nocta.Template<T, void>
): Nocta.Component<T, void>;
function Component<
  T extends Nocta.AnyValidNode = Nocta.AnyValidNode,
  P extends Nocta.ComponentProps = Nocta.ComponentProps
>(template: Nocta.Template<T, P>, props: P): Nocta.Component<T, P>;
function Component<
  T extends Nocta.AnyValidNode = Nocta.AnyValidNode,
  P extends Nocta.ComponentProps | void = Nocta.ComponentProps
>(template: Nocta.Template<T, P>, ...args: any[]): Nocta.Component<T, P> {
  return node({
    id: Symbol(),
    type: NODE_TYPE_COMPONENT,
    template: template as Nocta.Template,
    props: args[0] ?? undefined,
    capacitors: {
      effect: new Capacitor(),
      state: new Capacitor(),
      memory: new Capacitor(),
      cleanUp: new Capacitor(),
      links: new Set(),
    },
    parent: null,
    virtual: null,
    needsRehydrate: false,
    indexOf: 0,
    treeId: undefined,
    treeIdx: 0,
  }) as Nocta.Component<T, P>;
}
function generateComponent(node: Nocta.AnyComponent): Nocta.AnyNode | null {
  setCurrentNodeContext(node);
  executeCleanups(node);

  const comp =
    node.props && node.template.length
      ? (
          node.template as Nocta.Template<Nocta.AnyValidNode, Nocta.KeyedObject>
        )(node.props)
      : (node.template as Nocta.Template)();
  if (comp instanceof Promise) {
    exitCurrentNodeContext();
    throw new Error("Template cant be a promise");
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
  child.treeId = node.treeId;
  child.treeIdx = node.treeIdx + 1;
  if (isParentNode(child)) {
    return;
  } else child.parent = node;
}
function generateTree(node: Nocta.AnyComponent) {
  if (!isComponentNode(node)) throw new Error("Need to be a component");
  try {
    const virtual = generateComponent(node);
    if (!virtual) {
      if (node.virtual) {
        clearNode(node.virtual);
      }
      node.virtual = null;
      return false;
    }
    if (node.virtual) {
      if (node.virtual.type !== virtual.type) {
        clearNode(node.virtual);
        relateChild(node, virtual);
        node.virtual = virtual;
      } else diff(node.virtual, virtual);
    } else {
      relateChild(node, virtual);
      node.virtual = virtual;
      if (!isParentNode(node.virtual)) node.virtual.indexOf = node.indexOf;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
function clearDom(node: Nocta.Tag | Nocta.Content) {
  if (node.dom) {
    if (isTagNode(node) && node.props) {
      for (const k in node.props) {
        if (k.startsWith("on")) {
          const ev_name = k.slice(2);
          node.dom.removeEventListener(ev_name, Reflect.get(node.props, k));
        }
      }
    }
    node.dom.remove();
  }
  node.dom = null;
}
function clearReactivity(node: Nocta.AnyComponent) {
  node.capacitors.state.reset();
  node.capacitors.effect.reset();
  node.capacitors.memory.reset();
  if (node.capacitors.links.size) {
    for (const l of node.capacitors.links) {
      l.consumers.delete(node.id);
    }
    node.capacitors.links.clear();
  }
}
function clearNode(node: Nocta.AnyNode) {
  if (isComponentNode(node)) {
    if (updateNodeQueue.has(node)) updateNodeQueue.delete(node);
    if (node.virtual) {
      if (isComponentNode(node.virtual)) clearReactivity(node.virtual);
      clearNode(node.virtual);
    }
    clearReactivity(node);
    node.virtual = null;
    return;
  }
  if (!isContentNode(node)) {
    clearChild(node);
  }
  if (!isFragmentNode(node) && !isParentNode(node)) clearDom(node);
}
function clearChild(node: Nocta.Fragment | Nocta.Parent | Nocta.Tag) {
  if (node.children.length)
    for (const c of node.children) {
      if (c) clearNode(c);
    }
}
function diffChild<T extends Nocta.Fragment | Nocta.Parent | Nocta.Tag>(
  node: T,
  target: T
) {
  if (!node || !target) return;
  if (target.children.length === 0) {
    clearChild(node);
    node.children.length = 0;
    return;
  } else if (node.children.length === 0) {
    node.children = target.children;
    return;
  }
  const cmax = Math.max(node.children.length, target.children.length);
  let lastChild: null | Nocta.AnyNode = null;
  for (let i = 0; i < cmax; i++) {
    const child = node.children[i];
    const dchild = target.children[i];
    if (child) {
      if (dchild) {
        if (child.type !== dchild.type) {
          if (!isParentNode(dchild)) {
            dchild.indexOf = isParentNode(child) ? i : child.indexOf ?? i;
          }
          clearNode(child);
          node.children[i] = dchild;
          lastChild = dchild;
        } else {
          diff(child, dchild);
          lastChild = child;
        }
      } else {
        clearNode(child);
        node.children[i] = null;
        lastChild = null;
      }
    } else if (dchild) {
      if (!isParentNode(dchild)) {
        if (lastChild && !isParentNode(lastChild)) {
          if (isFragmentNode(lastChild)) {
            dchild.indexOf = lastChild.validIndexOf;
          } else if (isComponentNode(lastChild)) {
            if (lastChild.virtual) {
              if (!isParentNode(lastChild.virtual)) {
                if (isFragmentNode(lastChild.virtual)) {
                  dchild.indexOf = lastChild.virtual.validIndexOf;
                } else {
                  dchild.indexOf = lastChild.indexOf + 1;
                }
              } else dchild.indexOf = i;
            } else {
              dchild.indexOf = lastChild.indexOf + 1;
            }
          } else {
            dchild.indexOf = lastChild.indexOf + 1;
          }
        } else {
          dchild.indexOf = i;
        }
      }
      if (isFragmentNode(dchild)) {
        dchild.validIndexOf = getFValidIdxOf(dchild);
      }
      node.children[i] = dchild;
      lastChild = dchild;
    } else lastChild = null;
  }
}
function clearStyle(node: Nocta.Tag) {
  if (node.dom && node.props)
    for (const s in node.props.style) {
      Reflect.set(node.dom.style, s, "");
    }
}
function diffProps(node: Nocta.Tag, target: Nocta.Tag) {
  if (node.props && target.props)
    for (const k in node.props) {
      if (!(k in target.props) && node.tag === target.tag) {
        if (k === "style") {
          clearStyle(node);
        } else if (node.dom) {
          if (k === "className") {
            node.dom.className = "";
          } else if (node.dom) {
            node.dom.removeAttribute(k);
          }
        }
      }
      if (k === "style" && target.props.style && node.dom) {
        for (const s in node.props.style) {
          if (!(k in target.props.style)) Reflect.set(node.dom.style, s, "");
        }
      }
      if (k.startsWith("on") && node.dom) {
        const ev_name = k.slice(2);
        node.dom.removeEventListener(
          ev_name,
          (node.props as Nocta.KeyedObject)[k]
        );
      }
    }
}
function applyProps(node: Nocta.Tag) {
  if (!node.dom) throw new Error("Dom is null");
  if (node.props)
    for (const k in node.props) {
      if (k === "style" && node.props.style) {
        for (const s in node.props.style) {
          try {
            const v = node.props.style[s];
            if (v) {
              Reflect.set(node.dom.style, s, v);
            } else {
              Reflect.set(node.dom.style, s, "");
            }
          } catch (error) {
            console.error(`Apply prop error wrong style '${s}'`);
          }
        }
      } else if (k.startsWith("on")) {
        const ev_name = k.slice(2);
        if (!(node.props as Nocta.KeyedObject)[k]) continue;
        if (typeof (node.props as Nocta.KeyedObject)[k] !== "function")
          throw new Error(`Wrong event listener '${k}'`);

        node.dom.addEventListener(
          ev_name,
          (node.props as Nocta.KeyedObject)[k]
        );
      } else if (k === "className") {
        const name = Reflect.get(node.props, k);
        node.dom.className = name ? name : "";
      } else if (k === "value") {
        Reflect.set(node.dom, k, Reflect.get(node.props, k));
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
  if (!target) return;
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
        clearNode(node);
      }
    }
    node.props = _target.props;
  } else if (isContentNode(node)) {
    const _target = target as Nocta.Content;
    if (node.content !== _target.content) node.content = _target.content;
  } else if (isComponentNode(node)) {
    if (updateNodeQueue.size > 0 && updateNodeQueue.has(node)) {
      updateNodeQueue.delete(node);
    }
    const _target = target as Nocta.Component;
    node.props = _target.props;
    if (node.template !== _target.template) clearReactivity(node);
    node.template = _target.template;
    const virtual = generateComponent(node);
    if (!virtual) {
      if (node.virtual) {
        clearNode(node.virtual);
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
function attach(node: Nocta.Tag | Nocta.Content) {
  if (!node.dom) return;
  const parent = getRoot(node);
  if (!parent) throw new Error("Parent is null");
  if (node.indexOf !== 0) {
    if (node.indexOf > parent.childNodes.length) parent.appendChild(node.dom);
    else parent.insertBefore(node.dom, parent.childNodes[node.indexOf]);
  } else if (parent.hasChildNodes())
    parent.insertBefore(node.dom, parent.childNodes[node.indexOf]);
  else parent.appendChild(node.dom);
}
function getFValidIdxOf(node: Nocta.Fragment) {
  return node.indexOf + node.children.filter((c) => c !== null).length;
}
function renderChild(node: Nocta.Parent | Nocta.Tag | Nocta.Fragment) {
  if (!node.children.length) {
    return;
  }
  const isf = isFragmentNode(node);
  let idxof = 0;
  let lastNode: null | Nocta.AnyNode = null;

  if (isf) {
    idxof = node.indexOf;
    node.validIndexOf = getFValidIdxOf(node);
  }
  for (const c of node.children) {
    if (c) {
      if (!isParentNode(c)) {
        if (lastNode) {
          if (!isParentNode(lastNode)) {
            if (isFragmentNode(lastNode)) {
              idxof = lastNode.validIndexOf;
              c.indexOf = idxof;
            } else if (isComponentNode(lastNode)) {
              if (lastNode.virtual && !isParentNode(lastNode.virtual)) {
                if (isFragmentNode(lastNode.virtual)) {
                  idxof = lastNode.virtual.validIndexOf;
                  c.indexOf = idxof;
                } else {
                  idxof = lastNode.virtual.indexOf + 1;
                  c.indexOf = idxof;
                }
              } else {
                idxof = lastNode.indexOf + 1;
                c.indexOf = idxof;
              }
            } else {
              idxof = lastNode.indexOf + 1;
              c.indexOf = lastNode.indexOf + 1;
            }
          }
        } else {
          c.indexOf = idxof;
          if (isFragmentNode(c)) c.validIndexOf = getFValidIdxOf(c);
        }
      }
      relateChild(node, c);
      render(c);
      lastNode = c;
      idxof++;
    } else lastNode = null;
  }
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
    } else if (generateTree(node)) {
      render(node.virtual!);
      Promise.resolve().then(() => {
        executeEffects(node);
      });
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
function setCurrentNodeContext(context: Nocta.AnyComponent) {
  if (!context || !isNode(context) || !isComponentNode(context))
    throw new Error("Null execution context provided");
  currentNodeContext.push(context);
}
function getCurrentNodeContext() {
  if (currentNodeContext.length === 0)
    throw new Error("Execution context is null");
  return currentNodeContext[currentNodeContext.length - 1];
}
function getCurrentNodeContextOrThrow() {
  const ctx = getCurrentNodeContext();
  if (!isNode(ctx) || !isComponentNode(ctx))
    throw new Error("Couldnt get current context.");
  return ctx;
}
function clearNodeContext(context: Nocta.AnyComponent) {
  if (context && isComponentNode(context)) {
    if (!context.capacitors.state.empty && !context.capacitors.state.closed)
      context.capacitors.state.closed = true;
    if (!context.capacitors.memory.empty && !context.capacitors.memory.closed) {
      context.capacitors.memory.closed = true;
    }
  } else throw new Error("Execution context is null.");
}
function exitCurrentNodeContext() {
  if (currentNodeContext.length === 0) return;
  clearNodeContext(currentNodeContext.pop()!);
}
function queueNodeUpdate(node: Nocta.AnyComponent) {
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
    return isTagNode(node.parent)
      ? node.parent.dom ?? undefined
      : getRoot(node.parent);
  } else throw new Error("No parent found in node.");
}

function performStateUpdate<T>(
  node: Nocta.AnyComponent,
  state: Nocta.Holder<T>,
  val: T | Nocta.StateMemoUpdate<T>
) {
  state.holded =
    typeof val === "function"
      ? (val as Nocta.StateMemoUpdate<T>)(state.holded)
      : val;
  queueNodeUpdate(node);
}
function executeEffects(node: Nocta.AnyComponent) {
  if (!node.capacitors.effect.empty) {
    for (const effect of node.capacitors.effect) {
      const cleanup = effect();
      if (cleanup && typeof cleanup === "function")
        node.capacitors.cleanUp.add(cleanup);
    }
    node.capacitors.effect.reset();
  }
}
function executeCleanups(node: Nocta.AnyComponent) {
  if (!node.capacitors.cleanUp.empty) {
    for (const cleanUp of node.capacitors.cleanUp) {
      cleanUp();
    }
    node.capacitors.cleanUp.reset();
  }
}

function state<T extends any>(initialValue?: T): Nocta.State<T> {
  const ctx = getCurrentNodeContextOrThrow();
  const curr_state: Nocta.Holder<T> = ctx.capacitors.state.closed
    ? ctx.capacitors.state.get()
    : ctx.capacitors.state.add({
        holded: initialValue,
      });
  const get: Nocta.StateGetter<T> = () => {
    return curr_state.holded;
  };
  const set: Nocta.StateSetter<T> = (val) =>
    performStateUpdate(ctx, curr_state, val);
  return [get, set];
}
function effect(f: VoidFunction) {
  const ctx = getCurrentNodeContextOrThrow();
  ctx.capacitors.effect.add(f);
}
function memory<T extends any>(initialValue?: T): Nocta.Holder<T> {
  const ctx = getCurrentNodeContextOrThrow();
  return ctx.capacitors.memory.closed
    ? ctx.capacitors.memory.get()
    : ctx.capacitors.memory.add({ holded: initialValue });
}
const enum ContextLinkerFlag {
  None,
  Provided,
  Destroyed,
}
abstract class AbsContextLinker<P extends any> {
  protected abstract update: Nocta.ContextLinkerUpdater;
  public declare onProvide: Nocta.ContextLinkerProvide<P> | undefined;
  public declare onDestroy: VoidFunction | undefined;
}
class ContextLinker<Args extends any = any> extends AbsContextLinker<Args> {
  protected readonly update: Nocta.ContextLinkerUpdater;
  public onProvide: Nocta.ContextLinkerProvide<Args> | undefined = undefined;
  public onDestroy: VoidFunction | undefined = undefined;
  constructor(u: VoidFunction) {
    super();
    this.update = u;
  }
}
function contextUpdater(consumers: Map<symbol, Nocta.AnyComponent>) {
  for (const c of consumers.values()) {
    queueNodeUpdate(c);
  }
}
function contextWrapper<
  T extends Nocta.KeyedObject
>(): Nocta.ContextWrapper<T> {
  const consumers: Map<symbol, Nocta.AnyComponent> = new Map();
  const data: Nocta.Holder<undefined | T> = {
    holded: undefined,
  };
  let flag: ContextLinkerFlag = ContextLinkerFlag.None;
  return Object.create(Object.prototype, {
    consumers: {
      enumerable: false,
      configurable: false,
      get: () => consumers,
      set: (_) => {
        throw new Error("Consumers cant be overwritten");
      },
    },
    data: {
      enumerable: false,
      configurable: false,
      get: () => data,
      set: (nd: T) => {
        data.holded = nd;
      },
    },
    flag: {
      enumerable: false,
      configurable: false,
      get: () => flag,
      set: (f: ContextLinkerFlag) => {
        flag = f;
      },
    },
  });
}
function provide<T extends Nocta.KeyedObject, Args extends any = any>(
  template: Nocta.ContextConstructor<T, Args>,
  linker: Nocta.ContextWrapper<T>,
  args?: Args,
  force: boolean = false
) {
  if (
    linker.data.holded &&
    !force &&
    linker.flag === ContextLinkerFlag.Provided
  )
    return;
  linker.data = new template(() => contextUpdater(linker.consumers));
  linker.flag = ContextLinkerFlag.Provided;
  if (
    linker.data.holded?.onProvide &&
    typeof linker.data.holded?.onProvide === "function"
  )
    linker.data.holded.onProvide(args);
}
function consume<T extends Nocta.KeyedObject>(
  linker: Nocta.ContextWrapper<T>,
  link: boolean = true
) {
  if (linker.flag !== ContextLinkerFlag.Provided)
    throw new Error("Context linker has not been provided");
  if (link) {
    const nctx = getCurrentNodeContextOrThrow();
    nctx.capacitors.links.add(linker);
    linker.consumers.set(nctx.id, nctx);
  }
  return linker.data.holded;
}
function clearWrapper<T extends Nocta.KeyedObject>(
  wrapper: Nocta.ContextWrapper<T>
) {
  if (
    wrapper.data.holded?.onDestroy &&
    typeof wrapper.data.holded?.onDestroy === "function"
  )
    wrapper.data.holded.onDestroy();
  for (const c of wrapper.consumers.values()) {
    if (updateNodeQueue.has(c)) updateNodeQueue.delete(c);
    c.capacitors.links.delete(wrapper);
  }
  wrapper.consumers.clear();
  wrapper.flag = ContextLinkerFlag.Destroyed;
  Reflect.set(wrapper.data, "holded", undefined);
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
  contextWrapper,
  consume,
  provide,
  clearWrapper,
  ContextLinker,
};
