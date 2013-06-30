
var uglify = require('uglify-js');

var JavaScriptExpressionConverter = function () {};

JavaScriptExpressionConverter.prototype.visit = function (node) {
	var type = node[0];
	switch (type) {
		case 'toplevel':     return this.toplevel(node, this.visit(node[1][0]));
		case 'stat':         return this.stat(node, this.visit(node[1]));
		case 'string':       return this.string(node, node[1]);
		case 'num':          return this.num(node, node[1]);
		case 'name':         return this.name(node, node[1]);
		case 'dot':          return this.dot(node, this.visit(node[1]), node[2]);

		case 'binary':
			return this.binary(node, node[1], this.visit(node[2]), this.visit(node[3]));

		case 'unary-prefix': 
			switch (node[1])
			{
				case '-':      return this.neg(node, this.visit(node[2]));
				case '!':      return this.not(node, this.visit(node[2]));
				default:
					throw new SyntaxError('Unsupported unary prefix "' + node[1] + '".');
			}

		case 'array':        
			var elements = [];
			for (var i = 0, len = node[1].length; i < len; ++i) {
				elements.push(this.visit(node[1][i]));
			}
			return this.array(node, elements);

		case 'call':         
			var arguments = [];
			for (var i = 0, len = node[2].length; i < len; ++i) {
				arguments.push(this.visit(node[2][i]));
			}
			return this.call(node, this.visit(node[1][1]), node[1][2], arguments);

		default:
			throw new SyntaxError('Unsupported node type "' + type + '".');
	}
};

JavaScriptExpressionConverter.prototype.toplevel = function (node, value) {
	return value;
};

JavaScriptExpressionConverter.prototype.stat = function (node, value) {
	return value;
};

JavaScriptExpressionConverter.prototype.string = function (node, value) {
	throw new SyntaxError('Unsupported node type "string".');
};

JavaScriptExpressionConverter.prototype.num = function (node, value) {
	throw new SyntaxError('Unsupported node type "num".');
};

JavaScriptExpressionConverter.prototype.name = function (node, value) {
	throw new SyntaxError('Unsupported node type "name".');
};

JavaScriptExpressionConverter.prototype.dot = function (node, lvalue, rvalue) {
	throw new SyntaxError('Unsupported node type "dot".');
};

JavaScriptExpressionConverter.prototype.binary = function (node, operator, lvalue, rvalue) {
	throw new SyntaxError('Unsupported node type "binary".');
};

JavaScriptExpressionConverter.prototype.neg = function (node, value) {
	throw new SyntaxError('Unsupported unary prefix "-".');
};

JavaScriptExpressionConverter.prototype.not = function (node, value) {
	throw new SyntaxError('Unsupported unary prefix "!".');
};

JavaScriptExpressionConverter.prototype.array = function (node, value) {
	throw new SyntaxError('Unsupported node type "array".');
};

JavaScriptExpressionConverter.prototype.call = function (node, name, method, arguments) {
	throw new SyntaxError('Unsupported node type "call".');
};

var JavaScriptExpressionToMongoDBQueryConverter = function () {};

JavaScriptExpressionToMongoDBQueryConverter.prototype = new JavaScriptExpressionConverter();

JavaScriptExpressionToMongoDBQueryConverter.prototype.mongoDbOperators = {
	'&&': '$and',
	'||': '$or',
	'==': '$eq',
	'!=': '$ne',
	'>=': '$gte',
	'<=': '$lte',
	'>': '$gt',
	'<': '$lt',
	'+': false,
	'-': false,
	'*': false,
	'/': false,
	'%': false
};

var P_ARRAY = 0;
var P_SINGLE = 1;
var P_EXPR = 2;

JavaScriptExpressionToMongoDBQueryConverter.prototype.mongoDbMethods = {
	'all': [ '$all', P_ARRAY ],
	'elemMatch': [ '$elemMatch', P_EXPR ],
	'exists': [ '$exists', P_SINGLE ],
	'in': [ '$in', P_ARRAY ],
	'mod': [ '$mod', P_ARRAY ],
	'nin': [ '$nin', P_ARRAY ],
	'size': [ '$size', P_SINGLE ],
	'type': [ '$type', P_SINGLE ],
	'where': [ '$where', P_SINGLE ]
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.convert = function (expression) {
	var ast;
	if (typeof expression == 'string') {
		ast = parse(expression);
	}
	else {
		ast = expression;
	}
	return JSON.parse(this.visit(ast));
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.string = function (node, string) {
	return '"' + string + '"';
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.num = function (node, num) {
	return num;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.name = function (node, name) {
	return name;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.dot = function (node, lvalue, rvalue) {
	return lvalue + '.' + rvalue;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.neg = function (node, value) {
	return '-' + value;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.not = function (node, value) {
	throw new SyntaxError('Unsupported unary prefix "!".');
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.binary = function (node, operator, lvalue, rvalue) {
	var mongoDbOperator = this.mongoDbOperators[operator];
	
	if (!mongoDbOperator) {
		var operators = '';
		for (var name in this.mongoDbOperators) { if (this.mongoDbOperators.hasOwnProperty(name)) {
			if (!this.mongoDbOperators[name]) { continue; }
			operators += name + ' ';
		} }
		throw new SyntaxError('Unsupported operator "' + operator + '". Supported operators: ' + operators);
	}
	
	switch (mongoDbOperator) {
		case '$eq':
			return '{ "' + lvalue + '": ' + rvalue + ' }';
		case '$ne':
		case '$gt':
		case '$lt':
		case '$gte':
		case '$lte':
			return '{ "' + lvalue + '": { "' + mongoDbOperator + '": ' + rvalue + ' } }';
		case '$and':
		case '$or':
			return '{ "' + mongoDbOperator + '": [ ' + lvalue + ', ' + rvalue + ' ] }';
	}
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.array = function (node, elements) {
		var value = '[ ';
		for (var i = 0, len = elements.length; i < len; ++i) {
			var element = elements[i];
			if (i > 0) { value += ', '; }
			value += value;
		}
		value += ' ]'
		return value;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.call = function (node, name, method, arguments) {
	var value = '';
	var mongoDbMethod = this.mongoDbMethods[method];

	if (!mongoDbMethod) {
		var methods = '';
		for (var name in this.mongoDbMethods) { if (this.mongoDbMethods.hasOwnProperty(name)) {
			var paramType = this.mongoDbMethods[name][1];
			methods += name + '(';
			if (paramType == P_ARRAY) { methods += 'value, …'; }
			else if (paramType == P_SINGLE) { methods += 'value'; }
			else if (paramType == P_EXPR) { methods += 'expr'; }
			methods += ') ';
		} } 
		throw new SyntaxError('Unsupported method "' + method + '()". Supported methods: ' + methods);
	}

	var methodName = mongoDbMethod[0];
	var paramType = mongoDbMethod[1];

	value = '';
	value += '{ ';
	value += '"' + name + '": { "' + methodName + '": ';
	
	if (paramType == P_ARRAY) {
		value += '[ ';

		for (var i = 0, len = arguments.length; i < len; ++i) {
			var argument = arguments[i];
			if (i > 0) { value += ', '; }
			value += argument;
		}

		value += ']';
	}
	else if (arguments.length > 0) {
		value += arguments[0];
	}
	else if (methodName == '$exists') {
		value += 'true';
	}

	value += ' }';
	value += ' }';

	return value;
};

function parse(expression) {
	var parser = uglify.parser;
	if (typeof expression != 'string') { throw new Error('Expression must be a string.'); }
		 
	try {
		var ast = parser.parse.apply(null, [ expression ]);
	}
	catch (err) {
		if (err.message === undefined
			|| err.line === undefined
			|| err.col === undefined
			|| err.pos === undefined
		) { throw err }
		
		var e = new SyntaxError(err.message
			+ '\n	 at line ' + err.line + ':' + err.col + ' in expression:\n\n'
			+ '  ' + expression.split(/\r?\n/)[err.line]
		);
		
		e.original = err;
		e.line = err.line;
		e.col = err.col;
		e.pos = err.pos;
		throw e;
	}
	return ast;	
};

var converter;

function convert(expression) {
	if (!converter) {
		converter = new JavaScriptExpressionToMongoDBQueryConverter();
	}
	return converter.convert(expression);
}

exports.parse = parse;
exports.convert = convert;
exports.JavaScriptExpressionConverter = JavaScriptExpressionConverter;
exports.JavaScriptExpressionToMongoDBQueryConverter = JavaScriptExpressionToMongoDBQueryConverter;
