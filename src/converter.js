
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
				case 'delete':	return this.del(node, this.visit(node[2]));
				case '++':		return this.inc(node, this.visit(node[2]));
				default:
					throw new SyntaxError('Unsupported unary prefix "' + node[1] + '".');
			}

		case 'array':        
			var elements = [];
			for (var i = 0, ilen = node[1].length; i < ilen; ++i) {
				elements.push(this.visit(node[1][i]));
			}
			return this.array(node, elements);

		case 'call':         
			var arguments = [];
			for (var i = 0, ilen = node[2].length; i < ilen; ++i) {
				arguments.push(this.visit(node[2][i]));
			}
			return this.call(node, this.visit(node[1][1]), node[1][2], arguments);
			
		case 'assign':
			return this.assign(node, node[1], this.visit(node[2]), this.visit(node[3]));
			
		case 'seq':
			return this.seq(node);

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

JavaScriptExpressionConverter.prototype.del = function (node, value) {
	throw new SyntaxError('Unsupported unary prefix "delete".');
};

JavaScriptExpressionConverter.prototype.inc = function (node, value) {
	throw new SyntaxError('Unsupported unary prefix "++".');
};

JavaScriptExpressionConverter.prototype.array = function (node, value) {
	throw new SyntaxError('Unsupported node type "array".');
};

JavaScriptExpressionConverter.prototype.call = function (node, name, method, arguments) {
	throw new SyntaxError('Unsupported node type "call".');
};

JavaScriptExpressionConverter.prototype.assign = function (node, operator, lvalue, rvalue) {
	throw new SyntaxError('Unsupported node type "assign".');
};

JavaScriptExpressionConverter.prototype.seq = function (node) {
	throw new SyntaxError('Unsupported node type "seq".');
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
var P_ONE = 1;
var P_TWO = 2;
var P_EXPR = 3;

JavaScriptExpressionToMongoDBQueryConverter.prototype.mongoDbMethods = {
	'all': [ '$all', P_ARRAY ],
	'elemMatch': [ '$elemMatch', P_EXPR ],
	'exists': [ '$exists', P_ONE ],
	'in': [ '$in', P_ARRAY ],
	'mod': [ '$mod', P_ARRAY ],
	'nin': [ '$nin', P_ARRAY ],
	'size': [ '$size', P_ONE ],
	'type': [ '$type', P_ONE ],
	'where': [ '$where', P_ONE ],
	'regex': [ '$regex', P_TWO ]
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.convert = function (expression) {
	var ast;
	if (typeof expression == 'string') {
		ast = parse(expression);
	}
	else {
		ast = expression;
	}
	var query = this.visit(ast);
	//console.log(query);
	return JSON.parse(query);
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

JavaScriptExpressionToMongoDBQueryConverter.prototype.not = function (node, name) {
	return '{ "' + name + '" : false }';
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.del = function (node, name) {
	return '{ "$unset": { "' + name + '": null } }';
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.inc = function (node, name) {
	return '{ "$inc": { "' + name + '": 1 } }';
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.binary = function (node, operator, lvalue, rvalue) {
	// Swap lvalue and rvalue if rvalue is a name or a dot.
	if (node[3][0] == 'name' || node[3][0] == 'dot') {
		var tvalue = lvalue;
		lvalue = rvalue;
		rvalue = tvalue;
	}

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
			var stack = [];
			var ands = [ node ];

			stack.push(lvalue);
			stack.push(rvalue);
			
			while (stack.length > 0) {
				var value = stack.pop();
				
				lvalue = value[2];
				rvalue = value[3];
		
				var lvalueType = lvalue[0];
				var rvalueType = rvalue[0];
				var lvalueOperator = lvalue[1];
				var rvalueOperator = rvalue[1];

				if (lvalueType == 'binary' && lvalueOperator == '&&') {
					ands.push(lvalue);
					stack.push(lvalue);
				}

				if (rvalueType == 'binary' && rvalueOperator == '&&') {
					ands.push(rvalue);
					stack.push(rvalue);
				}
			}
			
			var query = '{ ';

			var self = this;
			ands.forEach(function (value, i) {
				var lvalue = value[2];
				var rvalue = value[3];
				if (i > 0) { query += ', '; }
				l = self.visit(lvalue);
				r = self.visit(rvalue);
				query += l.substr(2, l.length - 4) + ', ' + r.substr(2, r.length - 4);
			});
			
			query += ' }';
			
			return query;
		case '$or':
			return '{ "' + mongoDbOperator + '": [ ' + lvalue + ', ' + rvalue + ' ] }';
	}
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.array = function (node, elements) {
	var query = '[ ';
	for (var i = 0, ilen = elements.length; i < ilen; ++i) {
		var element = elements[i];
		if (i > 0) { query += ', '; }
		query += element;
	}
	query += ' ]'
	return query;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.call = function (node, name, method, arguments) {
	var mongoDbMethod = this.mongoDbMethods[method];

	if (!mongoDbMethod) {
		var methods = '';
		for (var name in this.mongoDbMethods) {
			var paramType = this.mongoDbMethods[name][1];
			methods += name + '(';
			if (paramType == P_ARRAY) { methods += 'value, ...'; }
			else if (paramType == P_ONE) { methods += 'value'; }
			else if (paramType == P_TWO) { methods += 'value, value'; }
			else if (paramType == P_EXPR) { methods += 'expr'; }
			methods += ') ';
		} 
		throw new SyntaxError('Unsupported method "' + method + '()". Supported methods: ' + methods);
	}

	var methodName = mongoDbMethod[0];
	var paramType = mongoDbMethod[1];

	var query = '{ "' + name + '": { "' + methodName + '": ';
	
	if (paramType == P_ARRAY) {
		query += '[ ';

		for (var i = 0, ilen = arguments.length; i < ilen; ++i) {
			var argument = arguments[i];
			if (i > 0) { query += ', '; }
			query += argument;
		}

		query += ']';
	}
	else if (arguments.length > 0) {
		query += arguments[0];
		if (methodName == '$regex' && arguments.length > 1) {
			query += ', "$options": ' + arguments[1];
		}
	}
	else if (methodName == '$exists') {
		query += 'true';
	}

	query += ' } }';

	return query;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.assign = function (node, operator, lvalue, rvalue) {
	switch (operator) {
		case true:
			return '{ "$set": { "' + lvalue + '": ' + rvalue + ' } }';
		case '+':
			return '{ "$inc": { "' + lvalue + '": ' + rvalue + ' } }';
		default:
			throw new SyntaxError('Unsupported assignment operator "' + operator + '".');
	}
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.assignMultiple = function (nodes) {
	var query = '"$set": { ';
	
	for (var i = 0, ilen = nodes.length; i < ilen; ++i) {
		var node = nodes[i];
		var lvalue = this.visit(node[2]);
		var rvalue = this.visit(node[3]);
		if (i > 0) { query += ', '; }
		query += '"' + lvalue + '": ' + rvalue;
	}
	
	query += ' }';
	
	return query;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.delMultiple = function (nodes) {
	var query = '"$unset": { ';
	
	for (var i = 0, ilen = nodes.length; i < ilen; ++i) {
		var node = nodes[i];
		var value = this.visit(node[2]);
		if (i > 0) { query += ', '; }
		query += '"' + value + '": null';
	}
	
	query += ' }';
	
	return query;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.incMultiple = function (nodes) {
	var query = '"$inc": { ';
	
	for (var i = 0, ilen = nodes.length; i < ilen; ++i) {
		var node = nodes[i];
		var lvalue = this.visit(node[2]);
		var rvalue = 1;
		if (node[3]) { rvalue = this.visit(node[3]); }
		if (i > 0) { query += ', '; }
		query += '"' + lvalue + '": ' + rvalue;
	}
	
	query += ' }';
	
	return query;
};

JavaScriptExpressionToMongoDBQueryConverter.prototype.seq = function (node) {
	var map = {};
	var stack = [];
	stack.push(node);
	
	while (stack.length > 0) {
		var currentNode = stack.pop();

		var lvalue = currentNode[1];
		var rvalue = currentNode[2];

		var lvalueType = lvalue[0];
		var rvalueType = rvalue[0];

		switch (lvalueType) {
			case 'seq':
				stack.push(lvalue);
				break;
				
			case 'unary-prefix':
				if (lvalue[1] == 'delete') { lvalueType = 'del'; }
				else if (lvalue[1] == '++') { lvalueType = 'inc'; }
				else { throw new SyntaxError('Unary prefix "' + lvalue[1] + '" unsupported in sequence.'); }
				
			case 'assign':
				if (lvalue[1] == '+') { lvalueType = 'inc'; }

			default:
				if (!map[lvalueType]) { map[lvalueType] = []; }
				map[lvalueType].push(lvalue);
				break;
		}		

		switch (rvalueType) {
			case 'seq':
				stack.push(rvalue);
				break;

			case 'unary-prefix':
				if (rvalue[1] == 'delete') { rvalueType = 'del'; }
				else if (rvalue[1] == '++') { rvalueType = 'inc'; }
				else { throw new SyntaxError('Unary prefix "' + rvalue[1] + '" unsupported in sequence.'); }

			case 'assign':
				if (rvalue[1] == '+') { rvalueType = 'inc'; }

			default:
				if (!map[rvalueType]) { map[rvalueType] = []; }
				map[rvalueType].push(rvalue);
				break;
		}		
	}

	var query = '{ ';
	
	var first = true;
	
	for (var name in map) {
		var nodes = map[name];
		switch (name) {
			case 'assign':
				if (!first) { query += ', ' } else { first = false; }
				query += this.assignMultiple(nodes);
				break;
			case 'del':
				if (!first) { query += ', ' } else { first = false; }
				query += this.delMultiple(nodes);
				break;
			case 'inc':
				if (!first) { query += ', ' } else { first = false; }
				query += this.incMultiple(nodes);
				break;
			default:
				throw new SyntaxError('Node type "' + type + '" unsupported in sequence.');
		}
	}
	 
	query += ' }';

	return query;
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
