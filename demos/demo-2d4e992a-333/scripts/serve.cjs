/* 仅供本地预览的静态文件服务，无业务接口。 */
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  port = Number(process.env.JIAHE_PREVIEW_PORT || 8126);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};
const server = http.createServer((req, res) => {
  let file;
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + path.sep) || pathname.includes("/."))
      throw new Error("不可访问");
  } catch (error) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  });
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "端口 8126 已使用，请访问已启动的预览地址，或设置 JIAHE_PREVIEW_PORT。"
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    "嘉禾农业静态 Demo：http://127.0.0.1:" + port + "/  客户端：/customer.html",
  ),
);
