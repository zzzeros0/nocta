# Nocta

Nocta is a small and reactive lightweight typescript library that eases the creation of small to complex user interfaces.

- Nocta is function based.

- Nocta works with "Nodes".

## Table of Contents

- [Installation](#installation)
- [Introduction](#introduction)
  - [Tag](#tag)
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

Tag("div"); // Nocta.Tag<"div">
// When painted: <div></div>

Tag("div", { id: "123" }); // Nocta.Tag<"div">
// When painted: <div id="123"></div>

Tag("button", { id: "123" }, [
  Tag("strong", [Content("I'm")]),
  Content(" the text inside the button!"),
]); // Nocta.Tag<"button">
// When painted: <button id="123"><strong>I'm</strong> the text inside the button!</button>

Tag("button", [Content("This button received no props!")]); // Nocta.Tag<"button">
// When painted: <button>This button received no props!</button>
```

### Content

An HTML text.

```ts
import { Content } from "nocta";

Content("I'm the text node"); // Nocta.Content
```

### Fragment

A container of multiple children.

```ts
import { Fragment } from "nocta";

Fragment(Tag("div"), Tag("button"), Content("HTML Text")); // Nocta.Fragment
// When painted: <><div></div><button></button>HTML Text</>
```

### Templates and Components

`Templates` are functions that return a node (or null).
`Components` make use of `Templates` to provide reactivity.

Defining templates:

```ts
import { Tag, Content } from "nocta";

const myTemplateNode: Nocta.Template<Nocta.Tag<"div">> = () => {
  return Tag("div", [Tag("button", [Content("I'm the text in the button")])]);
};
// myTemplateNode is a node Template: a function that returns a node.
// This function must return a Tag "div"

// Defining Templates custom props:
const myTemplateNode: Nocta.Template<
  Nocta.Tag<"div">,
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

So, a `Template` can be seen as the node that will be returned, and a `Component` is a node that will use the `Template` to generate it's inner `node` and will provide an `execution context` for it's reactivity.

### Parent

A root element that holds children. It serves as the entry point for your UI, as well can be used to create portals.

```ts
import { Parent } from "nocta";

Parent(document.querySelector("#root")!, Tag("h1")); // Nocta.Parent
// if html body is:
// <body><div id="root"></div></body>
// When painted:
// <body><div id="root"><h1></h1></div></body>
```

---

## Usage

Nodes are not intended to be stored in variables as they are dinamically changing. Storing them can produce memory leaks or unexpected behaviour. They are intended to be created at runtime and passed directly.

Mainly, when working with nodes, the main entry points are `Templates` and `Components`.

```ts
const App = () => {
  // Return the nodes you want.
  return Tag("button", [Content("I'm a button")]);
};

renderNodes(document.body!, Component(App)); // Call 'Component' on the 'Template'

// Or

renderNodes(document.body!, App()); // Use the 'Template' itself if it doesn't need an 'execution context'
```

### Creating Components

Components make use of `Templates`. A function that returns a node (or null) is a `Template`. Let's define its type:

```ts
const myTemplateNode: Nocta.Template<
  Nocta.Tag<"button">, // The type that will be returned
  {
    prop1: string;
    prop2: number;
  } // Props definition
>;
```

`Nocta.Template` generic defines a function that returns a node (Tag, Content, Fragment...) or null.
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
  return Tag("button", [Content("Im a button")]);
};
```

The `Template` function is then used to generate a `Component` node using `Component`. `Components` create an execution context for the template to use its reactivity:

```ts
import { Component } from "nocta";

Component(myTemplateNode, {
  prop1: "1",
  prop2: 1,
}); // Nocta.Component<Nocta.Tag<"button">, { prop1: number, prop2: string }>
```

### Rendering Nodes

`renderNodes` is used to paint nodes. This is your app entry point and this must be called once over the node. Once it's painted, it's lifecycle is managed by the node itself.

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
    myOtherTemplateNode()
  );
};

renderNodes(document.body, Component(myTemplateNode));
```

In this example, only `myTemplateNode` is generated as a `Component`: `myOtherTemplateNode`'s states will be linked to this context. This means, that calling an state update inside of `myOtherTemplateNode` will perform an update in the execution context (`myTemplateNode`).

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

##### ¿What is a execution context?

When a `Component` tree is generated, a `execution context` (the `Component`) is created and is accessible to all the subtree nodes unless another `Component` is generated. Once the tree is generated, the context is exited.

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

Important: When a component updates its state, the repaint is managed automatically; calling `renderNodes` manually is not needed and can lead to inconcluences.

### Effect

An `effect` is a callback that gets executed when the node gets painted. This callback can return another one, that will get executed when the element is unpainted.
An element can have multiple effects.

An effect is intended to be used when there is async work to do or actions that have to be fired after render.

```ts
import { Tag, effect } from "nocta";

const myTemplateNode = () => {
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

Note: Effects will be executed in the order they are defined (FIFO).

#### Handeling effects

Effects, unlike states, can be defined conditionally:

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

Also performing state updates will perform an execution of the effects. You have to handle the execution flow and `memory` can help with that.

### Memory

`Memory` allows you to store values during the component's lifecycle. Unlike states, changes in memory will not perform a repaint. It returns a `Holder<T>`:

Memory can be used to control the `node's lifecycle logic`. For example, it can be used to choose wether an effect should run or not:

```ts
import { Tag, memory, effect } from "nocta";

const myButtonEffectWithMemory = () => {
  const loginMemory = memory<{
    loginAttempts: number;
    userRefreshed: boolean;
  }>();

  effect(() => {
    if (loginMemory.holded.loginAttempts > 2) {
      // Do something
      // Don't forget that changing a memory value won't produce a repaint
      // An state update would be neccessary in this case
    }
  });
  effect(() => {
    if (!loginMemory.holded.userRefreshed) {
      loginMemory.holded.userRefreshed = true;
      // Refresh user
      // If an state update runs later
      // Next render effect execution won't
      // get here: userRefreshed is true
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

#### Getting an element's ref

Memory must be used for `ref`. `ref` has been included in `v1.1.2` and it allows you to store a reference to the HTMLElement:

```ts
import { Tag, memory } from "nocta";

const myButtonMemoryRef = () => {
  const buttonRef = memory<HTMLButtonElement>();

  effect(() => {
    if (buttonRef.holded) {
      // buttonRef.holded contains the HTMLButtonElement reference
    }
  });
  return Tag("button", {
    ref: buttonRef,
  });
};
```

### Context

`Context` ease the sharing of data between `Components`.

A context is defined by a class that extends `ContextLinker` and implements the context interface. This class is then used as a `Context template`.

```ts
import { context, ContextLinker } from "nocta";

interface CounterContext {
  counter: number;
  increase(): void;
  decrease(): void;
}

class CounterContextTemplate extends ContextLinker implements CounterContext {
  public counter = 0;
  public increase() {
    this.counter++;
    this.update();
  }
  public decrease() {
    this.counter--;
    this.update();
  }
}
```

This defines the structure of the context.
`update` is provided by the extension from `ContextLinker` and it performs an update of all the consumers consuming this context; this lets you decide when components should update.

To be able to access this context from the components, you must create a `ContextLinker` using `contextWrapper`:

```ts
import { contextWrapper } from "nocta";

const counterContextWrapper = contextWrapper<CounterContext>();
```

This is where the `Context template` will be generated and stored.

Before the components consume this context, it has to be populated with `provide`. This generates the context using the template class and it gets linked to the `ContextWrapper`.

```ts
import { provide } from "nocta";
const App = () => {
  provide(CounterContextTemplate, counterContextWrapper);
  return Component(counterConsumerTemplate);
};
```

Then a component can use `consume`:

```ts
import { consume } from "nocta";
const counterConsumerTemplate = () => {
  const counterContext = consume(counterContextWrapper);
  return Content(`The counter is ${counterContext.counter}`);
};
```

As `states`, context `consumers` need an `execution context`. They have to be wrapped inside of a `Component`. If they're not wrapped, they will be linked to the nearest execution context or `throw an error if there is not one`. There's no need of an `execution context` to `provide` a context.

A context linker can be cleared using `clearWrapper`. This can be called when a `ContextLinker` will no longer be used (if it is used later, you will need to call `provide` again before using it).

`ContextWrapper` can be defined anywhere. You can use them even inside of templates (you must handle the context destruction):

```ts
import {
  provide,
  consume,
  contextWrapper,
  Content,
  Component,
  renderNodes,
} from "nocta";

const counterConsumerTemplate: Nocta.Template<
  Nocta.Tag<"div">,
  { counterLinker: Nocta.ContextLinker<CounterContext> }
> = () => {
  const counterContext = consume(counterContextWrapper);
  return Tag("div", [
    Tag(
      "button",
      {
        onclick() {
          counterContext.increase();
        },
      },
      [Content("Increase")]
    ),
    Tag(
      "button",
      {
        onclick() {
          counterContext.decrease();
        },
      },
      [Content("Decrease")]
    ),
    Content(`The counter is ${counterContext.counter}`),
  ]);
};
const App = () => {
  const counterContextWrapper = contextWrapper<CounterContext>();
  provide(CounterContextTemplate, counterContextWrapper);
  effect(() => {
    return () => {
      clearWrapper(counterContextWrapper); // Destroy the linker when this component unmounts
      // This will delete it's data and will be marked as destroyed
    };
  });
  return Component(counterConsumerTemplate, { counterLinker });
};
renderNodes(document.body!, Component(App));
```

#### onProvide and onDestroy

When providing your `Context` it may need arguments; they can be passed through the `provide` function and they are defined by the `ContextLinker` generic:

```ts
class CounterContextTemplate
  extends ContextLinker<{ initialCounter: number }>
  implements CounterContext
{
  public counter = 0;
  public onProvide: ((args: { initialCounter: number }) => void) | undefined = (
    args
  ) => {
    this.counter = args.initialCounter;
  };
  public increase() {
    this.counter++;
    this.update();
  }
  public decrease() {
    this.counter--;
    this.update();
  }
}

provide(CounterContextTemplate, counterContextWrapper, { initialCounter: 100 });
```

In the same way, when you need to perform some clean-up when the `Context` is destroyed with `clearWrapper`, use `onDestroy`:

```ts
class CounterContextTemplate
  extends ContextLinker<{ initialCounter: number }>
  implements CounterContext
{
  public counter = 0;
  public onDestroy: VoidFunction | undefined = () => {
    // Perform a clean-up
  };
  public increase() {
    this.counter++;
    this.update();
  }
  public decrease() {
    this.counter--;
    this.update();
  }
}
```

#### Provide and Consume

When providing context, you can provide arguments. The fourth last arguments is forcing `provide`. `provide` does not overwrite a context if it's already defined, pass this argument if you want to overwrite.

Sometimes you need to consume a `Context` inside a `Contex Template` or `Component` but avoiding the subscription. You can call `consume` providing a second argument, which defines if the `execution context` has to be linked or not (`true` by default). Passing false will let you access the data from the `Context` and without subscribing. Inside of contexts there is no execution context; if consuming, always pass the second argument `false`.

```ts
class CounterContextTemplate extends ContextLinker implements CounterContext {
  public counter = 0;
  public increase() {
    const anotherContext = consume(anotherLinker, false);
    this.counter++;
    this.update();
  }
  public decrease() {
    this.counter--;
    this.update();
  }
}
```

`Contexts` can be also used outside of components or other contexts, as long as the context has been provided:

```ts
function doWatheverOutsideContext() {
  const myContext = consume(contextLinker, false);
  ...
}
```

---

#### Additional

You can also define custom functions that use state, effect, memo or context to use in your template function (don't forget of wrapping it inside Component() or it's context parent):

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
```
