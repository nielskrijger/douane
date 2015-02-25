# Douane

[![Build Status](https://travis-ci.org/nielskrijger/douane.svg?branch=master)](https://travis-ci.org/nielskrijger/douane) [![Coverage Status](https://coveralls.io/repos/nielskrijger/douane/badge.svg?branch=master)](https://coveralls.io/r/nielskrijger/douane?branch=master)

This validation library is inspired by [express-validator](https://github.com/ctavan/express-validator) and has the following features:

- Synchronous and asynchronous validations.
- Default error messages can be overridden (e.g. internationalization).
- Error message format is fully customizable.
- Array elements can be validated.

## Usage

```javascript
var Douane = require('douane');
var express = require('express');
var bodyParser = require('body-parser');

var douane = new Douane();

var app = express();
app.use(bodyParser.json());
app.use(douane.middleware()); // Douane's middleware works for Express and Restify

app.post('/', function(req, res, next) {
    // A validation sequence like the one below stops at the first check that fails.
    req.checkBody('id')
        .optional() // Uses default error message
        .isInt('This is a custom error message') // Use custom error message
        .isMin(0) // Some validators require one or more arguments
        .isMax(10, 'Should be no more than {0}') // The last value is used as error message
        .isUniqueUserId(); // A custom asynchronous validator

    // Multiple validations are evaluated in parallel
    req.checkBody('array')
        .required()
        .minElements(1);

    // Validate objects elements in an array with the postfix '[]'
    req.checkBody('array[].email')
        .required()
        .isEmail();

    // Callback accepts two arguments, the first contains non-validation errors and the second an array of validation errors.
    req.validate(function(err, result) {
        console.log(result);
        res.json(result);
    });
});

app.listen(3000);

 ```

## Installation

```
npm install --save douane
```

## Test & lint

Requires [gulp](http://gulpjs.com/).

```
gulp build
```
or without lint:
```
gulp test
```

## Available sanitizers & validators

Validators:

* **optional**: won't validate further if value is null or undefined without throwing an error.
* **required**: fails if value is null or undefined.
* **notEmpty**: fails if value is null, undefined, '', {} or [].
* **isNumeric**: value must be a string containing a numeric value.
* **isString**: value must be a string.
* **isBoolean**: value must be a boolean.
* **isNumber**: value must be a number.
* **isInt**: value must be a whole number.
* **isMin(min)**: value must be at least specified minimum number.
* **isMax(max)**: value must be more than specified maximum number.
* **isArray**: value must be an array.
* **isObject**: value must be an object. Note JavaScript arrays are objects, while strings and numbers are not.
* **minLength(minLength)**: value must be a string with at least the specified number of characters.
* **maxLength(maxLength)**: value must be a string with at most specified number of characters.
* **length(minLength, maxLength)**: value must be a string with at least the minimum and at most the specified maximum number of characters.
* **isEmail**: value must be a valid email.
* **minElements(minElements)**: value must be an array with at least specified number of elements.
* **maxElements(maxElements)**: value must be an array with no more than specified maximum number of elements.

Sanitizers:

* **toUpper**: convert string to uppercase.
* **toLower**: convert string to lowercase.
* **trim**: removes whitespace from both ends of a string. Whitespace is all whitespace characters (space, tab, etc.) and line terminators.
* **trimRight**: removes whitespace from the right end of the string.
* **trimLeft**: removes whitespace from the left end of the string.


## Custom validator

Validators are defined globally so make sure their names are unique.

Define a validator like this:

```javascript
Douane.setValidator('hasMinCommas', 'Should contain at least {0} commas', function(context, min) {
    return (context.value) ? context.value.match(/,/g).length >= min : false;
});
```

The context object contains the following properties:

```
{
	req: <object>, // The request object
    setter: <function>, // Retrieves the parameter root object
    param: <string>, // The locator string relative to setter root
    finished: <boolean>, // When true any subsequent checks are skipped
    value: <value> // The value being validated
}
```

Defining an asynchronous validator is similar to a synchronous validator except the return value should be passed to a callback function. The first callback argument should contain non-validation errors (e.g. a database error), the second callback argument should return a boolean.

```javascript
Douane.setAsyncValidator('asyncTest', 'Value must be "success", timeout in {0}', function(context, milliseconds, done) {
    setTimeout(function() {
        done(null, context.value == 'success');
    }, milliseconds);
});
```

**Tips:**

* If the context value is an incorrect type, null or undefined you should fail the validation. If you need optional parameters use `.optional()` as the first validation check.
* Any validator argument is always mandatory because the final (optional) argument is interpreted as an error message override.

## Custom sanitizer

Sanitizers work much the same way as validators except they return a new value:

```javascript
Douane.setSanitizer('toUpper', function(context) {
    return (context.value && _.isString(context.value)) ? context.value.toUpperCase() : context.value;
});
```

Here too be aware the context value may be empty or an incorrect type in which case you should return `null`.


**Tips:**

* If the context value is an incorrect type, null or undefined you should return the original value. Changing the value to `null` or something else may break validators or sanitizers further down the validation chain.

## Options

Available options are:

```javascript

// Override the default error messages, error formatter and result formatter if you want to
var douane = new Douane({

	// Override default error message
    errorMessages: {
		isString: 'Must be a string',
		isArray: 'Must be an array'
	},

	// Change error format
	errorFormatter: function(context, msg, args) {
   		for (var i = 0, max = args.length; i < max; i++) {
        	msg = msg.replace('{' + i + '}', args[i]);
    	}
   		return {
        	param: context.param,
        	msg: msg,
        	value: context.value
    	};
	},

	// Change final output
	resultFormatter: function(errors) {
    	if (!errors || errors.length === 0) {
        	return null;
    	}
    	return errors;
	}
});
```

# FAQ

**This library is inspired by [express-validator](https://github.com/ctavan/express-validator), why not use that?**

This library offers three features that you might find interesting; 1) beter control over error messages and formatting, 2) asynchronous validation and 3) array parameter validation.

**Why is this library called Douane?**

All other proper names were already taken. Douane is the Dutch word for customs authority which seemed somewhat fitting (input/output, checks...). If nothing else it is a funny word :-)

**Why use JavaScript rather than CoffeeScript, TypeScript, < whatever >...?**

JavaScript is broken (given the thousand attempts to build alternatives), but for a lot of work it works just fine. Here too.
