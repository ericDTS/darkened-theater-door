// Re-locks the door's passwords into index.html.
// Usage: node tools/build.js passwords.json
// passwords.json is the plain list from the Door Passwords editor. It must never be committed.
const fs = require("fs"), path = require("path");
const DoorLock = require("./lock.js");
const page = path.join(__dirname, "..", "index.html");
const list = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const html = fs.readFileSync(page, "utf8");
const entries = (list.passwords || []).filter(p => DoorLock.norm(p.password));
let defaults = (list.defaults || []).filter(d => String(d).trim());
if (!defaults.length) {
  // keep the page's current "anything else" replies rather than collapsing to one
  const m = html.match(/var DEFAULT_REPLIES = (\[.*?\]);/);
  defaults = m ? JSON.parse(m[1]) : [];
}
DoorLock.build(entries, defaults).then(block => {
  fs.writeFileSync(page, DoorLock.inject(html, block));
  console.log("Locked " + entries.length + " passwords, " + defaults.length + " open replies.");
});
