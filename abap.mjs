import * as fs from "node:fs";
import * as path from "node:path";

console.log("Building abap.js");

let output = "export const abapfiles = {\n";
let files = {};

function escape(input) {
  if (input.charCodeAt(0) === 0xFEFF) {
    input = input.substr(1);
  }
  return input.replaceAll("`", "\\`").replaceAll("${", "\\${").trimEnd();
}

function add(name, contents) {
  output += `"${name}": \`${escape(contents)}\`,\n`;
  files[name] = contents;
}

/////////////////////////////////////////

for (const dirent of fs.readdirSync("open-abap-core/src", {recursive: true, withFileTypes: true})) {
  if (dirent.isDirectory() || dirent.name.endsWith(".testclasses.abap")) {
    continue;
  }
  const contents = fs.readFileSync(path.join(dirent.parentPath, dirent.name)).toString();
  add(dirent.name, contents);
}

/////////////////////////////////////////

{
  const contents = fs.readFileSync("abap2xlsx-demos/src/demo001/zcl_excel_demo1.clas.abap", "utf-8").toString("utf-8");
  add("zcl_excel_demo1.clas.abap", contents);
}

{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zif_excel_demo_output.intf.abap").toString();
  add("zif_excel_demo_output.intf.abap", contents);
}

/////////////////////////////////////////

const filter = JSON.parse(fs.readFileSync("abap2xlsx/abap_transpile.json")).input_filter;
for (const dirent of fs.readdirSync("abap2xlsx/src", {recursive: true, withFileTypes: true})) {
  if (dirent.isDirectory() || dirent.name.endsWith(".testclasses.abap")) {
    continue;
  }
  if (filter.some(f => path.join(dirent.parentPath, dirent.name).replaceAll("\\", "/").match(f)) === false) {
    continue;
  }
  const contents = fs.readFileSync(path.join(dirent.parentPath, dirent.name)).toString();
  add(dirent.name, contents);
}

/////////////////////////////////////////

fs.writeFileSync("src/abap.ts", output + "\n};");
for (const filename in files) {
  fs.writeFileSync(path.join("input", filename), files[filename]);
}