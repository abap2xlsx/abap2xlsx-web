import * as fs from "node:fs";
import {initializeABAP} from "./output/init.mjs";
await initializeABAP();

console.log("Running examples.mjs");

for (let i = 1; i < 99; i++) {
  const className = "ZCL_EXCEL_DEMO" + i;
  if (abap.Classes[className] === undefined) {
    continue;
  }

  const excel = await abap.Classes[className].zif_excel_demo_output$run();

  const writer = new abap.Classes["ZCL_EXCEL_WRITER_2007"]();
  await writer.constructor_();

  const xstring = await writer.zif_excel_writer$write_file({io_excel: excel});

  fs.writeFileSync("public/zcl_excel_demo" + i + ".xlsx", Buffer.from(xstring.get(), "hex"));
}