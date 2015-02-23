/**
 * Enables sanitation, synchronous and asynchronous validations on connect-compatible request objects.
 *
 * @author Niels Krijger <niels@kryger.nl>
 */

'use strict';

var _ = require('lodash');
var async = require('async');

function Douane(options) {
    options = options || {};
    this.errorFormatter = (options.errorFormatter) ? options.errorFormatter : errorFormatter;
    this.resultFormatter = (options.resultFormatter) ? options.resultFormatter : resultFormatter;
    this.errorMessages = (options.errorMessages) ? options.errorMessages : {};
}

/**
 * Returns connect middleware.
 *
 * @return {Function} A middleware function that adds validation methods on the request object.
 */
Douane.prototype.middleware = function() {
    var self = this;
    return function(req, res, next) {
        req.douane = self;
        req.checkBody = checkFunction(req, function(item) {
            return req.body;
        });
        req.validate = validateFunction(req);
        return next();
    };
};

/**
 * Returns a function that registers a new validation for a parameter in a request object.
 *
 * @param {Object} req The request object.
 * @param {Function} getter A function returning the parameter object root.
 * @return {Function} A function that accepts a single argument which locates a value relative to the parameter object
 *      root returned by `getter`.
 */
function checkFunction(req, getter) {
    return function(param) {
        var validation = new Validation(req, param, getter);
        if (!req._validations) { // Piggy-bag queued validation in request object
            req._validations = [];
        }
        req._validations.push(validation);
        return validation;
    };
}

function validateFunction(req) {
    return function(done) {
        var fns = req._validations.map(function(item) {
            return function(cb) {
                item.validate(cb);
            };
        });
        async.parallel(fns, function(err, results) {
            if (err) {
                return done(err);
            }
            var errors = [];
            results.forEach(function(items) {
                errors = errors.concat(items);
            });
            return done(null, req.douane.resultFormatter(errors));
        });
    };
}

/**
 * The error formatter generates the error object when a check failed.
 *
 * The default error formatter substitutes `{0}`, `{1}` etc. with the corresponding argument
 * of the validation check. For example, `req.checkObject('input').inRange(0, 1, 'Should be between {0} and {1}')`
 * yields the error `Should be between 0 and 1`.
 *
 * @param {Object} ctx The validation context object.
 * @param {String} msg The error message.
 * @param [*[]] args Any parameters passed to the validation check, if any.
 * @return Object A formatted error.
 */
function errorFormatter(ctx, msg, args) {
    // `args` is not an Array (or an Iterable) but an array-like object
    // so instead of using forEach loop over it with a normal for loop
    for (var i = 0, max = args.length; i < max; i++) {
        msg = msg.replace('{' + i + '}', args[i]);
    }
    return {
        param: ctx.param,
        msg: msg,
        value: ctx.value
    };
}

/**
 * The result formatter formats the final output when all validations are finished.
 *
 * @param [Object[]] errors An array of formatted error messages if at least one validation failed.
 * @return {Object|null} The formatted result object or `null` when no errors occurred.
 */
function resultFormatter(errors) {
    if (!errors || errors.length === 0) {
        return null;
    }
    return errors;
}

/**
 * A `Validation` consists of one or more checks on a single property.
 *
 * Checks are executed in sequential order and stops at the first validation that fails.
 *
 * @param {Object} req The request object.
 * @param {String} param The parameter locater string.
 * @param {Function} getter A function returning the startpoint of the object.
 */
function Validation(req, param, getter) {
    this.req = req;
    var setter = function(context, newValue) {
        setParam(context.req, getter, context.param, newValue);
    };
    this._checks = [];
    this.contexts = generateParams(param).map(function(param) {
        return {
            req: req,
            setter: setter,
            param: param,
            finished: false,
            value: getParam(req, getter, param)
        };
    });

    /**
     * Returns an array of all applicable arrays. Its main purpose is to expand array parameters, for example
     * `array[].prop` returns `['array[1].prop', 'array[2].prop']`.
     */
    function generateParams(param) {
        if (param.indexOf('[]') == -1) { // Only arrays yield multiple contexts
            return [param];
        }

        var result = [];
        var match = /^(.+?)\[\]\.?(.*)$/.exec(param);
        var array = getParam(req, getter, match[1]);
        if (array) {
            for (var i = 0, max = array.length; i < max; i++) {
                result = result.concat(generateParams(match[1] + '[' + i + '].' + match[2]));
            }
        }
        return result;
    }
}

/**
 * Executes all checks within the validation.
 *
 * @param {Function} done Callback function.
 */
Validation.prototype.validate = function(done) {
    async.series(this._checks, function(err, results) { // Results contains the errors, if any
        if (err) {
            return done(err);
        }
        var errors = results.filter(function(elm) {
            return elm !== undefined;
        });
        done(null, errors);
    });
};

function getParam(req, getter, param) {
    var params = param.split('.').filter(function(elm) {
        return elm !== '';
    });

    // Extract value from params
    var value = getter();
    params.map(function(item) {
        var match = /\[([0-9]+)\]$/.exec(item);
        if (match !== null) {
            value = value[match.input.substring(0, match.index)];
            value = value[parseInt(match[1])];
        } else {
            value = value[item];
        }
    });
    return value;
}

function setParam(req, getter, param, newValue) {
    var params = param.split('.').filter(function(elm) {
        return elm !== '';
    });

    // Extract value from params
    if (params.length > 1) {
        var findParam = params.slice(0, -1).join('.');
        var elm = getParam(req, getter, findParam);
        if (elm && elm[params[params.length-1]]) {
            elm[params[params.length-1]] = newValue;
        }
    } else {
        getter()[param] = newValue;
    }
}

/**
* Defines a validation method.
*
* Validation methods are added globally to the Validation prototype so make sure method names are unique. Validators
* with the same name are overwritten.
*
* @param {String} methodName The name of the method.
* @param {String} defaultErrorMsg The default error message .
* @param {Function} func The validation function.
*/
Validation.prototype.setValidator = function(methodName, defaultErrorMsg, func) {
    Validation.prototype[methodName] = function() {
        var args = Array.prototype.slice.call(arguments); // Copy reference so we can pass original arguments to `func` later on
        this.contexts.forEach(function(context) {
            this._checks.push(function(done) {
                if (context.finished) { // Used when a previous validation decided no more validations should be executed
                    return done();
                }
                if (func.apply(func, [context].concat(args)) === false) {
                    return done(null, failureMessage(methodName, defaultErrorMsg, context, func, args));
                }
                return done();
            });
        }.bind(this));
        return this;
    };
};

/**
* Defines an asynchronous validation method.
*
* Validation methods are added globally to the Validation prototype so make sure method names are unique. Validators
* with the same name are overwritten.
*
* @param {String} methodName The name of the method.
* @param {String} defaultErrorMsg The default error message .
* @param {Function} func The validation function.
* @return {Bool} True if validation check was succesfull, otherwise false.
*/
Validation.prototype.setAsyncValidator = function(methodName, defaultErrorMsg, func) {
    Validation.prototype[methodName] = function() {
        var args = Array.prototype.slice.call(arguments); // Copy reference so we can pass original arguments to `func` later on
        this.contexts.forEach(function(context) {
            this._checks.push(function(done) {
                if (context.finished) { // Used when a previous validation decided no more validations should be executed
                    return done();
                }
                func.apply(func, [context].concat(args).concat(function(err, result) {
                    if (err) {
                        done(err);
                    } else if (result !== true) {
                        done(null, failureMessage(methodName, defaultErrorMsg, context, func, args));
                    } else {
                        done();
                    }
                }));
            });
        }.bind(this));
        return this;
    };
};

function failureMessage(methodName, defaultErrorMsg, context, func, args) {
    // Set default error message.
    var failMsg = defaultErrorMsg;
    if (context.req.douane.errorMessages && context.req.douane.errorMessages[methodName]) {
        failMsg = context.req.douane.errorMessages[methodName];
    }

    // If an additional (unexpected) parameter is added treat it as a custom error message.
    if (args.length > func.length - 1) {
        failMsg = args[args.length - 1];
    }

    context.finished = true;
    return context.req.douane.errorFormatter(context, failMsg, args);
}

/**
* Defines a new sanitation method.
*
* Sanitizers are added globally to the Validation prototype so make sure method names are unique. Sanitation methods
* with the same name are overridden.
*
* @param {String} methodName The name of the method.
* @param {Function} func The sanitation function.
* @return {null}
*/
Validation.prototype.setSanitizer = function(methodName, func) {
    Validation.prototype[methodName] = function() {
        var args = arguments; // Pass original arguments to validatorFunc later on
        this.contexts.forEach(function(context) {
            this._checks.push(function(done) {
                context.setter(context, func.apply(func, [context].concat(args)));
                return done();
            });
        }.bind(this));
        return this;
    };
};

module.exports = Douane;
module.exports.setValidator = Validation.prototype.setValidator;
module.exports.setAsyncValidator = Validation.prototype.setAsyncValidator;
module.exports.setSanitizer = Validation.prototype.setSanitizer;
