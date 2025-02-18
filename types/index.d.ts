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
  type StateWithEffect<T> = [
    get: StateGetter<T>,
    set: StateSetter<T>,
    effect: StateEffectSuscriber<T>
  ];
  interface Holder<T> {
    holded: T;
  }
  interface StateContainer<T = any> extends Holder<T> {
    effect: StateEffect<T> | null;
  }
  interface Context<T> {
    consume(): T;
    define(ctxValue: T): void;
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
  type ExcludeProperties<T> = {
    [K in keyof T as K extends HTMLExcludedProperties ? never : K]: T[K];
  };
  type HTMLProps<T extends HTMLTags = HTMLTags> = Partial<
    ExcludeProperties<ExcludeFunctions<Element<T>>>
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
  type ComponentProps = { [key: string]: any };

  type AnyNode = Parent | Fragment | Tag | Content | Component;
  type AnyNodeExceptParent = Fragment | Tag | Content | Component;
  type NodeChildren = (AnyNode | null)[];
  type ChildrenProps = { children: NodeChildren };
  interface ReactiveCapacitors {
    state: Capacitor<StateContainer<any>>;
    effect: Capacitor<Effect>;
    cleanUp: Capacitor<VoidFunction>;
    memory: Capacitor<Holder<any>>;
  }
  interface DomElement<T extends HTMLElement | Text = HTMLElement> {
    dom: null | T;
  }
  interface VirtualElement<T extends AnyNode> {
    virtual: null | T;
    capacitors: ReactiveCapacitors;
  }
  interface Node {
    type: NodeTypes;
  }
  interface RelativeNode extends IndexNode {
    parent: AnyNode | null;
  }
  interface RehydratableNode extends Node {
    needsRehydrate: boolean;
  }
  interface IndexNode {
    indexOf: number;
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
    props: HTMLProps<T>;
    children: NodeChildren;
  }
  type Forwarder<
    T extends AnyNode | null = AnyNode,
    P extends ComponentProps | any = void
  > = (props: P) => T;
  interface Component<
    T extends AnyNode = AnyNode,
    P extends ComponentProps | any = any
  > extends RehydratableNode,
      RelativeNode,
      VirtualElement<T> {
    type: NodeType.Component;
    component: Forwarder<T, P>;
    props: P;
  }
  interface Fragment extends RehydratableNode, RelativeNode {
    type: NodeType.Fragment;
    children: NodeChildren;
  }
}
