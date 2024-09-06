import * as fs from "node:fs";
import * as path from "node:path";

console.log("Building abap.js");

const abapfiles = {};

/////////////////////////////////////////

for (const dirent of fs.readdirSync("open-abap-core/src", {recursive: true, withFileTypes: true})) {
  if (dirent.isDirectory() || dirent.name.endsWith(".testclasses.abap")) {
    continue;
  }
  const contents = fs.readFileSync(path.join(dirent.parentPath, dirent.name)).toString();
  abapfiles[dirent.name] = contents.trimEnd();
}

/////////////////////////////////////////

{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zcl_excel_demo1.clas.abap").toString();
  abapfiles["zcl_excel_demo1.clas.abap"] = contents.trimEnd();
}
{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zif_excel_demo_output.intf.abap").toString();
  abapfiles["zif_excel_demo_output.intf.abap"] = contents.trimEnd();
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
  abapfiles[dirent.name] = contents.trimEnd();
}

/////////////////////////////////////////

for (const key in abapfiles) {
  if (abapfiles[key].charCodeAt(0) === 0xFEFF) {
    abapfiles[key] = abapfiles[key].substr(1);
  }
}

fs.writeFileSync("src/abap.ts", `export const abapfiles = ${JSON.stringify(abapfiles, null, 2)};`);