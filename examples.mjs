import * as fs from "node:fs";
import {initializeABAP} from "./output/init.mjs";
await initializeABAP();

console.log("Running examples.mjs");

const excel = await abap.Classes["ZCL_EXCEL_DEMO1"].zif_excel_demo_output$run();

const writer = new abap.Classes["ZCL_EXCEL_WRITER_2007"]();
await writer.constructor_();

const xstring = await writer.zif_excel_writer$write_file({io_excel: excel});

fs.writeFileSync("public/zcl_excel_demo1.xlsx", Buffer.from(xstring.get(), "hex"));