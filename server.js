require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8082;

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  // Dynamic route to expose public environment variables to the browser
  if (urlPath === "/env.js") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    const envPayload = `window.__ENV__ = {
  SUPABASE_URL: ${JSON.stringify(process.env.SUPABASE_URL || "")},
  SUPABASE_ANON_KEY: ${JSON.stringify(process.env.SUPABASE_ANON_KEY || "")}
};`;
    res.end(envPayload, "utf-8");
    return;
  }

  let filePath = "." + urlPath;
  if (filePath === "./") {
    filePath = "./index.html";
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 Not Found</h1>", "utf-8");
      } else {
        res.writeHead(500);
        res.end(
          "Sorry, check with the site admin for error: " + error.code + " ..\n"
        );
      }
    } else {
      // Inject /env.js into HTML pages automatically so credentials from .env are immediately available
      if (extname === ".html") {
        let htmlStr = content.toString("utf-8");
        if (!htmlStr.includes("/env.js")) {
          htmlStr = htmlStr.replace(
            "<head>",
            '<head>\n  <script src="/env.js"></script>'
          );
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(htmlStr, "utf-8");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content, "utf-8");
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
