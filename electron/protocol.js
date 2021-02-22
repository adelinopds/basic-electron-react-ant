
const fs = require("fs");
const path = require("path");

const DIST_PATH = path.join(__dirname, "../dist");
const scheme = "app";

const mimeTypes = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "application/svg+xml",
  ".ico": "image/vnd.microsoft.icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".map": "text/plain"
}
const mimiType = filename => mimeTypes[path.extname(`${filename || ""}`).toLowerCase()]

const charset = mimeType => [".html", ".htm", ".js", ".mjs"].some(m => m === mimeType)
	? "utf-8"
	: null;

const mime = filename => mimiType(filename) || null

module.exports = {
  scheme,
  requestHandler(req, next) {
		const reqUrl = new URL(req.url);
		let reqPath = path.normalize(reqUrl.pathname);
		if (reqPath === "/") {
			reqPath = "/index.html";
		}
		const reqFilename = path.basename(reqPath);
		fs.readFile(path.join(DIST_PATH, reqPath), (err, data) => {
			const mimeType = mime(reqFilename);
			if (!err && mimeType !== null) {
				next({
					mimeType: mimeType,
					charset: charset(mimeType),
					data: data
				});
			} else {
				console.error(err);
			}
		});
	}
}