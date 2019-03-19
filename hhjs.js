// Internal functions of the framework
let cachedElement = null;

let lastDom = null;
let newDom = null;

let componentStore = {};
let componentIdIterator = 0;

function processInnerComponents(element, ...innerComponents) {
  innerComponents.forEach((component) => {
    if (Array.isArray(component)) {
        processInnerComponents(element, ...component);
    } else if (typeof component === "string") {
      element.innerHTML = component;
    } else if (component["entryPoint"]) {
      component.parent = element;
      RenderComponent(component);
    } else {
      element.appendChild(component);
    }
  });
}

function isValidElement(component) {
  return component instanceof Element
      || component instanceof HTMLDocument
      || typeof component === "string"
      || Array.isArray(component)
      || component["entryPoint"];
}

function render(elementType, ...innerComponents) {
  let thisElement = document.createElement(elementType);
  let elementKey = null;
  
  innerComponents.filter((component) => {
      if (component["key"]) {
        elementKey = component["key"];
        return false;
      }
      return !isValidElement(component);
    }).forEach((component) => {
      if (component["events"]) {
        let events = component["events"];
        for (let key in component["events"]) {
          
          thisElement.addEventListener(key, (event) => {
            if (elementKey) {
              cachedElement = {
                element: event.target,
                key: elementKey
              };
            } else {
              cachedElement = null;
            }
            events[key](event);
          });
        }
      } else if (component["elementStyle"]) {
        let styleString = "";
        let styleObject = component["elementStyle"];
        for (let style in styleObject) {
          styleString += `${style}: ${styleObject[style]};`
        }
        thisElement.setAttribute("style", styleString);
      } else {
        for (let key in component) {
          thisElement.setAttribute(key, component[key]);
        }
      }
    });
  
  if (cachedElement && elementKey === cachedElement.key) {
      thisElement = cachedElement.element;
  }
  
  let components = innerComponents.filter((component) => {
    return isValidElement(component);
  });
  
  processInnerComponents(thisElement, ...components);
  
  return thisElement;
}

function InitAppData(application, data) {
  let reactiveData = {};
  for (var key in data) {
   let cachedKey = key;
   Object.defineProperty(reactiveData, key, {
     get: function() {
      return data[cachedKey];
     },
     set: function(newValue) {
       data[cachedKey] = newValue;
       application.state = data;
     },
     enumerable: true
   });
  }
  return reactiveData;
}

function InitComponent(entryPoint, initialState) {
  return (parentData) => {
    let component = {
      entryPoint: entryPoint,
      immutableState: initialState,
      parent: null,
      properties: parentData.properties,
      listeners: parentData.listeners
    };

    // Initialize the state
    component.immutableState = InitAppData(component, initialState);

    Object.defineProperty(component, "state", {
      get: function() {
        return component.immutableState;
      },
      set: function(newValue) {
        component.immutableState = InitAppData(component, newValue);
        RenderComponent(component);
      }
    });

    return component;
  }
}

function RenderComponent(component) {
  console.log("Rendering component");
  
  component.newDom = component.entryPoint(component);
  
  if (component.lastDom) {
    component.parent.replaceChild(component.newDom, component.lastDom);
  } else {
    component.parent.appendChild(component.newDom);
  }
  
  // Return focus to the element that triggered the re-render
  if (component.cachedElement)
    component.cachedElement.element.focus();
  
  component.lastDom = component.newDom;
}

function InitApplication(entryPoint, initialState) {
  let application = {
    entryPoint: entryPoint,
    immutableState: initialState
  };

  Object.defineProperty(application, "state", {
    get: function() {
      return application.immutableState;
    },
    set: function(newValue) {
      application.immutableState = InitAppData(application, newValue);
      RenderApplication(application);
    }
  });

  application.state = initialState;
  
  return application;
}

function RenderApplication(component) {
  newDom = component.entryPoint(component);
  
  if (lastDom) {
    document.querySelector("#app").replaceChild(newDom, lastDom);
  } else {
    document.querySelector("#app").appendChild(newDom);
  }
  
  // Return focus to the element that triggered the re-render
  if (cachedElement)
    cachedElement.element.focus();
  
  lastDom = newDom;
}

/*
* Below this line is the actual usage of the framework
*/

// Component declarations
function Component(type, ...comp) {
  return render(type, ...comp);
}

function Container(...comp) {
  return render("div", {
    elementStyle: {
      "display": "flex",
      "flex-direction": "row",
      "font-family": "Arial, Helvetica, sans-serif",
      "max-width": "100%"
    }
  }, ...comp);
}

function HorizontalContainer(...comp) {
  return render("div", {
    elementStyle: {
      "display": "flex",
      "flex-direction": "column",
      "font-family": "Arial, Helvetica, sans-serif",
      "max-width": "100%"
    }
  }, ...comp);
}

function Button(...comp) {
  return render("button", {
    elementStyle: {
      "border": "1px solid #ccc",
      "border-radius": "4px",
      "margin": "4px",
      "padding": "6px",
      "drop-shadow": "4px black",
      "font-size": "14px"
    }
  }, ...comp);
}

function Header1(...comp) {
  return render("h1", ...comp);
}

function Image(...comp) {
  return render("img", ...comp);
}

function Span(...comp) {
  return render("span", ...comp);
}

function P(...comp) {
  return render("p", ...comp);
}

function Input(...comp) {
  return render("input", {
    elementStyle: {
      "border-radius": "4px",
      "border": "1px solid #ccc",
      "padding": "4px 2px"
    }
  }, ...comp);
}

let ReusableButton = InitComponent(
  function(data) {
    function changeText() {
      data.state = {
        ...data.state,
        counter: data.state.counter + 1,
        buttonText: `Button clicked ${data.state.counter + 1} times`
      };
    }
    
    return Container(
      Button(
        {events: {click: data.listeners.addPicture}},
        "Add pizza slice"
      ),
      Button(
        {events: {click: changeText}},
        data.state.buttonText
      )
    )
  },
  {
    buttonText: "Button clicked 0 times",
    counter: 0
  }
);

// Define the application. Functions are defined inside the scope so they have
// access to the appData.
const PizzaApp = (appData) => {
  function compareSize(a, b) {
    return a.size > b.size ? 1 : -1
  }

  function compareName(a, b) {
    return a.name.localeCompare(b.name);
  }

  function compare(a, b) {
    if (appData.state.sortBy === "size") {
      return appData.state.sortDir === "asc"
        ? compareSize(a,b)
        : compareSize(b,a);
    } else {
      return appData.state.sortDir === "asc"
        ? compareName(a,b)
        : compareName(b,a);
    }
  }

  function setSortParams(sortBy, sortDir) {
    appData.state = {
      ...appData.state,
      sortBy: sortBy,
      sortDir: sortDir
    };
  }
  
  function addPicture() {
    appData.state = {
      ...appData.state,
      inputName: "",
      inputUrl: "",
      inputSize: "",
      images: appData.state.images.concat([{
        name: appData.state.inputName,
        url: appData.state.inputUrl,
        size: appData.state.inputSize
      }])
    };
  }
  
  function SortButton(sortBy, sortDir, ...comp) {
    return Button(
      {events: {click: () => setSortParams(sortBy, sortDir)}},
      {class: appData.state.sortBy === sortBy && appData.state.sortDir === sortDir ? "active" : ""}, ...comp
    );
  }
  
  function ImageList() {
    return appData.state.images.sort(compare).map((image) => {
      return [
        Image(
          {
            elementStyle: {
              width: "200px",
              height: "200px"
            }
          },
          {src: image.url},
          {alt: image.name}
        ),
        Span(image.name + " - " + image.size + "KB")
      ];
    });
  }
  
  return HorizontalContainer(
    Header1("❣️JS is the best framework"),
    Container(
      HorizontalContainer(
        Container(
          Span({elementStyle: { "flex-grow": 1 }},"Name: "),
          Input(
            {key: "nameInput"},
            {events: {input: (event) => appData.state.inputName = event.target.value}},
            {value: appData.state.inputName}
          )
        ),
      ),
    ),
    P(`Input name: ${appData.state.inputName}`),
    ReusableButton({
      listeners: {
        addPicture: addPicture
      }
    }),
    Container(
      SortButton("size", "desc", "Size descending"),
      SortButton("size", "asc", "Size ascending"),
      SortButton("name", "desc", "Name descending"),
      SortButton("name", "asc", "Name ascending")
      ),
      Container(
        HorizontalContainer(
          ...ImageList()
        )
      )
  );
}

// Pass the component to the render function with the initial state
InitApplication(PizzaApp, {
  images: [{
    name: "firstPicture",
    url: "https://img.pizza/320/320",
    size: 320
  },
  {
    name: "secondPicture",
    url: "https://img.pizza/640/640",
    size: 640
  },
  {
    name: "thirdPicture",
    url: "https://img.pizza/128/128",
    size: 128
  }],
  sortBy: "size",
  sortDir: "desc",
  inputName: "",
  inputUrl: "",
  inputSize: ""
});