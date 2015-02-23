/**
 * Contains a collection of default validators.
 *
 * @author Niels Krijger <niels@kryger.nl>
 */

'use strict';

var Douane = require('./Douane');
var _ = require('lodash');

Douane.setValidator('optional', null, function(ctx) {
    if (!ctx.value) {
        ctx.finished = true;
    }
    return null; // Don't cause an error
});

Douane.setValidator('notEmpty', 'Cannot be empty', function(ctx) {
    return !_.isNull(ctx.value) &&
        !_.isUndefined(ctx.value) &&
        !_.isNaN(ctx.value) &&
        ctx.value != '' &&
        ctx.value != {} &&
        ctx.value != [];
});

Douane.setValidator('required', 'Is required', function(ctx) {
    return !_.isNull(ctx.value) &&
        !_.isUndefined(ctx.value);
});

Douane.setValidator('isNumeric', 'Must be a numeric value', function(ctx) {
    return !isNaN(parseFloat(ctx.value)) && isFinite(ctx.value);
});

Douane.setValidator('isString', 'Must be a string', function(ctx) {
    return _.isString(ctx.value);
});

Douane.setValidator('isInt', 'Must be an integer', function(ctx) {
    return Number(ctx.value) === ctx.value && ctx.value % 1 === 0;
});

Douane.setValidator('isMin', 'Must be at least {0}', function(ctx, min) {
    return ctx.value >= min;
});