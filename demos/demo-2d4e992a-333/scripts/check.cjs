/* 静态产物检查：验证语法、全部入口与本地资源引用。 */
const fs = require("node:fs"),
  path = require("node:path"),
  cp = require("node:child_process"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
let count = 0;
for (const file of fs
  .readdirSync(path.join(root, "assets"))
  .filter((f) => f.endsWith(".js"))) {
  cp.execFileSync(process.execPath, [
    "--check",
    path.join(root, "assets", file),
  ]);
  count++;
}
for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(html.includes('charset="UTF-8"'));
  for (const match of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) {
    assert.ok(
      fs.existsSync(path.join(root, match[1])),
      file + " 缺少资源 " + match[1],
    );
  }
  assert.ok(!/https?:\/\//.test(html), "运行入口不得依赖远程资源");
  count++;
}
console.log("静态检查通过：" + count + " 项（脚本语法与 HTML 入口资源）");
