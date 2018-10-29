"use strict";
require("dotenv").config();
const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
// Node JS core Modules
const dns = require("dns");
const url = require("url");
// Init Express
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

/** this project needs a db !! **/

mongoose
	.connect(process.env.MONGOLAB_URI)
	.then(() => console.log("MongoDB  Connected"))
	.catch(err => console.log(err));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

const Schema = mongoose.Schema;

const urlSchema = new Schema({
	original_url: {
		type: String,
		required: true
	},
	short_url: {
		type: String,
		required: true
	}
});

const Url = mongoose.model("Url", urlSchema);
// your first API endpoint...
app.post("/api/shorturl/new", function(req, res) {
	Url.count({}, function(err, count) {
		if (err) throw err;

		let parsedUrl = url.parse(req.body.url);

		let lookupUrl = parsedUrl.protocol ? parsedUrl.host : parsedUrl.pathname;

		dns.lookup(lookupUrl, function(err, address, family) {
			console.log("addresses", address);
			console.log("family", family);

			if (err || !address) {
				console.error("err", err);
				res.json({ error: "invalid URL" });
			} else {
				const newUrl = {
					original_url: req.body.url,
					short_url: count + 1
				};
				// res.json(newUrl);
				new Url(newUrl)
					.save()
					.then(url => res.json(url))
					.catch(err => console.log(err));
			}
		});
	});
});

// your first API endpoint...
app.use("/api/shorturl/:shorturl", function(req, res) {
	Url.find({ short_url: req.params.shorturl })
		.exec()
		.then(url => {
			if (!url) res.status(404).json({ url: "Url not found" });

			console.log(url[0]);
			res.redirect(url[0].original_url);
		})
		.catch(err => console.log(err));
});

app.listen(port, function() {
	console.log("Node.js listening ...");
});
