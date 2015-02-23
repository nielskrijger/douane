'use strict';

var assert = require('chai').assert;
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

module.exports.createApplication = function createApplication(douane) {
    var app = express();
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(douane.middleware());
    return app;
};
