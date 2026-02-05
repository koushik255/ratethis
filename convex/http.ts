import { httpRouter } from "convex/server";
import { bulkImport } from "./httpActions";

const http = httpRouter();

http.route({
  path: "/import",
  method: "POST",
  handler: bulkImport,
});

export default http;
