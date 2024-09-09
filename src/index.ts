// @ts-ignore
global.MonacoEnvironment = {
  globalAPI: true,
  getWorkerUrl: function (_moduleId, label) {
    /*
    if (label === "json") {
      return "./json.worker.bundle.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.bundle.js";
    }
    */
    return "./editor.worker.bundle.js";
  },
};

import "./index.css";
import "../public/favicon-16x16.png";
import "../public/favicon-32x32.png";
import * as monaco from "monaco-editor";
import {config, ITranspilerOptions, Transpiler, UnknownTypesEnum} from "@abaplint/transpiler";
// import {ABAP, MemoryConsole} from "@abaplint/runtime";
import * as abaplint from "@abaplint/core";
import * as abapMonaco from "@abaplint/monaco";
import Split from "split-grid";
import { abapfiles } from "./abap.js";
import * as initabap from "../output/init.mjs";
import {Buffer} from "buffer";
console.dir(initabap); // just to make sure its not shaked away

const reg = new abaplint.Registry(new abaplint.Config(JSON.stringify(config)));
for (const filename in abapfiles) {
  if (filename.indexOf("zcl_excel_demo") === 0) {
    document.getElementById("demoDropdown").innerHTML += `<option value="${filename}">${filename}</option>\n`;
    continue;
  }
  reg.addFile(new abaplint.MemoryFile(filename, abapfiles[filename]));
}
abapMonaco.registerABAP(reg);

let top = "zcl_excel_demo1.clas.abap";
const filename = "file:///zcl_demo.clas.abap";

const model1 = monaco.editor.createModel(
  abapfiles[top],
  "abap",
  monaco.Uri.parse(filename),
);
reg.addFile(new abaplint.MemoryFile(filename, abapfiles[top]));

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

document.getElementById("revertButton").addEventListener("click", () => {
  reg.updateFile(new abaplint.MemoryFile(filename, abapfiles[top]));
  model1.setValue(abapfiles[top]);
  abapChanged();
});

document.getElementById("demoDropdown").addEventListener("change", (e) => {
  // @ts-ignore
  top = document.getElementById("demoDropdown").value;

  reg.updateFile(new abaplint.MemoryFile(filename, abapfiles[top]));
  model1.setValue(abapfiles[top]);
  abapChanged();
});

// see https://github.com/SimulatedGREG/electron-vue/issues/777
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();

async function sanitizeAndRun(js: string) {
  let lines = js.split("\n");
  lines = lines.filter(row => row.includes("await import") === false);
  lines = lines.filter(row => row.includes("export {") === false);
  js = lines.join("\n");
  js += `
const excel = await abap.Classes["ZCL_EXCEL_DEMO1"].zif_excel_demo_output$run();
const writer = new abap.Classes["ZCL_EXCEL_WRITER_2007"]();
await writer.constructor_();
const xstring = await writer.zif_excel_writer$write_file({io_excel: excel});
return xstring;
  `;
//  console.dir(js);

  const f = new AsyncFunction("abap", js);
  const res = await f(globalThis.abap);
  console.dir(res);

  var file = document.createElement('a');
  file.setAttribute('href', 'data:application/octet-stream;base64,' + Buffer.from(res.get(), "hex").toString("base64"));
  file.setAttribute('download', "foo.xlsx");
  file.innerText = "Download, " + (res.get().length / 2) + " bytes";
  document.getElementById("container2").appendChild(file);
}

async function abapChanged() {
  // @ts-ignore
  console.dir(globalThis.abap);
  const contents = editor1.getValue();

  try {
    const file = new abaplint.MemoryFile(filename, contents);
    reg.updateFile(file);
    reg.parse();
    abapMonaco.updateMarkers(reg, model1);

    if (contents === abapfiles[top]) {
      const name = top.split(".")[0];
      document.getElementById("container2").innerHTML = `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=https://abap2xlsx.github.io/abap2xlsx-web/${name}.xlsx" title="Excel"></iframe>`;

      setTimeout(() => monaco.editor.getEditors()[0].focus(), 1000);
      return;
    } else {
      const markers = monaco.editor.getModelMarkers({});
      if (markers.length > 0) {
        let text = "<u><b>Code Issues</b></u><br>";
        for (const marker of markers) {
          text += marker.message + "<br>";
        }
        document.getElementById("container2").innerHTML = text;
        return;
      }

      document.getElementById("container2").innerHTML = `<b>Compiling</b>`;
    }
  } catch (error) {
    console.dir(error);
  }

  try {
    const options: ITranspilerOptions = {
      "ignoreSyntaxCheck": false,
      "addFilenames": true,
      "addCommonJS": true,
      "skipReposrc": true,
      "unknownTypes": UnknownTypesEnum.runtimeError,
    }
    const result = await new Transpiler(options).run(reg);
    document.getElementById("container2").innerHTML = `<b>Compiling Done</b><br><br>`;
    const compiled = result.objects.find(o => o.filename.includes("zcl_demo.clas.mjs"))?.chunk.getCode();
    await sanitizeAndRun(compiled);
  } catch (error) {
    document.getElementById("container2").innerHTML = `<u><b>Issues found during compilation or execution</b></u><br>`;
    console.dir(error);
    document.getElementById("container2").innerHTML += error.toString();
  }
}

editor1.onDidChangeModelContent(abapChanged);
abapChanged();
editor1.focus();

//const abap = new ABAP({console: new MemoryConsole()});
