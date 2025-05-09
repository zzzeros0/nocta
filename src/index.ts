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
function _is_primitive(t: any) {
  const ty = typeof t;
  return ty === "string" || ty === "number" || ty === "boolean";
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
    throw new Error("Parent nodes must have at least one children");
  return node({
    type: NODE_TYPE_PARENT,
    dom: root,
    children,
    treeId: Symbol(),
    treeIdx: 0,
    deleted: false,
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
    deleted: false,
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
        deleted: false,
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
      deleted: false,
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
    deleted: false,
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
    deleted: false,
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
      // links: new Set(),
      consumes: new Set(),
      provides: new Set(),
    },
    parent: null,
    virtual: null,
    needsRehydrate: false,
    indexOf: 0,
    treeId: undefined,
    treeIdx: 0,
    deleted: false,
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
  if (typeof comp === "string") {
    return Content(comp);
  }
  if (comp) {
    if (!isNode(comp)) {
      exitCurrentNodeContext();
      throw new Error("Not a valid node");
    }
    relateChild(node, comp);
  }
  if (typeof comp === "string") {
    return Content(comp);
  }
  exitCurrentNodeContext();
  return comp;
}
function hasChild(
  node: Nocta.AnyNode
): node is Nocta.Fragment | Nocta.Tag | Nocta.Parent {
  return Reflect.get(node, "children");
}
function relateChild(node: Nocta.AnyNode, child: Nocta.AnyNode) {
  child.treeId = node.treeId;
  child.treeIdx = node.treeIdx + 1;
  if (isParentNode(child)) return;
  child.parent = node;
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
        if (
          (!isParentNode(node.virtual) && isContentNode(virtual)) ||
          isFragmentNode(virtual)
        ) {
          if (!isParentNode(node.virtual)) {
            virtual.indexOf = node.virtual.indexOf;
            if (isFragmentNode(node.virtual)) {
              node.virtual.validIndexOf = getFValidIdxOf(node.virtual);
            }
          }
        }
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
        if (k === "ref" && node.props.ref) {
          (node.props.ref as any).holds = undefined;
        }
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
  for (const c of node.capacitors.consumes as unknown as Set<{
    consumers: Set<Nocta.Component>;
  }>) {
    if (c.consumers) {
      c.consumers.delete(node);
    }
  }
  node.capacitors.consumes.clear();
  if (node.treeId)
    for (const p of node.capacitors.provides as unknown as Set<{
      providers: Map<symbol, object>;
    }>) {
      {
        const ctx = p.providers.get(node.treeId) as ContextHandler | undefined;
        if (ctx && ctx.destroy && typeof ctx.destroy === "function") {
          try {
            ctx.destroy();
          } catch (error) {
            console.error(error);
          }
        }
      }
      p.providers.delete(node.treeId);
    }
}
function clearNode(node: Nocta.AnyNode) {
  node.deleted = true;
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
function clearChild(node: Nocta.NodeWithChildren) {
  if (node.children.length)
    for (const c of node.children) {
      if (typeof c === "string") {
        console.warn("Expected to find a content node. Found string.");
        continue;
      }
      if (c) clearNode(c);
    }
}
function diffChild<
  T extends Nocta.NodeWithChildren,
  P extends Nocta.NodeWithChildren
>(node: T, target: P) {
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
      if (typeof child === "string") {
        node.children[i] = null;
        console.warn("Found string where supposed to find a Content node");
        continue;
      }
      if (dchild) {
        if (typeof dchild === "string") {
          if (isContentNode(child)) {
            child.content = dchild;
          } else {
            clearNode(child);
            const c = Content(dchild);
            node.children[i] = c;
            relateChild(node, c);
          }
          continue;
        }
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
      if (typeof dchild === "string") {
        const c = Content(dchild);
        node.children[i] = c;
        relateChild(node, c);
        continue;
      }
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
      if (k === "ref" && node.props.ref) {
        if (node.dom) node.props.ref.holds = node.dom;
      } else if (k === "style" && node.props.style) {
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
function diff<T extends Nocta.AnyNode, P extends Nocta.AnyNode>(
  node: T,
  target: P
) {
  if (!target) return;
  if (isParentNode(node) || (isFragmentNode(node) && hasChild(target))) {
    diffChild(node, target as Nocta.NodeWithChildren);
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
  for (let i = 0; i < node.children.length; i++) {
    let c = node.children[i];
    if (c) {
      if (typeof c === "string") {
        c = Content(c);
        node.children[i] = c;
      } else if (!isParentNode(c)) {
        if (lastNode) {
          if (!isParentNode(lastNode)) {
            if (isFragmentNode(lastNode)) {
              idxof = lastNode.validIndexOf;
              c.indexOf = idxof;
            } else if (isComponentNode(lastNode)) {
              if (lastNode.virtual && !isParentNode(lastNode.virtual)) {
                idxof = isFragmentNode(lastNode.virtual)
                  ? lastNode.virtual.validIndexOf
                  : lastNode.virtual.indexOf + 1;
              } else {
                idxof = lastNode.indexOf + 1;
              }
              c.indexOf = idxof;
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
      if (node.dom.nodeValue !== node.content)
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
  if (node.deleted) return;
  node.needsRehydrate = true;
  if (updateNodeQueue.has(node)) return;
  // for (const n of updateNodeQueue.values()) {
  //   if (n.treeId === node.treeId && n.treeIdx <= node.treeIdx) {
  //     return;
  //   }
  // }
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
    if (node.deleted) {
      node.needsRehydrate = false;
      return;
    }
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
  if (typeof val === "function") {
    const rt = (val as Nocta.StateMemoUpdate<T>)(state.holds);
    if (_is_primitive(rt) && rt === state.holds) return;
    else state.holds = rt;
  } else if (_is_primitive(val) && val === state.holds) return;
  else state.holds = val;
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
        holds: initialValue,
      });
  const get: Nocta.StateGetter<T> = () => {
    return curr_state.holds;
  };
  const set: Nocta.StateSetter<T> = (val) =>
    performStateUpdate(ctx, curr_state, val);
  return [get, set];
}
function effect(f: Nocta.Effect) {
  const ctx = getCurrentNodeContextOrThrow();
  ctx.capacitors.effect.add(f);
}
function memory<T extends any>(initialValue?: T): Nocta.Holder<T> {
  const ctx = getCurrentNodeContextOrThrow();
  return ctx.capacitors.memory.closed
    ? ctx.capacitors.memory.get()
    : ctx.capacitors.memory.add({ holds: initialValue });
}
function updater() {
  const ctx = getCurrentNodeContextOrThrow();
  return () => {
    queueNodeUpdate(ctx);
  };
}
abstract class ContextHandler {
  protected declare readonly update: VoidFunction;
  protected declare readonly symbol: symbol;
  protected declare readonly link: <
    T extends readonly (abstract new (...args: any) => any)[]
  >(
    ...contexts: T
  ) => Nocta.InstanceTypeArray<T>;
  public declare readonly destroy?: VoidFunction;
}
function Context<P extends object>(
  constructor: Nocta.Constructable<P>
): Nocta.ContextPrototype<P> {
  return class __c__ extends (constructor as any) {
    private static readonly providers: Map<symbol, P> = new Map();
    public readonly consumers: Set<Nocta.Component> = new Set();
    private readonly tree_id: symbol | undefined = undefined;
    constructor(...args: any) {
      super(...args);
      const ctx = getCurrentNodeContextOrThrow();
      if (!ctx.treeId) throw new Error("Tree id is undefined");
      this.tree_id = ctx.treeId;
      __c__.providers.set(this.tree_id, this as unknown as P);
      ctx.capacitors.provides.add(__c__ as Nocta.ContextPrototype);
    }
    link<T extends readonly (abstract new (...args: any) => any)[]>(
      ...contexts: T
    ): Nocta.InstanceTypeArray<T> {
      if (!this.tree_id) throw new Error("Not in tree");

      return contexts.map((c) => {
        if (
          !Reflect.has(c, "providers") ||
          !((c as any).providers instanceof Map)
        )
          throw new Error("Bad context provided");
        // if (!this.tree_id) throw new Error("Not in tree");
        const ctx = c as any as { providers: Map<symbol, P> };
        // @ts-ignore
        if (!ctx.providers.has(this.tree_id))
          throw new Error("Context not found");
        // @ts-ignore
        return ctx.providers.get(this.tree_id)!;
      }) as Nocta.InstanceTypeArray<T>;
    }
    protected update() {
      for (const c of this.consumers) {
        queueNodeUpdate(c);
      }
    }
  } as unknown as Nocta.ContextPrototype<P>;
}

function consume<T extends readonly (abstract new (...args: any) => any)[]>(
  ...contexts: T
): Nocta.InstanceTypeArray<T> {
  const ctx = getCurrentNodeContextOrThrow();
  return contexts.map((c) => {
    if (!Reflect.has(c, "providers") || !((c as any).providers instanceof Map))
      throw new Error("Bad context provided");
    const stctx = c as any as {
      providers: Map<symbol, object>;
    };
    if (!ctx.treeId) throw new Error("Tree not found");
    if (!stctx.providers.has(ctx.treeId))
      throw new Error("Not found in the tree");
    const tc = stctx.providers.get(ctx.treeId) as {
      consumers: Set<Nocta.Component>;
    };
    if (!tc || !tc.consumers || !(tc.consumers instanceof Set))
      throw new Error("Wrong consumers");

    if (!tc.consumers.has(ctx)) {
      tc.consumers.add(ctx);
    }
    if (!ctx.capacitors.consumes.has(c as Nocta.ContextPrototype)) {
      ctx.capacitors.consumes.add(c as Nocta.ContextPrototype);
    }
    // return new Proxy(tc, {
    //   get(target, prop, receiver) {
    //     if (prop === "consumers") throw new Error("Invalid access");
    //     return Reflect.get(target, prop, receiver);
    //   },
    //   set(target, prop, value, receiver) {
    //     if (prop === "consumers") throw new Error("Invalid access");
    //     return Reflect.set(target, prop, value, receiver);
    //   },
    // });
    return tc;
  }) as Nocta.InstanceTypeArray<T>;
}
function link<T extends readonly (abstract new (...args: any) => any)[]>(
  ...contexts: T
): Nocta.InstanceTypeArray<T> {
  const ctx = getCurrentNodeContextOrThrow();
  return contexts.map((c) => {
    if (!Reflect.has(c, "providers") || !((c as any).providers instanceof Map))
      throw new Error("Bad context provided");
    const stctx = c as any as {
      providers: Map<symbol, object>;
    };
    if (!ctx.treeId) throw new Error("Tree not found");
    if (!stctx.providers.has(ctx.treeId))
      throw new Error("Not found in the tree");
    const tc = stctx.providers.get(ctx.treeId) as {
      consumers: Set<Nocta.Component>;
    };
    if (!tc) throw new Error("Wrong context");
    // return new Proxy(tc, {
    //   get(target, prop, receiver) {
    //     if (prop === "consumers") throw new Error("Invalid access");
    //     return Reflect.get(target, prop, receiver);
    //   },
    //   set(target, prop, value, receiver) {
    //     if (prop === "consumers") throw new Error("Invalid access");
    //     return Reflect.set(target, prop, value, receiver);
    //   },
    // });
    return tc;
  }) as Nocta.InstanceTypeArray<T>;
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
  updater,
  Context,
  ContextHandler,
  consume,
  link,
};
