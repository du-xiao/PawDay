import "dotenv/config";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl?.startsWith("file:") && !path.isAbsolute(databaseUrl.slice(5))) {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), "data", path.basename(databaseUrl.slice(5)))}`;
}

if (process.env.UPLOAD_DIR && !path.isAbsolute(process.env.UPLOAD_DIR)) {
  process.env.UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR);
}

await import("../.next/standalone/server.js");
