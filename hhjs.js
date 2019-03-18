// Internal functions of the framework
function generateAttributeString(attributes) {
  let pairs = [];
  for (let key in attributes) {
    pairs.push(`${key}="${attributes[key]}"`);
  }
  return pairs.join(" ");
}

function processInnerComponents(...innerComponents) {
  return innerComponents.reduce((combined, current) => {
    return combined + current;
  }, "");
}

function render(elementType, ...innerComponents) {
  let attributes = innerComponents
    .filter((component) => {
      return typeof component === "object"; 
    })
    .reduce((combined, current) => {
      if (!combined) combined = {};
      return Object.assign(combined, current);
    }, null);
  
  let components = innerComponents.filter((component) => {
    return typeof component === "string";
  });
  
  return `<${elementType} ${generateAttributeString(attributes)}>${processInnerComponents(...components)}</${elementType}>`;
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
    style: "display: flex; flex-direction: row;"
  }, ...comp);
}

function HorizontalContainer(...comp) {
  return render("div", {
    style: "display: flex; flex-direction: column;"
  }, ...comp);
}

function Button(...comp) {
  return render("button", ...comp);
}

function Header1(...comp) {
  return render("h1", ...comp);
}

function Paragraph(...comp) {
  return render("p", ...comp);
}

// This is the base application data that gets rendered on first render
var appData = {
  paragraphColor: "red",
  message: "It is production quality so feel free to use in your enterprais applications"
};

// Layout and styles are done with JS only! Wow!
function renderApplication() {
  document.querySelector("#app").innerHTML =
  HorizontalContainer(
    Header1("HHjs is the best JS framework"),
    Paragraph({style: "color: " + appData.paragraphColor + ";"}, appData.message),
    Paragraph("Try clicking the buttons below and see the text magically change!!!"),
    Container(
      Button({onclick: "changeColor()"}, "Try clicking me!"),
      Button({onclick: "changeMessage()"}, "Change the message!"),
      HorizontalContainer(
         Button("These buttons do nothing!"),
         Button("Sad :(")
      )
    )
  );
}

// Button click handlers
function changeColor() {
  appData.paragraphColor = "blue";
}

function changeMessage() {
  appData.message = "What are you waiting for???????";
}

appData = initAppData(appData);
renderApplication();
