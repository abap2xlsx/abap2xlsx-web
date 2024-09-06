import * as fs from "node:fs";
import * as path from "node:path";

console.log("Building abap.js");

const abapfiles = {};

for (const dirent of fs.readdirSync("open-abap-core/src", {recursive: true, withFileTypes: true})) {
  if (dirent.isDirectory()) {
    continue;
  }
  const contents = fs.readFileSync(path.join(dirent.parentPath, dirent.name)).toString();
  abapfiles[dirent.name] = contents;
}

fs.writeFileSync("public/abap.js", `const abapfiles = ${JSON.stringify(abapfiles)};`);