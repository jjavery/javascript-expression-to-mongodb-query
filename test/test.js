
var assert = require('assert');
var converter = require('../src/converter');

function stringify(obj) {
	return JSON.stringify(obj, null, '   ');
}

suite('converter', function () {

	setup(function () {
	});
	
	suite('.convert()', function () {
	
		test('equality', function () {
			var expected = stringify({ a: 1 });
			var actual = stringify(converter.convert('a == 1'));

			assert.equal(expected, actual);
		});
	
		test('inequality', function () {
			var expected = stringify({ a: { $ne: 1 } });
			var actual = stringify(converter.convert('a != 1'));

			assert.equal(expected, actual);
		});
	
		test('greater than', function () {
			var expected = stringify({ a: { $gt: 1 } });
			var actual = stringify(converter.convert('a > 1'));

			assert.equal(expected, actual);
		});
	
		test('less than', function () {
			var expected = stringify({ a: { $lt: 1 } });
			var actual = stringify(converter.convert('a < 1'));

			assert.equal(expected, actual);
		});
	
		test('greater than or equal', function () {
			var expected = stringify({ a: { $gte: 1 } });
			var actual = stringify(converter.convert('a >= 1'));

			assert.equal(expected, actual);
		});
	
		test('less than or equal', function () {
			var expected = stringify({ a: { $lte: 1 } });
			var actual = stringify(converter.convert('a <= 1'));

			assert.equal(expected, actual);
		});
		
		test('and', function () {
			var expected = stringify({ $and: [ { a: 1 }, { b: 1 } ] });
			var actual = stringify(converter.convert('a == 1 && b == 1'));

			assert.equal(expected, actual);
		});
	
		test('or', function () {
			var expected = stringify({ $or: [ { a: 1 }, { b: 1 } ] });
			var actual = stringify(converter.convert('a == 1 || b == 1'));

			assert.equal(expected, actual);
		});
		
		test('complex', function () {
			var expected = stringify({ $or: [ { a: { $gte: 1 } }, { $and: [ { b: { $ne: 1 } }, { c: { $lt: 1 } } ] } ] });
			var actual = stringify(converter.convert('a >= 1 || (b != 1 && c < 1)'));

			assert.equal(expected, actual);
		});
	});

});

