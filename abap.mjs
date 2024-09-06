import * as fs from "node:fs";
import * as path from "node:path";

console.log("Building abap.js");

const abapfiles = {};

/////////////////////////////////////////

for (const dirent of fs.readdirSync("open-abap-core/src", {recursive: true, withFileTypes: true})) {
  if (dirent.isDirectory()) {
    continue;
  }
  const contents = fs.readFileSync(path.join(dirent.parentPath, dirent.name)).toString();
  abapfiles[dirent.name] = contents;
}

/////////////////////////////////////////

{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zcl_excel_demo1.clas.abap").toString();
  abapfiles["zcl_excel_demo1.clas.abap"] = contents;
}
{
  const contents = fs.readFileSync("abap2xlsx-demos/src/zif_excel_demo_output.intf.abap").toString();
  abapfiles["zif_excel_demo_output.intf.abap"] = contents;
}

/////////////////////////////////////////

fs.writeFileSync("src/abap.ts", `export const abapfiles = ${JSON.stringify(abapfiles)};`);