// This is actually everything you need to make function style components
export function CreateElementTree({components, innerText, innerHTML, tag, id, style, event}) {
  let element = document.createElement(tag);
  id && element.setAttribute('id', id);
  style && element.setAttribute('style', style);
  event && Object.entries(event).forEach(([key, value]) => {
  });
  if (components) components.forEach(comp => element.appendChild(CreateElementTree(comp)));
  if (innerText) element.innerText = innerText;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}
