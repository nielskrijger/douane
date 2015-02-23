/**
 * Contains a collection of default sanitizers.
 *
 * @author Niels Krijger <niels@kryger.nl>
 */

'use strict';

var Douane = require('./Douane');

Douane.setSanitizer('toUpper', function(ctx) {
    return (ctx.value) ? ctx.value.toUpperCase() : null;
});

Douane.setSanitizer('toLower', function(ctx) {
    return (ctx.value) ? ctx.value.toLowerCase() : null;
});

Douane.setSanitizer('trim', function(ctx) {
    return (ctx.value) ? ctx.value.trim() : null;
});

Douane.setSanitizer('trimLeft', function(ctx) {
    return (ctx.value) ? ctx.value.trimLeft() : null;
});

Douane.setSanitizer('trimRight', function(ctx) {
    return (ctx.value) ? ctx.value.trimRight() : null;
});
