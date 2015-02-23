# controle

**Currently this library is in development, feel free to contribute**

This validation library is inspired by [express-validator](https://github.com/ctavan/express-validator) and adds the following features:

- Asynchronous validations.
- Default error messages can be overridden (e.g. internationalization).
- Error message format is fully customizable.
- Request array parameter can be validated.

## Example

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
app.use(douane.middleware()); // Douane's middleware should work for Express and Restify

// Add a validation method
Douane.setValidator('isMin', 'Should be minimum {0}', function(value, min) {
    return value >= min;
});

// You can define asynchronous validation rules the same way (usually business rules)
Douane.setValidator('isUniqueUserId', 'Must be unique', function(value) {
    return false;
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

    // The Validator runs all queued Validations in parallel
    req.validate(function(errors) {
        console.log(errors);
    });
 });
 ```

# Alternatives

- [Express-validator](https://github.com/ctavan/express-validator).
- [JSON Schema](http://json-schema.org/), for example [tv4](https://github.com/geraintluff/tv4).
- ... a million more, check [npm](https://www.npmjs.com).

## FAQ

**This library is heavily inspired by [express-validator](https://github.com/ctavan/express-validator), why not import changes in there?**

Several issues we were trying to solve have been open for a long time as tickets in the express-validator bug tracker. We looked into it but some of it required a severe overhaul of that library; it just seemed better to write an alternative given the breaking changes we wanted to introduce.

**Why is this library called Douane?**

Douane is the Dutch word for customs authority which seemed fitting (whilst discussing it over a glass of beer... input/output, checks... you get it?). Also, it's a funny word having so many vowels in it.

**Why use JavaScript rather than CoffeeScript, TypeScript, < whatever >...?**

JavaScript is broken (given the thousand attempt to build alternatives), but for a lot of work it works just fine. Here too.
