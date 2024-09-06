// @ts-ignore
global.MonacoEnvironment = {
  globalAPI: true,
  getWorkerUrl: function (_moduleId: any, label: any) {
    if (label === "json") {
      return "./json.worker.bundle.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.bundle.js";
    }
    return "./editor.worker.bundle.js";
  },
};

import "./index.css";
import "../public/favicon-16x16.png";
import "../public/favicon-32x32.png";
import * as monaco from "monaco-editor";
import {config, Transpiler} from "@abaplint/transpiler";
import {ABAP, MemoryConsole} from "@abaplint/runtime";
import * as abaplint from "@abaplint/core";
import * as abapMonaco from "@abaplint/monaco";
import Split from "split-grid";
import { abapfiles } from "./abap";

const reg = new abaplint.Registry(new abaplint.Config(JSON.stringify(config)));
abapMonaco.registerABAP(reg);

console.dir(abapfiles["zcl_excel_demo1.clas.abap"]);

const filename = "file:///zcl_demo.clas.abap";
const model1 = monaco.editor.createModel(
  abapfiles["zcl_excel_demo1.clas.abap"],
  "abap",
  monaco.Uri.parse(filename),
);
reg.addFile(new abaplint.MemoryFile(filename, ""));

Split({
  columnGutters: [
    {
      track: 1,
      element: document.getElementById("gutter1"),
    },
    {
      track: 2,
      element: document.getElementById("gutter2"),
    },
  ],
});

const editor1 = monaco.editor.create(document.getElementById("container1"), {
  model: model1,
  theme: "vs-dark",
  minimap: {
    enabled: false,
  },
});

function updateEditorLayouts() {
  editor1.layout();
}

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.attributeName === "style") {
      updateEditorLayouts();
    }
  }
});

observer.observe(document.getElementById("horizon"), {
  attributes: true,
  attributeFilter: [
    "style",
  ],
});

window.addEventListener("resize", updateEditorLayouts);

// see https://github.com/SimulatedGREG/electron-vue/issues/777
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();

async function abapChanged() {
  try {
    const contents = editor1.getValue();
    const file = new abaplint.MemoryFile(filename, contents);
    reg.updateFile(file);
    reg.parse();
    abapMonaco.updateMarkers(reg, model1);

    const res = await new Transpiler().runRaw([{filename, contents}]);
  } catch (error) {
    console.dir(error);
  }
}

editor1.onDidChangeModelContent(abapChanged);
abapChanged();
editor1.focus();
const abap = new ABAP({console: new MemoryConsole()});
