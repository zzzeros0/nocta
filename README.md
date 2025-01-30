# Nocta

Nocta is a small and lightweight typescript library that eases the creation of small to complex user interfaces.

- Nocta is function based.

- Nocta works with "Nodes". Each node can represent an HTML Element (Tag) or a bunch of them (Fragments); a reactive Element (Component), text Elements (Content) or a root Element (Parent).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Tag](#tag)
  - [Content](#content)
  - [Fragment](#fragment)
  - [Component](#component)
  - [Parent](#parent)
  - [Creating Components](#creating-components)
  - [Rendering Components](#rendering-components)
  - [Difference between Forwarder and Component](#difference-between-forwarder-and-component)
  - [State](#state)
  - [Effect](#effect)

## Installation

Add this package to your npm project:

```
npm install nocta
```

## Usage

Nocta allows you to develop UI by providing 5 types of `nodes`:

### Tag

An HTML Element.

```ts
import { Tag } from "nocta";

const myDiv: Nocta.Tag<"div"> = Tag("div");
// When painted: <div></div>

const myDivWithId: Nocta.Tag<"div"> = Tag("div", { id: "123" });
// When painted: <div id="123"></div>

const myButtonWithIdAndChild: Nocta.Tag<"button"> = Tag(
  "button",
  { id: "123" },
  [Tag("strong", [Content("I'm")]), Content(" the text inside the button!")]
);
// When painted: <button id="123"><strong>I'm</strong> the text inside the button!</button>

const myButtonWithChild: Nocta.Tag<"button"> = Tag("button", [
  Content("This button received no props!"),
]);
// When painted: <button>"This button received no props!</button>
```

### Content

An HTML text.

```ts
import { Content } from "nocta";

const htmlText: Nocta.Content = Content("I'm the text node");
```

### Fragment

A container of multiple children.

```ts
import { Fragment } from "nocta";

const myFragment: Nocta.Fragment = Fragment(
  Tag("div"),
  Tag("button"),
  Content("HTML Text")
);
// When painted: <><div></div><button></button>HTML Text</>
```

### Component

A reactive node. This kind of node has 2 main characteristics:

- It can be used as a node `Forwarder`.
- It can be used as a `Component`.

```ts
import { Component, Tag, Content } from "nocta";

const myForwarderNode: Nocta.Forwarder<Nocta.Tag<"div">> = function () {
  return Tag("div", [Tag("button", [Content("I'm the text in the button")])]);
};
// myForwarderNode is a node Forwarder: a function that returns a node.
// This function must return a Tag "div"

// Defining custom props:
const myForwarderNode: Nocta.Forwarder<
  Nocta.Tag<"div">,
  { customProp: string }
> = function ({customProp}) {
  ...
};

// Defining a Component node
const myComponent = Component(myForwarderNode);

// If the node Forwarder function needs props, pass the arguments to Component:
const myComponentWithProps = Component(myComponentFunction, {
  customProp: "string",
});

// Both approaches will produce the same paint. The difference is in the reactivity.
// Learn more in Difference between Forwarder and Component
```

### Parent

A root element that holds children. It serves as the entry point for your UI, as well can be used to create portals.

```ts
import { Parent } from "nocta";

const parent = Parent(document.querySelector("#root"), Tag("h1"));
// if html body is:
// <body><div id="root"></div></body>
// When painted:
// <body><div id="root"><h1></h1></div></body>
```

---

### Creating Components

Components make use of functional nodes. A function that returns a node (or null) is a `Forwarder`. Let's define its type:

```ts
const myForwarderNode: Nocta.Forwarder<
  Nocta.Tag<"button">,
  {
    prop1: string;
    prop2: number;
  }
>;
```

`Nocta.Forwarder` generic defines a function that returns a node (Tag, Content, Fragment...) or null.
In the given example, the function must return `Nocta.Tag<"button">`.
This generic also defines the props the component will receive. Let's define the function:

```ts
import { Tag, Content } from "nocta";

const myForwarderNode: Nocta.Forwarder<
  Nocta.Tag<"button">,
  {
    prop1: string;
    prop2: number;
  }
> = function ({ prop1, prop2 }) {
  console.log("Prop 1", prop1, "Prop 2", prop2);
  return Tag("button", [Content("Im a text")]);
};
```

The `Forwarder` function is then used to generate a `Component` node using `Component`:

```ts
import { Component } from "nocta";

const myComponentNode = Component(myForwarderNode, {
  prop1: "1",
  prop2: 1,
});
```

### Rendering Components

`renderNodes` is used to paint any node. This is your app entry point and this must be called once over the node. Once it's painted, it's lifecycle is managed by the node itself.

```ts
renderNodes(document.body, Tag("div"));
renderNodes(document.body, Fragment(Tag("div")));
renderNodes(document.body, Content("Text"));
renderNodes(document.body, myForwarderNode());
renderNodes(document.body, Component(myForwarderNode));
renderNodes(document.body, Parent(document.body));
```

If you're going to render more than one node over the same root HTMLElement, use them in the same call (they will be rendered in the order they are defined):

```ts
renderNodes(document.body, Tag("div"), Tag("button"),...);
```

`renderNodes` alaways returns a `Parent` node.

```ts
const parent: Nocta.Parent = renderNodes(
  document.body,
  Component(myForwarderNode)
);
```

### Difference between Forwarder and Component

There are some important characteristics that differentiate `Forwarders` and `Components`.

`Forwarders` can be used as reutilizable pieces. They do not have their own `execution context`, so the reactivity generated inside of them will be linked to the nearest component execution context.

`Components`, on the other hand, creates an `execution context`, enabling state and reactivity.

So, we can define `Forwarders` as templates, and `Components` as the node that uses that template and generates its reactivity .

```ts
import { Fragment, Tag, Content, state } from "nocta";

const myOtherForwarderNode: Nocta.Forwarder<Nocta.Tag<"div">> = function () {
  const [message, setMessage] = state<string>("");
  return Tag("div", [Content(message)]);
};
const myForwarderNode: Nocta.Forwarder<
  Nocta.Fragment,
  {
    prop1: string;
    prop2: number;
  }
> = function () {
  const [counter, setCounter] = state<number>(0);
  return Fragment(
    Tag("button", [Content("I'm a button")]),
    myOtherForwarderNode()
  );
};

renderNodes(document.body, Component(myForwarderNode));
```

In this example, only `myForwarderNode` is generated as a `Component`: `myOtherForwarderNode`'s states will be linked to this context. This means, that calling an state update inside of `myOtherForwarderNode` will perform an update in the execution context (`myForwarderNode`).

```ts
import { Fragment, Tag, Content, state } from "nocta";

const myOtherForwarderNode: Nocta.Forwarder<Nocta.Tag<"div">> = function () {
  const [message, setMessage] = state<string>("");
  return Tag("div", [Content(message)]);
};
const myForwarderNode: Nocta.Forwarder<
  Nocta.Fragment,
  {
    prop1: string;
    prop2: number;
  }
> = function () {
  const [counter, setCounter] = state<number>(0);
  return Fragment(
    Tag("button", [Content("I'm a button")]),
    Component(myOtherForwarderNode)
  );
};

renderNodes(document.body, Component(myForwarderNode));
```

In this example, we have wrapped `myOtherForwarderNode` inside a `Component`, meaning that performing calling `setMessage` will only repaint `myOtherForwarderNode`.

This allows to choose whether it is reactive on its own or not.

##### ¿What is a execution context?

When a `Component` tree is generated, a `execution context` (the `Component`) is created and is accessible to all the subtree nodes unless another `Component` is generated. Once the tree is generated, the context is exited.

Nocta provides the reactivity inside of `Components` by the use of `states, effects, memory and contexts (shared states)` that are joined to the the `execution context`.

First let's define a node `Forwarder`. Let's make a simple button counter that increases the counter when clicked:

```ts
import { Component, Tag, Content, state } from "nocta";

const myForwarderNode: Nocta.Forwarder<Nocta.Tag<"button">> = function () {
  const [buttonCounter, setButtonCounter] = state<number>(0);

  return Tag(
    "button",
    {
      // Event listeners are defined in lower case.
      onclick(v) {
        // State setters can accept a callback
        // that will contain the actual value
        // Actually this is the same than:
        // setButtonCounter(buttonCounter() + 1)
        setButtonCounter((count) => count + 1);
      },
    },
    [Content(`The counter is: ${buttonCounter()}`)]
  );
};

renderNodes(document.body, myForwarderNode());
```

If we run this without wrapping `myForwarderNode` inside `Component`, `states or effects` will be linked to the `nearest execution context (if exists)`. In this example, we don't have a `running context`; this will fail with an error: `Execution context is null`.

Don't forget that creating a new `Component` node inside a `Component` will change the `running context` and children will be linked to this last created context, until is exited.

### State

The `state` allows to define values that exist in the component's life cycle and they perform node re-updates.

States are created with the `state` function. This returns and array with `getter` and `setter`, like `React`. A component has no state limits.

```ts
const myForwarderNode = function () {
  const [userNeedsLogin, setUserNeedsLogin] = state<boolean>(false);
  const [user, setUser] = state<string>();
  ...
  return Tag("button", {
    onclick(v) {
      // Calling a set state will perform a repaint
      setUser("newuser");
    },
  });
};
```

#### State lifecycle

Inside a component, accessing to the state after performing a state update will reflect the new value:

```ts
const myForwarderNode = function () {
  const [now, setNow] = state<Date>(new Date(0));

  return Tag("button", {
    onclick(v) {
      console.log(now()); // Prints: 1970 date
      setNow(new Date());
      console.log(now()); // Prints: today's date
    },
  });
};
```

Important: When a component updates its state, the repaint is managed automatically; calling `renderNodes` manually is not needed and can lead to inconcluences.

### Effect

An `effect` is a callback that gets executed when the node gets painted. This callback can return another one, that will get executed when the element is unpainted.
An element can have multiple effects.

An effect is intended to be used when there is async work to do or state updates that need to be fired after painted.

```ts
import { Tag, effect } from "nocta";

const myForwarderNode = function () {
  effect(() => {
    console.log("I will get executed when painted");

    return () => {
      // Callback return is optional
      // Use it to perform a clean up
      // Don't perform state updates inside
      console.log("I will get executed when unpainted");
    };
  });

  effect(() => {
    ...
  });

  return Tag("button", {
    onclick(v) {
      // perform some work...
      setUserData((l) => ({ ...l, token: "90129" }));
    },
  });
};
```

States trigger a re-update of the `Component`, causing the `Forwarder` to execute again. Then, after a state update, the cleanup functions of previous effects are executed and the nodes get painted again. When repaint, the effects run again.

Note: Effects will be executed in the order they are defined (FIFO).

#### Handeling effects

Effects, unlike states, can be defined conditionally:

```ts
import { Tag, effect } from "nocta";

const myForwarderNode = function () {
  const [counter, setCounter] = state<number>(0);
  // Only run the effect if number is even
  if (counter() % 2 === 0)
    effect(() => {
      ...
    });
  // Alternatively
  effect(() => {
    if (counter() % 2 === 0)
      ...
  });
  return ...
};
```

### Memory

`Memory` allows you to store values during the component's lifecycle. Unlike states, changes in memory will not perform a repaint.

```ts
import { Tag, memory } from "nocta";

const myComponentFunction = function () {
  const loginMemory = memory<{
    loginAttempts: number;
  }>();

  return Tag("button", {
    onclick(v) {
      loginMemory.holded.loginAttempts++;
      // This won't procude a repaint
    },
  });
};
```

Memory can be used to control the node's lifecycle logic. For example, it can be used to choose wether an effect should be run or not:

```ts
import { Tag, memory, effect } from "nocta";

const myComponentFunction = function () {
  const loginMemory = memory<{
    loginAttempts: number;
    userRefreshed: boolean;
  }>();

  effect(() => {
    if (loginMemory.holded.loginAttempts > 2) {
      // Do something
    }
  });
  effect(() => {
    if (!loginMemory.holded.userRefreshed) {
      loginMemory.holded.userRefreshed = true;
      // Refresh user
      // If an state update runs later
      // Next render effect execution won't
      // get here, because userRefreshed is true
    }
  });
  return Tag("button", {
    onclick(v) {
      loginMemory.holded.loginAttempts++;
      // This won't procude a repaint
    },
  });
};
```

### Context

`Context` ease the sharing of states between `Forwarders`.

Creating a context:

```ts
import { createContext } from "nocta";

const userContext = createContext<{
  username: string;
  password: string;
  setUser: (name: string, pwd: string) => void;
}>();
```

And `define` the context in the provider `Forwarder`:

```ts
const myContextForwarder = function () {
  const [userName, setUserName] = state<string>();
  const [password, setPassword] = state<string>();

  // Values inside a context that come from states
  // can be passed as the value itself since
  // next repaint will over-write the context
  // with the new state
  userContext.define({
    user: userName(),
    password: password(),
    setUser (user,pwd) {
        setUserName(user)
        setPassword(pwd)
    }
  });

  return ...;
};
```

The context will be defined when the tree is generated. It's not necessary for the `Forwarder` to be a child of it to have access, but if consumer is not a child of the provider, it won't react to the states updates since it's outside the tree.

### Disclaimer

This project appears as a personal learning work and is not intended to be commercially used.
