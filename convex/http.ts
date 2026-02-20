import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { bulkImport, getAllAnime, clearAllAnime, bulkInsertAnime } from "./httpActions";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/import",
  method: "POST",
  handler: bulkImport,
});

http.route({
  path: "/anime/all",
  method: "GET",
  handler: getAllAnime,
});

http.route({
  path: "/anime/clear",
  method: "POST",
  handler: clearAllAnime,
});

http.route({
  path: "/anime/bulk-insert",
  method: "POST",
  handler: bulkInsertAnime,
});

export default http;
