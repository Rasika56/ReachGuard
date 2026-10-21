// Minimal demo app. Intentionally uses deliberately older dependency versions
// (see package.json) so the OSV lookup has something realistic to find.
const express = require("express");
const _ = require("lodash");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: _.capitalize("hello from the reachguard sample app") });
});

if (require.main === module) {
  app.listen(3001, () => console.log("Sample app on :3001"));
}

module.exports = app;
