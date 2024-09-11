import * as fs from "node:fs";

// workaround for the class_constructor

const filename = "./output/zcl_excel_worksheet.clas.mjs";
let contents = fs.readFileSync(filename).toString("utf8");
contents = `await import("./cl_abap_elemdescr.clas.mjs");\n` + contents;
fs.writeFileSync(filename, contents);
