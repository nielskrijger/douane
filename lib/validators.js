/**
 * Contains a collection of default validators.
 *
 * @author Niels Krijger <niels@kryger.nl>
 */

'use strict';

var Douane = require('./Douane');
var _ = require('lodash');
var validator = require('validator');

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
        ctx.value !== '' &&
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

Douane.setValidator('minElements', 'Must contain at least {0} elements', function(ctx, minElements) {
    return Array.isArray(ctx.value) && ctx.value.length >= minElements;
});

Douane.setValidator('isInt', 'Must be an integer', function(ctx) {
    return Number(ctx.value) === ctx.value && ctx.value % 1 === 0;
});

Douane.setValidator('isMin', 'Must be at least {0}', function(ctx, min) {
    return ctx.value >= min;
});

Douane.setValidator('isMax', 'Can\'t be more than {0}', function(ctx, max) {
    return ctx.value <= max;
});

Douane.setValidator('minLength', 'Must contain at least {0} characters', function(ctx, minLength) {
    return _.isString(ctx.value) && ctx.value.length >= minLength;
});

Douane.setValidator('maxLength', 'Must contain no more than {0} characters', function(ctx, maxLength) {
    return _.isString(ctx.value) && ctx.value.length <= maxLength;
});

Douane.setValidator('length', 'Must be at least {0} and no more than {1} characters long', function(ctx, minLength, maxLength) {
    return _.isString(ctx.value) && ctx.value.length >= minLength && ctx.value.length <= maxLength;
});

Douane.setValidator('isEmail', 'Valid email required', function(ctx) {
    return validator.isEmail(ctx.value);
});
