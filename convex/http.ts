import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { bulkImport } from "./httpActions";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/import",
  method: "POST",
  handler: bulkImport,
});

export default http;
