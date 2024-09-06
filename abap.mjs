import * as fs from "node:fs";
import * as path from "node:path";

console.log("Building abap.js");

let output = "export const abapfiles = {\n";

function escape(input) {
  if (input.charCodeAt(0) === 0xFEFF) {
    input = input.substr(1);
  }
  return input.replaceAll("`", "\\`").replaceAll("${", "\\${").trimEnd();
}

/////////////////////////////////////////

for (const dirent of fs.readdirSync("open-abap-core/src", {recursive: true, withFileTypes: true})) {
  if (dirent.isDirectory() || dirent.name.endsWith(".testclasses.abap")) {
    continue;
  }
  const contents = fs.readFileSync(path.join(dirent.parentPath, dirent.name)).toString();
  output += `"${dirent.name}": \`${escape(contents)}\`,\n`;
}

/////////////////////////////////////////

{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zcl_excel_demo1.clas.abap", "utf-8").toString("utf-8");
  output += `"zcl_excel_demo1.clas.abap": \`${escape(contents)}\`,\n`;
}

{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zif_excel_demo_output.intf.abap").toString();
  output += `"zif_excel_demo_output.intf.abap": \`${escape(contents)}\`,\n`;
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
  output += `"${dirent.name}": \`${escape(contents)}\`,\n`;
}

/////////////////////////////////////////

fs.writeFileSync("src/abap.ts", output + "\n};");