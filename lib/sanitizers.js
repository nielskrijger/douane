/**
 * Contains a collection of default sanitizers.
 *
 * @author Niels Krijger <niels@kryger.nl>
 */

'use strict';

var Douane = require('./Douane');
var _ = require('lodash');

Douane.setSanitizer('toUpper', function(ctx) {
    return (ctx.value && _.isString(ctx.value)) ? ctx.value.toUpperCase() : ctx.value;
});

Douane.setSanitizer('toLower', function(ctx) {
    return (ctx.value && _.isString(ctx.value)) ? ctx.value.toLowerCase() : ctx.value;
});

Douane.setSanitizer('trim', function(ctx) {
    return (ctx.value && _.isString(ctx.value)) ? ctx.value.trim() : ctx.value;
});

Douane.setSanitizer('trimLeft', function(ctx) {
    return (ctx.value && _.isString(ctx.value)) ? ctx.value.trimLeft() : ctx.value;
});

Douane.setSanitizer('trimRight', function(ctx) {
    return (ctx.value && _.isString(ctx.value)) ? ctx.value.trimRight() : ctx.value;
});
