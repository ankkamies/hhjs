// Internal functions of the framework
let eventHandlers = {};
let activeEventTargetId = null;

function handleEvent(id, event) {
  activeEventTargetId = event.target.id;
  eventHandlers[id](event.target.value);
}

function bindEventHandlers() {
  // A cheap hack to handle input fields? No way!
  if (activeEventTargetId) {
    let element = document.getElementById(activeEventTargetId);
    element.focus();
    let len = element.value.length * 2;
    element.setSelectionRange(len, len);
    activeEventTargetId = null;
  }
  
  // Bind event handlers
  for (let id in eventHandlers) {
    document.querySelector('#' + id).addEventListener('input', (event) => {
      handleEvent(id, event);
    });
  }
}

function generateAttributeString(attributes) {
  let pairs = [];
  for (let key in attributes) {
    if (typeof attributes[key] === "function") {
      // Event handler
      let func = attributes[key];
      pairs.push(`${key}="${func.name}()"`);
    } else if (typeof attributes[key] === "object") {
      // Styles
      let styleString = "";
      let styleObject = attributes[key];
      for (let style in styleObject) {
        styleString += `${style}: ${styleObject[style]};`
      }
      pairs.push(`${key}="${styleString}"`);
    } else {
      pairs.push(`${key}="${attributes[key]}"`);
    }
  }
  return pairs.join(" ");
}

function processInnerComponents(...innerComponents) {
  return innerComponents.reduce((combined, current) => {
    return combined + current;
  }, "");
}

function render(elementType, ...innerComponents) {
  let shouldRender = true;
  let options = [];
  let inputID = null;
  let attributes = innerComponents
    .filter((component) => {
      return typeof component === "object"; 
    })
    .filter((attribute) => {
      if (attribute["if"]) {
        shouldRender = false;
        return false;
      } else if (attribute["for"]) {
        options = attribute["for"];
        return false;
      } else if (attribute["input"]) {
        let inputFunction = attribute["input"];
        inputID = inputFunction.name;
        Object.defineProperty(eventHandlers, inputID, {
          value: inputFunction,
          enumerable: true
        });
        return false;
      }
      return true;
    })
    .reduce((combined, current) => {
      if (!combined) combined = {};
      return Object.assign(combined, current);
    }, null);
  
  if (!shouldRender) return "";
  if (inputID) {
    if (!attributes) {
      attributes = {id: inputID};
    } else {
      Object.assign(attributes, {id: inputID});
    }
  }
  
  let components = innerComponents.filter((component) => {
    return typeof component === "string";
  });
  
  let processedComponents = processInnerComponents(...components);

  if (options.length > 1) {
    return options.map((option) => {
      return processedComponents.replace("{{iterator}}", option);
    }).reduce((combined, current) => {
      return combined + `<${elementType} ${generateAttributeString(attributes)}>${current}</${elementType}>`;
    }, "");
  }
  
  return `<${elementType} ${generateAttributeString(attributes)}>${processedComponents}</${elementType}>`;
}

function initAppData(data) {
  let reactiveData = {};
  for (var key in data) {
   let value = data[key];
   Object.defineProperty(reactiveData, key, {
     get: function() {
      return value;
     },
     set: function(newValue) {
      value = newValue;
      renderApplication();
     }
   });
  }
  return reactiveData;
}

// Component declarations
function Container(...comp) {
  return render("div", {
    style: {
      "display": "flex",
      "flex-direction": "row",
      "font-family": "Arial, Helvetica, sans-serif"
    }
  }, ...comp);
}

function HorizontalContainer(...comp) {
  return render("div", {
    style: {
      "display": "flex",
      "flex-direction": "column",
      "font-family": "Arial, Helvetica, sans-serif"
    }
  }, ...comp);
}

function Button(...comp) {
  return render("button", {
    style: {
      "border": "1px solid #ccc",
      "border-radius": "4px",
      "margin": "4px",
      "padding": "6px",
      "drop-shadow": "4px black",
      "font-size": "14px"
    },
    class: "basic-button"
  },...comp);
}

function Header1(...comp) {
  return render("h1", ...comp);
}

function Paragraph(...comp) {
  return render("p",...comp);
}

function Input(...comp) {
  return render("input", ...comp);
}

function Table(...comp) {
  return render("table", ...comp);
}

function TableRow(...comp) {
  return render("tr", ...comp);
}

function TableHeader(...comp) {
  return render("th", ...comp);
} 

function TableCell(...comp) {
  return render("td", ...comp);
}

// This is the base application data that gets rendered on first render
var appData = {
  paragraphColor: "red",
  message: "It is production quality so feel free to use in your enterprais applications",
  inputValue: "",
  buttonsDisabled: false,
  columnIndex: 6,
  tableHeaders: [
    "Column 1",
    "Column 2",
    "Column 3",
    "Column 4",
    "Column 5"
  ],
  tableCells: [
    "WoW!",
    "Such",
    "Loop",
    "Rendering",
    ":DD"
  ]
};

// Layout and styles are done with JS only! Wow!
function renderApplication() {
  document.querySelector("#app").innerHTML =
  HorizontalContainer(
    Header1("❣️JS is the best framework"),
    Paragraph(
      {style: { color: appData.paragraphColor }},
      appData.message),
    Paragraph(
      "Try clicking the buttons below and see the text magically change!!!"),
    Container(
      Button(
        {onclick: changeColor},
        "Try clicking me!"),
      Button(
        {onclick: changeMessage},
        "Change the message!"),
      Button(
        {if: appData.buttonsDisabled},
        {onclick: disableButtons},
        "Remove buttons from the left side"),
      Button(
        {if: !appData.buttonsDisabled},
        {onclick: disableButtons},
        "Add buttons to the left side"),
      HorizontalContainer(
         {if: appData.buttonsDisabled},
         Button("Empty buton"),
         Button("Sad :(")
      )
    ),
    Container(
      {style: { "text-align": "center", "padding": "10px" }},
      Table(
        {style: { "padding": "2px" }},
        {border: "1"},
        TableRow(
          TableCell(
            {for: appData.tableHeaders},
            "{{iterator}}"
          )
        ),
        TableRow(
          TableCell(
            {for: appData.tableCells},
            "{{iterator}}"
          )
        )
      )
    ),
    Container(
      Input(
      {value: appData.inputValue},
      {input: columnInput}),
      Button(
        {onclick: addColumn},
        "Add column")
    )
  );
  
  bindEventHandlers();
}

// Button click handlers
function changeColor() {
  appData.paragraphColor = "blue";
}

function changeMessage() {
  appData.message = "What are you waiting for???????";
}

function disableButtons() {
  appData.buttonsDisabled = !appData.buttonsDisabled;
}

function addColumn() {
  appData.tableHeaders.push("Column " + appData.columnIndex);
  appData.tableCells.push(appData.inputValue);
  appData.columnIndex += 1;
  appData.inputValue = "";
}

function columnInput(value) {
  appData.inputValue = value;
}

appData = initAppData(appData);
renderApplication();
