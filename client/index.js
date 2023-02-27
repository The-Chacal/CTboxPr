/* 1) Create an instance of CSInterface. */
var csInterface = new CSInterface();

/* 2) Make a reference to your HTML button and add a click handler. */
var exportButton = document.querySelector("#export-shots-button");
exportButton.addEventListener("click", openDoc);

/* 3) Write a helper function to pass instructions to the ExtendScript side. */
function openDoc() {
  csInterface.evalScript("exportShots()");
}