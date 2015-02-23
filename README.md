# Douane

[![Build Status](https://travis-ci.org/nielskrijger/douane.svg?branch=master)](https://travis-ci.org/nielskrijger/douane) [![Coverage Status](https://coveralls.io/repos/nielskrijger/douane/badge.svg?branch=master)](https://coveralls.io/r/nielskrijger/douane?branch=master)

This validation library is inspired by [express-validator](https://github.com/ctavan/express-validator) and adds the following features:

- Asynchronous validations.
- Default error messages can be overridden (e.g. internationalization).
- Error message format is fully customizable.
- Array elements can be validated.

## Usage

```javascript
var Douane = require('douane');
var express = require('express');
var bodyParser = require('body-parser');

// Override the default error messages, error formatter and result formatter if you want to
var douane = new Douane({
    errorMessages: { isString: 'Override default error message' }
});

var app = express();
app.use(bodyParser.json());
app.use(douane.middleware()); // Douane's middleware works for Express and Restify

// Define a custom validation method
Douane.setValidator('hasMinCommas', 'Should contain at least {0} commas', function(context, min) {
    return (context.value) ? value.match(/,/g).length >= min : false;
});

// Define asynchronous validation
Douane.setAsyncValidator('isUniqueUserId', 'Must be unique', function(context, done) {
    setTimeout(function() {
        done(null, context.value == 'success');
    }, 100);
});

app.post('/', function(req, res, next) {
    // A validation sequence like the one below stops at the first check that fails.
    req.checkBody('id')
        .required() // Uses default error message
        .isInt('This is a custom error message') // Use custom error message
        .isMin(0) // Some validators may expect one or more arguments
        .isMax(10, 'Should be no more than {0}') // The last value is used as error message
        .isUniqueUserId(); // A custom asynchronous function

    // Multiple validations are evaluated in parallel
    req.checkBody('array')
        .minElements(1);

    // Validate objects elements in an array with the postfix '[]'
    req.checkBody('array[].name')
        .required()
        .isString();

    // Callback accepts two arguments, the first contains non-validation errors and the second an array of validation errors.
    req.validate(function(err, validationErrors) {
        console.log(validationErrors);
        res.json(validationErrors);
    });
});

app.listen(3000);

 ```

# Custom validators

Define a synchronous validator like this:

```javascript
Douane.setValidator('hasMinCommas', 'Should contain at least {0} commas', function(context, min) {
    return (context.value) ? value.match(/,/g).length >= min : false;
});
```

The context object contains the following properties:

```
{
	req: <object>, // The request object
    setter: <function>, // Retrieves the parameter root object
    param: <string>, // The locator string relative to setter root
    finished: <boolean>, // When setting this to true any subsequent checks are skipped
    value: <value> // The value being validated
}
```

Defining an asynchronous validator is similar to a synchronous except the return value should be passed to a callback function. The first callback argument should contain non-validation errors (e.g. a database error), the second callback argument should return a boolean.

```javascript
Douane.setAsyncValidator('asyncTest', 'Value must be "success", timeout in {0}', function(context, milliseconds, done) {
    setTimeout(function() {
        done(null, context.value == 'success');
    }, milliseconds);
});
```


# FAQ

**This library is inspired by [express-validator](https://github.com/ctavan/express-validator), why not use that?**

This library offers three features that you might find interesting; 1) beter control over error messages and formatting, 2) asynchronous validation and 3) array parameter validation.

**Why is this library called Douane?**

All other proper names were already taken. Douane is the Dutch word for customs authority which seemed fitting (input/output, checks... you get it?). Also, it's a funny word having so many vowels in it.

**Why use JavaScript rather than CoffeeScript, TypeScript, < whatever >...?**

JavaScript is broken (given the thousand attempt to build alternatives), but for a lot of work it works just fine. Here too.toms authority which seemed fitting (whilst discussing it over a glass of beer... input/output, checks... you get it?). Also, it's a funny word having so many vowels in it.

**Why use JavaScript rather than CoffeeScript, TypeScript, < whatever >...?**

JavaScript is broken (given the thousand attempt to build alternatives), but for a lot of work it works just fine. Here too.
