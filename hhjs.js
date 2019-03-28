// Internal functions of the framework
let application = {
  entryPoint: null
};
let cachedElement = null;
let currentState = null;

let lastDom = null;
let newDom = null;

function processInnerComponents(element, ...innerComponents) {
  innerComponents.forEach((component) => {
    if (Array.isArray(component)) {
        processInnerComponents(element, ...component);
    } else if (typeof component === "string") {
      element.innerHTML = component;
    } else {
      element.appendChild(component);
    }
  });
}

function isValidElement(component) {
  return component instanceof Element
      || component instanceof HTMLDocument
      || typeof component === "string"
      || Array.isArray(component);
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

function InitApplication(app, initialState) {
  application.entryPoint = app;

  Object.defineProperty(application, "state", {
    get: function() {
      return currentState;
    },
    set: function(newValue) {
      currentState = InitAppData(application, newValue);
      RenderApplication(application.entryPoint);
    }
  });
    
  application.state = initialState;
}

function RenderApplication(app) {
  newDom = app(application);
  
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
function Container(...comp) {
  return render("div", {
    elementStyle: {
      "display": "flex",
      "flex-direction": "row",
      "font-family": "Arial, Helvetica, sans-serif"
    }
  }, ...comp);
}

function HorizontalContainer(...comp) {
  return render("div", {
    elementStyle: {
      "display": "flex",
      "flex-direction": "column",
      "font-family": "Arial, Helvetica, sans-serif"
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

// Define the application. Functions are defined inside the scope so they have
// access to the appData.
const AnimeApp = (appData) => {
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
  
  function addAnimeGirl() {
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
        Container(
          Span({elementStyle: { "flex-grow": 1 }}, "Url: "),
          Input(
            {key: "urlInput"},
            {events: {input: (event) => appData.state.inputUrl = event.target.value}},
            {value: appData.state.inputUrl}
          )
        ),
        Container(
          Span({elementStyle: { "flex-grow": 1 }}, "Size: "),
          Input(
            {key: "sizeInput"},
            {events: {input: (event) => appData.state.inputSize = event.target.value}},
            {value: appData.state.inputSize}
          )
        )
      ),
      Button(
        {events: {click: addAnimeGirl}},
        "Add animu gurl"
      ),
    ),
    P(`Uuden animen nimi: ${appData.state.inputName}`),
    P(`Uuden animen URL: ${appData.state.inputUrl}`),
    P(`Uuden animen koko: ${appData.state.inputSize}`),
    Container(
      SortButton("size", "desc", "Size descending"),
      SortButton("size", "asc", "Size ascending"),
      SortButton("name", "desc", "Name descending"),
      SortButton("name", "asc", "Name ascending")
      ),
      Container(
        HorizontalContainer(
          function() {
            return appData.state.images.sort(compare).map((image) => 
                [Image(
                  {elementStyle: {
                    width: "200px",
                    height: "200px"
                  }},
                  {src: image.url}
                ),
                Span(image.name + " - " + image.size + "KB")]
              );
          }()
        )
      )
  );
}

// Pass the application to the render function with the initial state
InitApplication(AnimeApp, {
  images: [{
    name: "pinkviini",
    size: 66666,
    url: "https://i.redd.it/cp4d232b15o21.png"
  },
  {
    name: "anime tyds",
    size: 1337,
    url: "https://i.redd.it/gr2zcpsmo3o21.jpg",
  },
  {
  	url: "https://i.redd.it/azdz6rogb2o21.jpg",
    size: 500,
    name: "tisu"
  }],
  sortBy: "size",
  sortDir: "desc",
  inputName: "",
  inputUrl: "",
  inputSize: ""
});