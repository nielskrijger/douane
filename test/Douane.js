'use strict';

var assert = require('chai').assert;
var async = require('async');
var util = require('util');
var request = require('supertest');
var Douane = require('../index');
var createApplication = require('./helpers/app').createApplication;

describe('Douane', function() {

    var app;

    beforeEach(function() {
        this.app = createApplication(new Douane());
    });

    it('should return nothing when everything validates', function(done) {
        this.app.post('/test', function(req, res) {
            req.checkBody('isNumeric').isNumeric();
            req.validate(function(err, results) { res.json(results); });
        });

        request(this.app).post('/test').send({
            isNumeric: '123'
        })
        .end(function(err, res) {
            assert.deepEqual(res.body, {});
            done();
        });
    });

    it('should return errors when validation fails', function(done) {
        this.app.post('/test', function(req, res) {
            req.checkBody('optional').optional().isNumeric();
            req.checkBody('array[].isNumeric').isNumeric();
            req.checkBody('array[].isBoolean').optional().isBoolean();
            req.checkBody('array[].isString').optional().isString();
            req.checkBody('array[].isNumber').optional().isNumber();
            req.checkBody('array[].isInt').required().isInt();
            req.checkBody('array[].isMin').notEmpty().isMin(10);
            req.checkBody('array[].isMax').optional().isMax(10);
            req.checkBody('array[].isArray').optional().isArray();
            req.checkBody('array[].isObject').optional().isObject();
            req.checkBody('array[].minLength').optional().minLength(4);
            req.checkBody('array[].maxLength').optional().maxLength(5);
            req.checkBody('array[].length').optional().length(3, 8);
            req.checkBody('array[].isEmail').optional().isEmail();
            req.checkBody('array').minElements(4);
            req.checkBody('array').maxElements(2);
            req.validate(function(err, results) { res.json(results); });
        });

        var arrayValue = [
            {
                isNumeric: '123',
                isBoolean: false,
                isString: 'string',
                isNumber: -3.61235,
                isInt: 2,
                isMin: 10,
                isMax: 10,
                isArray: ['test'],
                isObject: { test: 'test' },
                minLength: '1234',
                maxLength: '12345',
                length: '123',
                isEmail: 'test@example.org'
            },
            {
                isNumeric: 'invalid',
                isBoolean: 'false',
                isString: 123,
                isNumber: '1.0',
                isInt: 1.5,
                isMin: 9,
                isMax: 11,
                isArray: 'test',
                isObject: 'test',
                minLength: '123',
                maxLength: '123456',
                length: '12',
                isEmail: 'test@example'
            },
            {
                isNumeric: 'invalid',
                length: '123456789',
                isObject: ['Array is also an object'],
            }
        ];

        request(this.app).post('/test').send({
            array: arrayValue
        })
        .end(function(err, res) {
            assert.deepEqual(res.body, [
                { param: 'array[1].isNumeric', msg: 'Must be a numeric value', value: 'invalid' },
                { param: 'array[2].isNumeric', msg: 'Must be a numeric value', value: 'invalid' },
                { param: 'array[1].isBoolean', msg: 'Must be a boolean', value: 'false' },
                { param: 'array[1].isString', msg: 'Must be a string', value: 123 },
                { param: 'array[1].isNumber', msg: 'Must be a number', value: '1.0' },
                { param: 'array[2].isInt', msg: 'Is required' },
                { param: 'array[1].isInt', msg: 'Must be an integer', value: 1.5 },
                { param: 'array[2].isMin', msg: 'Cannot be empty' },
                { param: 'array[1].isMin', msg: 'Must be at least 10', value: 9 },
                { param: 'array[1].isMax', msg: 'Can\'t be more than 10', value: 11 },
                { param: 'array[1].isArray', msg: 'Must be an array', value: 'test' },
                { param: 'array[1].isObject', msg: 'Must be an object', value: 'test' },
                { param: 'array[1].minLength', msg: 'Must contain at least 4 characters', value: '123' },
                { param: 'array[1].maxLength', msg: 'Must contain no more than 5 characters', value: '123456' },
                { param: 'array[1].length', msg: 'Must be at least 3 and no more than 8 characters long', value: '12' },
                { param: 'array[2].length', msg: 'Must be at least 3 and no more than 8 characters long', value: '123456789' },
                { param: 'array[1].isEmail', msg: 'Valid email required', value: 'test@example' },
                { param: 'array', msg: 'Must contain at least 4 elements', value: arrayValue },
                { param: 'array', msg: 'Must contain no more than 2 elements', value: arrayValue }
            ]);
            done();
        });
    });

    it('should sanitize values', function(done) {
        this.app.post('/test', function(req, res) {
            req.checkBody('toUpper').toUpper();
            req.checkBody('array[].toLower').toLower();
            req.checkBody('array[].trim').trim();
            req.checkBody('array[].rtrim').trimRight();
            req.checkBody('array[].ltrim').trimLeft();
            req.checkBody('nested.toUpper').toUpper();
            req.checkBody('array[].toUpper').toUpper();
            req.checkBody('array[].nestedArray[].nested.toUpper').toUpper();
            req.validate(function(err, results) { res.json(req.body); });
        });

        request(this.app).post('/test').send({
            toUpper: 'uppercase',
            nested: {
                toUpper: 'uppercase'
            },
            array: [
                {
                    toUpper: 'uppercase',
                    toLower: 'LOWERCASE',
                    trim: '  trim  ',
                    ltrim: '  ltrim  ',
                    rtrim: '  rtrim  '
                },
                { toUpper: 'uppercase' },
                { unchanged: 'unchanged' },
                { nestedArray: [
                    { nested: { toUpper: 'uppercase' } }
                ]}
            ]
        })
        .end(function(err, res) {
            assert.deepEqual(res.body, {
                nested: {
                    toUpper: 'UPPERCASE'
                },
                array: [
                    {
                        toUpper: 'UPPERCASE' ,
                        toLower: 'lowercase',
                        trim: 'trim',
                        ltrim: 'ltrim  ',
                        rtrim: '  rtrim'
                    },
                    { toUpper: 'UPPERCASE' },
                    { unchanged: 'unchanged' },
                    { nestedArray: [
                        { nested: { toUpper: 'UPPERCASE' } }
                    ]}
                ],
                toUpper: 'UPPERCASE'
            });
            done();
        });
    });

    it('should allow result format and error handling customization', function(done) {
        var app = createApplication(new Douane({
            errorMessages: {
                isMin: 'isMin global override [0]'
            },
            resultFormatter: function(errors) {
                if (!errors || errors.length === 0) {
                    return null;
                }
                return { result: errors };
            },
            errorFormatter: function(ctx, msg, args) {
                for (var i = 0, max = args.length; i < max; i++) {
                    msg = msg.replace('[' + i + ']', args[i]);
                }
                return {
                    param: ctx.param,
                    msg: msg,
                    value: ctx.value
                };
            }
        }));
        app.post('/test', function(req, res) {
            req.checkBody('isMin').isMin(10);
            req.checkBody('isMin2').isMin(10, 'Double override [0]');
            req.validate(function(err, results) { res.json(results); });
        });

        request(app).post('/test').send({
            isMin: 5,
            isMin2: 6
        })
        .end(function(err, res) {
            assert.deepEqual(res.body, {
                result: [
                    { param: 'isMin', msg: 'isMin global override 10', value: 5 },
                    { param: 'isMin2', msg: 'Double override 10', value: 6 }
                ]
            });
            done();
        });
    });

    it('should allow asynchronous validation', function(done) {
        Douane.setAsyncValidator('timeout', 'Value must be "success", timeout after {0}', function(context, milliseconds, done) {
            setTimeout(function() {
                done(null, context.value == 'success');
            }, milliseconds);
        });

        this.app.post('/test', function(req, res) {
            req.checkBody('timeout').timeout(100);
            req.checkBody('timeout2').timeout(50);
            req.checkBody('array[].timeout').optional().timeout(80);
            req.validate(function(err, results) {
                assert(err === null);
                res.json(results);
            });
        });

        request(this.app).post('/test').send({
            timeout: 'fail',
            timeout2: 'success',
            array: [
                { timeout: 'fail' },
                { timeout: 'success' },
                {}
            ]
        })
        .end(function(err, res) {
            assert.deepEqual(res.body, [
                { param: 'timeout', msg: 'Value must be "success", timeout after 100', value: 'fail' },
                { param: 'array[0].timeout', msg: 'Value must be "success", timeout after 80', value: 'fail' }
            ]);
            done();
        });
    });

    it('should stop asynchronous validation immediately when a fatal error occurred', function(done) {
        Douane.setAsyncValidator('timeout', 'Value must be "success", timeout after {0}', function(context, milliseconds, done) {
            setTimeout(function() {
                done(context.value == 'error', context.value == 'success');
            }, milliseconds);
        });

        this.app.post('/test', function(req, res) {
            req.checkBody('array[].timeout').optional().timeout(80);
            req.validate(function(err, results) {
                res.json({
                    err: err,
                    results: results
                });
            });
        });

        request(this.app).post('/test').send({
            array: [
                { timeout: 'fail' },
                { timeout: 'error' },
                { timeout: 'success' }
            ]
        })
        .end(function(err, res) {
            assert.deepEqual(res.body, {
                err: true
            });
            done();
        });
    });
});
