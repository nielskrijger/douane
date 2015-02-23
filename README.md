# Douane

[![Build Status via Travis CI](https://travis-ci.org/nielskrijger/douane.png?branch=master)](https://travis-ci.org/nielskrijger/douane)

**This library is still being developed and while release version number is > 0.0 backwards-incompatible changes may be introduced for each release. You should not specify "~0.0.x" or something similar in your package.json, use "0.0.X" instead.**

This validation library is inspired by [express-validator](https://github.com/ctavan/express-validator) and adds the following features:

- Asynchronous validations.
- Default error messages can be overridden (e.g. internationalization).
- Error message format is fully customizable.
- Array parameters can be validated.

## Usage

```
var Douane = require('Douane');

// Override the default error messages, error formatter and result formatter if you want to
var douane = new Douane({
    errorFormatter: errorFormatter(ctx, msg, args) { ... },
    resultFormatter: resultFormatter(errors) { ... },
    errorMessages: { isString: 'Override default error message' }
});

var app = express();
app.use(bodyParser);
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

app.post('/:url', function(req, res, next) {
    // This Validation contains multiple checks that are evaluated sequentially, stopping at the first one that fails.
    req.checkBody('id')
        .isRequired() // uses default error message
        .isInt('isRequired') // use custom error message
        .isMin(0) // some validators may expect one or more arguments
        .isMax(10, 'Should be no more than {0}') // the last value is used as error message
        .isUniqueUserId(); // A custom asynchronous function

    // Define as many validations on as many properties as you want, including arrays!
    req.checkBody('array[].name')
         .isRequired()
         .isString();

    // Validate callback return serious (say database) errors in first argument, normal validation errors in second arg
	// Second argument
    req.validate(function(err, validationErrors) {
        console.log(validationErrors);
    });
 });
 ```

# Custom validators

Define a synchronous validator like this:

```
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

Defining an asynchronous validator is similar to a synchronous except the return value should be passed in a callback. The first callback argument can be used for non-validation errors (e.g. database error), the second callback argument should return a boolean.

```
Douane.setAsyncValidator('asyncTest', 'Must be unique', function(context, milliseconds, done) {
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
