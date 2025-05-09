# Nocta

**Nocta is a small and reactive** lightweight typescript library that eases the creation of small to complex user interfaces without the complexity of project setup; just a simple **0-deps library**.

- Function based.
- Works with "Nodes".
- Fast & simple.

## Table of Contents

- [Installation](#installation)
- [Introduction](#introduction)
  - [Tag](#tag)
    - [Nocta-Tags](#nocta-tags)
  - [Content](#content)
  - [Fragment](#fragment)
  - [Templates and Components](#templates-and-components)
  - [Parent](#parent)
- [Usage](#usage)
  - [Creating Components](#creating-components)
  - [Rendering Nodes](#rendering-nodes)
  - [Difference between Template and Component](#difference-between-template-and-component)
  - [State](#state)
  - [Effect](#effect)
  - [Memory](#memory)
    - [Getting an element's ref](#getting-an-element's-ref)
  - [Updater](#updater)
  - [Context](#context)

## Installation

Add this package to your npm project:

```
npm install nocta
```

## Introduction

Nocta allows you to develop UI by providing 5 types of `nodes`.

### Tag

An HTML Element.

```ts
import { Tag } from "nocta";

Tag("div");
// <div></div>

Tag("div", { id: "123" });
// <div id="123"></div>

Tag("button", { id: "123" }, ["I'm the text inside the button!"]);
// <button id="123">
//  I'm the text inside the button!
// </button>

Tag("button", ["This button received no props!"]);
// <button>This button received no props!</button>
```

#### Nocta-Tags

Add the package [`nocta-tags`](https://www.npmjs.com/package/nocta-tags) to your project. This packages provide a shorthand for the HTML Tags:

```ts
import { div } from "nocta-tags";

Tag("div", { id: "123" }, ["A Div Tag node"]);

// Shorthand:

div({ id: "123" }, ["A Div Tag node"]);
```

### Fragment

A container of multiple children.

```ts
import { Fragment } from "nocta";

Fragment(Tag("button"), "HTML Text"), Tag("span", ["Other text"]);
// <>
//  <button></button>HTML Text<span>Other text</span>
// </>
```

### Templates and Components

`Templates` are functions that return a node, string (text) or null (nothing).
`Components` make use of `Templates` to provide reactivity.

Defining templates:

```ts
import { Tag } from "nocta";

const myTemplateNode: Nocta.Template<Nocta.Tag<"button">> = () => {
  return Tag("button", ["I'm the text in the button"]);
};
// myTemplateNode is a node Template: a function that returns a node.
// This function is defined as Nocta.Template<Nocta.Tag<"button">> and must return a "button" tag

// Defining Templates custom props:
const myTemplateNode: Nocta.Template<
  Nocta.Tag<"button">,
  { customProp: string }
> = function ({customProp}) {
  ...
};
```

Defining components:

```ts
import { Component } from "nocta";
// Passing this template to a Component will create a Component node.
Component(myTemplateNode); // Nocta.Component

// If the node Template function needs props, pass the arguments to Component:
Component(myComponentFunction, {
  customProp: "string",
}); // Nocta.Component<Nocta.AnyValidNode, { customProp: string }>
```

So, a `Template` can be seen as a function that creates nodes (a template), and a `Component` is a node that will use the `Template` to generate it's inner `node` and will provide an `execution context` for it's reactivity.

### Parent

A root element that holds children. It serves as the entry point for your UI, as well can be used to create portals.

```ts
import { Parent } from "nocta";

Parent(document.querySelector("#root")!, Tag("h1", ["H1 Text"])); // Nocta.Parent
// If html body is:
// <body><div id="root"></div></body>
// Then:
// <body><div id="root"><h1>H1 Text</h1></div></body>
```

---

## Usage

Nodes are not intended to be statically stored in variables as they are dinamically changing. Storing them can produce memory leaks or unexpected behaviour. They are intended to be created at runtime and passed directly.

Mainly, when working with nodes, the main entry points are `Templates` and `Components`.

```ts
const App = () => {
  // Return the nodes you want.
  return Tag("button", ["I'm a button"]);
};

renderNodes(document.body!, App()); // Use the 'Template' itself if it doesn't need an 'execution context'

// Or

renderNodes(document.body!, Component(App)); // Call 'Component' on the 'Template'
```

### Creating Components

Components make use of `Templates`. A function that returns a node, string or null can be a `Template`. Let's define its type:

```ts
const myTemplateNode: Nocta.Template<
  Nocta.Tag<"button">, // The type that will be returned
  {
    prop1: string;
    prop2: number;
  } & Nocta.ChildrenProps // Props definition
>;
```

`Nocta.Template` generic defines a function that returns a node (Tag, Content, Fragment...), string or null.
In the given example, the function must return `Nocta.Tag<"button">`.
This generic also defines the props the component will receive. Let's define the function:

```ts
import { Tag, Content } from "nocta";

const myTemplateNode: Nocta.Template<
  Nocta.Tag<"button">,
  {
    prop1: string;
    prop2: number;
  }
> = ({ prop1, prop2 }) => {
  console.log("Prop 1", prop1, "Prop 2", prop2);
  return Tag("button", ["Im a button"]);
};
```

The `Template` function is then used to generate a `Component` node using `Component`. `Components` create an `execution context` for the template to use its own reactivity:

```ts
import { Component } from "nocta";

Component(myTemplateNode, {
  prop1: "1",
  prop2: 1,
}); // Nocta.Component<Nocta.Tag<"button">, { prop1: number, prop2: string }>
```

### Rendering Nodes

`renderNodes` is used to paint nodes. This is your app entry point and this must be called once. Once it's painted, it's lifecycle is managed itself.

```ts
renderNodes(document.body, Tag("div"));
renderNodes(document.body, Fragment(Tag("div")));
renderNodes(document.body, Content("Text"));
renderNodes(document.body, myTemplateNode());
renderNodes(document.body, Component(myTemplateNode));
renderNodes(document.body, Parent(document.body));
```

If you're going to render more than one node over the same root HTMLElement, pass them in the same call (they will be rendered in the order they are defined):

```ts
renderNodes(document.body, Tag("div"), Tag("button"),...);
```

`renderNodes` alaways returns a `Parent` node.

```ts
const parent: Nocta.Parent = renderNodes(
  document.body,
  Component(myTemplateNode)
);
```

**Important: don't call `renderNodes` to render a node outside of the current tree (for example, a Modal); use `Parent`:**

```ts
const TemplateWithModal = () => {
  return Tag("div", [
    Parent(document.querySelector("#target")!, Tag("div",{ id: "modal" }, [...]));
  ]);
};
```

**Note: `renderNodes` will render the nodes in the next `event loop` (`async`). `Sync` code after calling `renderNodes` will be executed before they are rendered.**

### Difference between Template and Component

There are some important characteristics that differentiate `Templates` and `Components`.

`Templates` are used as reutilizable pieces. They do not have their own `execution context`, so the reactivity generated inside of them will be linked to the nearest component execution context.

`Components`, on the other hand, create an `execution context`, enabling reactivity (state, memory, effects, context consumption...).

So, we can define `Templates` as reusable node templates, and `Components` as the runtime node that uses that template and provides its reactivity.

```ts
import { Fragment, Tag, Content, state } from "nocta";

const myOtherTemplateNode: Nocta.Template<Nocta.Tag<"div">> = () => {
  const [message, setMessage] = state<string>("");
  return Tag("div", [message()]);
};
const myTemplateNode: Nocta.Template<
  Nocta.Fragment,
  {
    prop1: string;
    prop2: number;
  }
> = () => {
  const [counter, setCounter] = state<number>(0);
  return Fragment(Tag("button", ["I'm a button"]), myOtherTemplateNode());
};

renderNodes(document.body, Component(myTemplateNode));
```

In this example, only `myTemplateNode` is generated as a `Component`: `myOtherTemplateNode`'s states will be linked to `myTemplateNode`'s context. This means, that calling an state update inside of `myOtherTemplateNode` will perform an update in the execution context (`myTemplateNode`), and hence, render its children again.

```ts
import { Fragment, Tag, Content, state } from "nocta";

const myOtherTemplateNode: Nocta.Template<Nocta.Tag<"div">> = () => {
  const [message, setMessage] = state<string>("");
  return Tag("div", [Content(message)]);
};
const myTemplateNode: Nocta.Template<
  Nocta.Fragment,
  {
    prop1: string;
    prop2: number;
  }
> = () => {
  const [counter, setCounter] = state<number>(0);
  return Fragment(
    Tag("button", [Content("I'm a button")]),
    Component(myOtherTemplateNode)
  );
};

renderNodes(document.body, Component(myTemplateNode));
```

In this example, we have wrapped `myOtherTemplateNode` inside a `Component`, meaning that calling `setMessage` will only repaint `myOtherTemplateNode`.

This allows you to choose how components should react to changes.

**Important: don't forget that when a `Component` (or `Template`) is updated, all it's children will be updated too.**

##### ¿What is an execution context?

When a `Component` tree is generated, an `execution context` (the `Component`) is created and is accessible to all the subtree nodes unless another `Component` is generated. Once the tree is generated, the context is exited.

Nocta provides the reactivity inside of `Components` by the use of `states, effects, memory and contexts` that are joined to the the `execution context`.

First let's define a node `Template`. Let's make a simple button counter that increases the counter when clicked:

```ts
import { Component, Tag, Content, state } from "nocta";

const myTemplateNode: Nocta.Template<Nocta.Tag<"button">> = () => {
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

renderNodes(document.body, myTemplateNode());
```

If we run this without wrapping `myTemplateNode` inside `Component`, `states or effects` will be linked to the `nearest execution context (if exists)`. In this example, we don't have a `running context`; this will fail with an error: `Execution context is null`.

Don't forget that creating a new `Component` node inside a `Component` will change the `running context` and children will be linked to this last created context, until is exited.

### State

The `state` allows to define values that exist in the component's life cycle and they perform node re-updates.

States are created with the `state` function. This returns and array with `getter` and `setter`, like `React`. A component has no state limits.

**Must not be called inside conditionals.**

```ts
const myTemplateNode = () => {
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
const myTemplateNode = () => {
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

Important: When a component updates its state, the repaint is managed automatically; calling `renderNodes` manually is not needed and can lead to errors.

### Effect

An `effect` is a callback that gets executed when the node gets painted. This callback can return another one, that will get executed when the element is unpainted (clean-up).

An effect is intended to be used when there is async work to do or actions that have to be fired after render.

```ts
import { Tag, effect } from "nocta";

const myTemplateNode = () => {
  effect(() => {
    console.log("I will get executed when painted");

    return () => {
      // Callback return is optional
      // Use it to perform a clean-up
      // Don't perform state updates inside
      console.log("I will get executed when unpainted");
    };
  });

  effect(() => {
    ...
    // Effects can receive optional clean-ups
    if (condition) return () => {}
  });

  return Tag("button", {
    onclick(v) {
      // perform some work...
      setUserData((l) => ({ ...l, token: "90129" }));
    },
  });
};
```

Note: There can be more than one effect, and will be executed in the order they are defined (FIFO), as well as clean-ups.

#### Handeling effects

Effects, unlike states or memory, can be defined conditionally:

```ts
import { Tag, effect } from "nocta";

const myTemplateNode = () => {
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

Performing state updates will perform update, and hence an execution of the effects. You have to handle the execution flow and `memory` can help with that.

### Memory

`Memory` allows you to store values during the component's lifecycle. Unlike states, changes in memory will not perform a repaint. It returns a `Nocta.Holder<T>` and is accesible via `.holds`:

Memory can be used to control the `node's lifecycle logic`. For example, it can be used to choose wether an effect should run or not:

```ts
import { Tag, memory, effect } from "nocta";

const myButtonEffectWithMemory = () => {
  const loginMemory = memory<{
    loginAttempts: number;
    userRefreshed: boolean;
  }>();

  effect(() => {
    if (loginMemory.holds.loginAttempts > 2) {
      // Do something
      // Don't forget that changing a memory value won't produce a repaint;
      // an state update would be neccessary in this case
      // or using `updater()` explained later on
    }
  });
  effect(() => {
    if (!loginMemory.holds.userRefreshed) {
      loginMemory.holds.userRefreshed = true;
      // If an update runs later
      // Next render effect execution won't
      // get here: userRefreshed is true
    }
  });
  // Alternatively, this can be defined conditionally:
  if (!loginMemory.holds.userRefreshed)
    effect(() => {
      loginMemory.holds.userRefreshed = true;
      ...
    });

  return Tag("button", {
    onclick(v) {
      loginMemory.holds.loginAttempts++;
      // This won't procude a repaint
    },
  });
};
```

#### Getting an element's ref

`Memory` must be used to store the element's `ref`. `ref` allows you to store a reference to the HTMLElement:

```ts
import { Tag, memory } from "nocta";

const myButtonMemoryRef = () => {
  const buttonRef = memory<HTMLButtonElement>();

  effect(() => {
    if (buttonRef.holds) {
      // buttonRef.holds contains the HTMLButtonElement reference
    }
  });
  return Tag("button", {
    ref: buttonRef,
  });
};
```

### Updater

Sometimes, you need to update your node when you're not using state (which triggers nodes updates). You can use `updater`:

```ts
import { updater } from "nocta";

let name = "Jhon";

const TemplateWithUpdater = () => {
  const update = updater();
  return Tag(
    "button",
    {
      onclick() {
        name = "Doe";
        update();
        // Calling update() will queue an update for this node.
        // As well as states, effect, memory... this is linked to the nearest context.
      },
    },
    [`Name is: ${name}`]
  );
};
```

When painted:

```html
<!-- Before first click: -->
<button>Jhon</button>
<!-- After first click: -->
<button>Doe</button>
```

### Contexts

`Context` ease the sharing of data between `Components`.

Contexts are classes, defined using the decorator `@Context` and extending `ContextHandler`. As well ass `updater()`, calling `this.update()` will perform an update in the context `consumers`:

```ts
import { Context, ContextHandler } from "nocta";

@Context // IMPORTANT!
class CounterContext extends ContextHandler {
  public counter = 0;
  public increase() {
    this.counter++;
    this.update(); // Performs udpate in consumers
  }
  public decrease() {
    this.counter--;
    this.update(); // Performs udpate in consumers
  }
}
```

#### Providing the context

Context is `provided` by instantiating the class. It will get linked to the `execution context`, meaning that will be avaiable from the `execution context` where is called to all of its children:

```ts
const CounterContextProvider = () => {
  new CounterContext();
  return Tag("div",...);
};

// You can access the instance, but won't be a CONSUMER!
const CounterContextProvider = () => {
  const counterContext = new CounterContext();
  console.log(counterContext.counter);
  return Tag("div",...);
};
```

#### Consumption

Context consumption is done via `consume` and specifying the context classes. The context has to be provided before and the consumer has to be in the same tree:

```ts
import { consume, Tag } from "nocta";

const CounterContextConsumer = () => {
  const [counterContext] = consume(CounterContext);
  return Tag("div",...);
};

// Consume returns an array with the give contexts
const CounterContextConsumer = () => {
  const [counterContext, serviceContext] = consume(
    CounterContext,
    ServiceContext
  );
  return Tag("div",...);
};
```

You can also consume a `context` from a `context` using `this.link(...)`, similar to `consume`:

```ts

@Context // IMPORTANT!
class RouterContext extends ContextHandler {
  public navigate() {
    ...
  }
}

@Context // IMPORTANT!
class CounterContext extends ContextHandler {
  public counter = 0;
  public increase() {
    const [routerContext] = this.link(RouterContext);
    // If more than one is needed:
    const [routerContext,serviceContext] = this.link(RouterContext,ServiceContext);
    this.counter++;
    this.update(); // Performs udpate in consumers
  }
  public decrease() {
    this.counter--;
    this.update(); // Performs udpate in consumers
  }
}
```

Additionally, you can also `consume` contexts from a template (component) without registering as a consumer using `link()`. Call it the same way as `consume`:

```ts
import { link } from "nocta";

// This template (component) won't be updated when those contexts change
// Usefull when you don't want to suscribe but need access to the context
const CounterContextConsumer = () => {
  const [counterContext, serviceContext] = link(
    CounterContext,
    ServiceContext
  );
  return Tag("div",...);
};
```

**Important:**
Contexts are class instances. When using it, avoid destructure.

---

#### Additional

You can also define custom functions that use state, effect, memo or context to use in your template function (don't forget of wrapping with `Component()` when using reactive templates):

```ts
// hook.ts
import { state, effect } from "nocta";

export function getUser() {
  const [user, setUser] = state<YourUserInterface | null>(null);
  const [userError, setUserError] = state<YourUserInterface | null>(null);
  effect(() => {
    requestUser().then(setUser).catch(setUserError);
  });
  return { user, error };
}

// component.ts
import { getUser } from "./hooks.ts";

export const UserTemplate: Nocta.Template<Tag<"div">> = () => {
  const { user, userError } = getUser();

  return Tag("div", [
    user()
      ? Tag("p", [Content(`Welcome ${user()!.name}`)])
      : userError()
      ? Tag("p", [Content(`User error: ${userError()!.description}`)])
      : Tag("p", [Content("No user found")]),
  ]);
};
// app.ts
import { UserTemplate } from "./components";
renderNodes(document.body!, Component(UserTemplate));
```
