declare namespace Nocta {
  interface Capacitor<T> {
    [Symbol.iterator](): Iterator<T>;
    add(v: T): T;
    get(): T;
    reset(): void;
    set closed(closed: boolean);
    get closed(): boolean;
    get empty(): boolean;
  }
  type StateMemoUpdate<T> = (previous: T) => T;
  type StateSetter<T> = (newValue: T | StateMemoUpdate<T>) => void;
  type StateGetter<T> = () => T;
  type StateEffect<T> = (curr: T) => void;
  type StateEffectSuscriber<T> = (eff: StateEffect<T>) => void;
  type State<T> = [get: StateGetter<T>, set: StateSetter<T>];
  type Effect = () => void | (() => void);
  interface Holder<T> {
    holded: T;
  }
  interface StateContainer<T = any> extends Holder<T> {
    effect: StateEffect<T> | null;
  }
  type HTMLTags = keyof HTMLElementTagNameMap;
  type Element<T extends HTMLTags> = HTMLElementTagNameMap[T];
  type Styles = Partial<CSSStyleDeclaration>;
  type ExcludeFunctions<T> = {
    [K in keyof T as T[K] extends Function ? never : K]: T[K];
  };
  type HTMLExcludedProperties =
    | "tagName"
    | "shadowRoot"
    | "slot"
    | "classList"
    | "style"
    | "attributes"
    | "attributeStyleMap"
    | "ATTRIBUTE_NODE"
    | "CDATA_SECTION_NODE"
    | "COMMENT_NODE"
    | "childElementCount"
    | "childNodes"
    | "children"
    | "isConnected"
    | "ownerDocument"
    | "lastChild"
    | "lastElement"
    | "nextElementSibling"
    | "nextSibling"
    | "previousElementSibling"
    | "previousSibling"
    | "parentElement"
    | "parent"
    | "outerContent"
    | "firstChild"
    | "firstElementChild"
    | "lastChild"
    | "lastElementChild"
    | "innerHTML"
    | "outerHTML"
    | "innerContent"
    | "textContent"
    | `DOCUMENT_${string}`
    | "NOTATION_NODE"
    | "PROCESSING_INSTRUCTION_NODE"
    | "CONTENT_NODE"
    | "ELEMENT_NODE"
    | "TEXT_NODE"
    | `ENTITY_${string}`;
  interface ElementOverridedProperties {
    style?: Styles;
  }
  interface ElementProps<T extends HTMLTags = HTMLTags> {
    ref: Holder<Element<T>>;
  }
  type ExcludeProperties<T> = {
    [K in keyof T as K extends HTMLExcludedProperties ? never : K]: T[K];
  };
  type HTMLProps<T extends HTMLTags = HTMLTags> = Partial<
    ExcludeProperties<ExcludeFunctions<Element<T>>> & ElementProps<T>
  > &
    ElementOverridedProperties;
  namespace NodeType {
    type Parent = -1;
    type Fragment = 0;
    type Tag = 1;
    type Content = 2;
    type Component = 3;
  }
  type NodeTypes =
    | NodeType.Parent
    | NodeType.Fragment
    | NodeType.Tag
    | NodeType.Content
    | NodeType.Component;
  type KeyedObject = Record<string | symbol | number, any>;
  type ComponentProps = KeyedObject;
  type AnyComponent = Component | Component<AnyValidNode, any>;
  type AnyNode = Parent | Fragment | Tag | Content | AnyComponent;
  type AnyValidNode = AnyNode | null;
  type AnyNodeExceptParent = Fragment | Tag | Content | Component;
  type NodeChildren = AnyValidNode[];
  type ChildrenProps = { children: NodeChildren };
  type ContextLinkerFlag = 0 | 1 | 2;

  interface ReactiveCapacitors {
    state: Capacitor<Holder<any>>;
    effect: Capacitor<Effect>;
    cleanUp: Capacitor<VoidFunction>;
    memory: Capacitor<Holder<any>>;
    links: Set<ContextWrapper<any>>;
  }
  interface DomElement<T extends HTMLElement | Text = HTMLElement> {
    dom: null | T;
  }
  interface VirtualElement<T extends AnyNode | null> {
    virtual: null | T;
    capacitors: ReactiveCapacitors;
  }
  interface Node {
    type: NodeTypes;
    treeId: symbol | undefined;
    treeIdx: number;
  }
  interface IndexNode {
    indexOf: number;
  }
  interface RelativeNode extends IndexNode {
    parent: AnyNode | null;
  }
  interface RehydratableNode extends Node {
    needsRehydrate: boolean;
  }
  interface Parent<T extends HTMLTags = HTMLTags>
    extends Node,
      DomElement<Element<T>> {
    type: NodeType.Parent;
    children: NodeChildren;
    dom: Element<T>;
  }
  interface Content extends RehydratableNode, RelativeNode, DomElement<Text> {
    type: NodeType.Content;
    content: string;
  }
  interface Tag<T extends HTMLTags = HTMLTags>
    extends RehydratableNode,
      RelativeNode,
      DomElement<Element<T>> {
    type: NodeType.Tag;
    tag: T;
    props: HTMLProps<T> | void;
    children: NodeChildren;
  }
  interface Fragment extends RehydratableNode, RelativeNode {
    type: NodeType.Fragment;
    children: NodeChildren;
    validIndexOf: number;
  }
  type Template<
    T extends AnyValidNode = AnyValidNode,
    P extends KeyedObject | void = void
  > = P extends void ? () => T : (props: P) => T;
  interface Component<
    T extends AnyValidNode = AnyValidNode,
    P extends KeyedObject | void = void
  > extends RehydratableNode,
      RelativeNode,
      VirtualElement<T> {
    id: symbol;
    type: NodeType.Component;
    template: Template<T, P>;
    props: P | undefined;
  }
  interface ContextWrapper<T extends Nocta.KeyedObject> {
    get consumers(): Map<symbol, Nocta.AnyComponent>;
    get flag(): ContextLinkerFlag;
    set flag(f: ContextLinkerFlag);
    get data(): Holder<Context<T>>;
    set data(nd: Context<T>);
  }
  interface ContextLinker<Args extends any = any> {
    onProvide?: ContextLinkerProvide<Args>;
    onDestroy?: VoidFunction;
  }
  type ContextLinkerUpdater = VoidFunction;
  type ContextLinkerProvide<T = any> = T extends void
    ? VoidFunction
    : (args: T) => void;
  type Context<T extends Nocta.KeyedObject, Args extends any = any> = T &
    ContextLinker<Args>;
  interface ContextConstructor<
    T extends Nocta.KeyedObject,
    Args extends any = any
  > {
    new (upd: ContextLinkerUpdater): Context<T, Args>;
  }
}
