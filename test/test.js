
var assert = require('assert');
var converter = require('../src/converter');

function s(obj) {
	return JSON.stringify(obj, null, '   ');
}

suite('converter', function () {

	setup(function () {
	});
	
	suite('.convert()', function () {
	
		test('equality', function () {
			var expected = { a: 1 };
			var actual = converter.convert('a == 1');

			assert.equal(s(expected), s(actual));
		});
	
		test('equality lvalue', function () {
			var expected = { a: 1 };
			var actual = converter.convert('1 == a');

			assert.equal(s(expected), s(actual));
		});
	
		test('equality lvalue dot', function () {
			var expected = { 'a.b': 1 };
			var actual = converter.convert('1 == a.b');

			assert.equal(s(expected), s(actual));
		});
	
		test('inequality', function () {
			var expected = { a: { $ne: 1 } };
			var actual = converter.convert('a != 1');

			assert.equal(s(expected), s(actual));
		});
	
		test('negative integer', function () {
			var expected = { a: -1 };
			var actual = converter.convert('a == -1');

			assert.equal(s(expected), s(actual));
		});
	
		test('greater than', function () {
			var expected = { a: { $gt: 1 } };
			var actual = converter.convert('a > 1');

			assert.equal(s(expected), s(actual));
		});
	
		test('less than', function () {
			var expected = { a: { $lt: 1 } };
			var actual = converter.convert('a < 1');

			assert.equal(s(expected), s(actual));
		});
	
		test('greater than or equal', function () {
			var expected = { a: { $gte: 1 } };
			var actual = converter.convert('a >= 1');

			assert.equal(s(expected), s(actual));
		});
	
		test('less than or equal', function () {
			var expected = { a: { $lte: 1 } };
			var actual = converter.convert('a <= 1');

			assert.equal(s(expected), s(actual));
		});
		
		test('AND', function () {
			var expected = { a: 1, b: 1, c: 1 };
			var actual = converter.convert('a == 1 && b == 1 && c == 1');
			
			assert.equal(s(expected), s(actual));
		});
	
		test('AND on same field', function () {
			var expected = { $and: [ { a: { $gte: 1 } }, { a: { $lte: 2 } } ] };
			var actual = converter.convert('a >= 1 && a <= 2');
			
			assert.equal(s(expected), s(actual));
		});

		test('OR', function () {
			var expected = { $or: [ { a: 1 }, { b: 1 } ] };
			var actual = converter.convert('a == 1 || b == 1');

			assert.equal(s(expected), s(actual));
		});
		
		test('NOT', function () {
			var expected = { a: false };
			var actual = converter.convert('!a');

			assert.equal(s(expected), s(actual));
		});
		
		test('complex', function () {
			var expected = { $or: [ { a: { $gte: 1 } }, { b: { $ne: 1 }, c: { $lt: 1 }, d: { $gte: 1 } } ] };
			var actual = converter.convert('a >= 1 || (b != 1 && c < 1 && d >= 1)');

			assert.equal(s(expected), s(actual));
		});

		test('assignment', function () {
			var expected = { $set: { a: 1 } };
			var actual = converter.convert('a = 1');

			assert.equal(s(expected), s(actual));
		});

		test('assignment sequence', function () {
			var expected = { $set: { a: 1, b: 2, c: 3 } };
			var actual = converter.convert('a = 1, b = 2, c = 3');

			assert.equal(s(expected), s(actual));
		});

		test('delete', function () {
			var expected = { $unset: { a: null } };
			var actual = converter.convert('delete a');

			assert.equal(s(expected), s(actual));
		});

		test('delete sequence', function () {
			var expected = { $unset: { a: null, b: null, c: null } };
			var actual = converter.convert('delete a, delete b, delete c');

			assert.equal(s(expected), s(actual));
		});

		test('increment', function () {
			var expected = { $inc: { a: 1 } };
			var actual = converter.convert('++a');

			assert.equal(s(expected), s(actual));
		});

		test('increment sequence', function () {
			var expected = { $inc: { a: 1, b: 1, c: 1 } };
			var actual = converter.convert('++a, ++b, ++c');

			assert.equal(s(expected), s(actual));
		});

		test('augmented assignment', function () {
			var expected = { $inc: { a: 2 } };
			var actual = converter.convert('a += 2');

			assert.equal(s(expected), s(actual));
		});

		test('augmented assignment sequence', function () {
			var expected = { $inc: { a: 2, b: 2, c: 2 } };
			var actual = converter.convert('a += 2, b += 2, c += 2');

			assert.equal(s(expected), s(actual));
		});

		test('mixed sequence', function () {
			var expected = { $set: { a: 1 }, $unset: { b: null }, $inc: { c: 1, d: 2 } };
			var actual = converter.convert('a = 1, delete b, ++c, d += 2');

			assert.equal(s(expected), s(actual));
		});
		
		test('all', function () {
			var expected = { a: { $all: [ 1, 2, 3 ] } };
			var actual = converter.convert('a.all(1, 2, 3)');

			assert.equal(s(expected), s(actual));
		});

		test('elemMatch', function () {
			var expected = { a: { $elemMatch: { b: 1 } } };
			var actual = converter.convert('a.elemMatch(b == 1)');

			assert.equal(s(expected), s(actual));
		});

		test('exists', function () {
			var expected = { a: { $exists: true } };
			var actual = converter.convert('a.exists()');

			assert.equal(s(expected), s(actual));
		});

		test('in', function () {
			var expected = { a: { $in: [ 1, 2, 3 ] } };
			var actual = converter.convert('a.in(1, 2, 3)');

			assert.equal(s(expected), s(actual));
		});

		test('mod', function () {
			var expected = { a: { $mod: [ 1, 0 ] } };
			var actual = converter.convert('a.mod(1, 0)');

			assert.equal(s(expected), s(actual));
		});

		test('nin', function () {
			var expected = { a: { $nin: [ 1, 2, 3 ] } };
			var actual = converter.convert('a.nin(1, 2, 3)');

			assert.equal(s(expected), s(actual));
		});

		test('size', function () {
			var expected = { a: { $size: 1 } };
			var actual = converter.convert('a.size(1)');

			assert.equal(s(expected), s(actual));
		});

		test('type', function () {
			var expected = { a: { $type: 1 } };
			var actual = converter.convert('a.type(1)');

			assert.equal(s(expected), s(actual));
		});

		test('where', function () {
			var expected = { a: { $where: 'this.a == 1' } };
			var actual = converter.convert('a.where("this.a == 1")');

			assert.equal(s(expected), s(actual));
		});

		test('regex', function () {
			var expected = { a: { $regex: 'b', $options: 'i' } };
			var actual = converter.convert('a.regex("b", "i")');

			assert.equal(s(expected), s(actual));
		});

	});

});

