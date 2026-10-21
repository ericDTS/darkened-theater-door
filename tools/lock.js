/* Builds the locked data block for the door. Same code runs in the editor page and in Node. */
var DoorLock = (function () {
  var ITER = 150000, PAD_TO = 24;
  function norm(s) { return String(s).toUpperCase().replace(/\s+/g, ""); }
  function hex(u) { return Array.prototype.map.call(new Uint8Array(u), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function b64(u) { var s = ""; u = new Uint8Array(u); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function rand(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  function safe(v) { return JSON.stringify(v).replace(/</g, "\\u003c"); }
  async function lockOne(subtle, salt, word, payload) {
    var base = await subtle.importKey("raw", new TextEncoder().encode(norm(word)), "PBKDF2", false, ["deriveBits"]);
    var bits = await subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: ITER, hash: "SHA-256" }, base, 512);
    var key = await subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt"]);
    var iv = rand(12);
    var ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(JSON.stringify(payload))));
    var box = new Uint8Array(12 + ct.length); box.set(iv); box.set(ct, 12);
    return [hex(bits.slice(32)), b64(box)];
  }
  /* entries: [{password, say, do}], defaults: [string] -> the text between the DATA markers */
  async function build(entries, defaults) {
    var subtle = crypto.subtle, salt = rand(16), locks = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      locks.push(await lockOne(subtle, salt, e.password, { say: e.say, do: e.do }));
    }
    var avg = locks.length ? Math.round(locks.reduce(function (a, l) { return a + l[1].length; }, 0) / locks.length) : 80;
    while (locks.length < PAD_TO) {
      var len = Math.max(40, Math.round((avg * 3 / 4) + (Math.random() * 16 - 8)));
      locks.push([hex(rand(32)), b64(rand(len))]);
    }
    locks.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    return [
      "  var SALT = \"" + hex(salt) + "\";",
      "  var ITER = " + ITER + ";",
      "  var LOCKS = {",
      locks.map(function (l) { return "    \"" + l[0] + "\": \"" + l[1] + "\""; }).join(",\n"),
      "  };",
      "  var DEFAULT_REPLIES = " + safe(defaults.length ? defaults : ["Not tonight."]) + ";"
    ].join("\n");
  }
  function inject(template, block) {
    return template.replace(/\/\/ @@BEGIN DATA[\s\S]*?\/\/ @@END DATA/, "// @@BEGIN DATA\n" + block + "\n  // @@END DATA");
  }
  return { build: build, inject: inject, norm: norm };
})();
if (typeof module !== "undefined") module.exports = DoorLock;
