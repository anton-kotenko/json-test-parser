var trace = function (parser, msg) {
  console.log(msg, parser._string, parser._position);
};
var attachTraser = function (cls) {
  var tracedCls = function () {
    return cls.apply(this, arguments);
  };

  tracedCls.prototype = Object.keys(cls.prototype).reduce(function (newPrototype, propName) {
    if (cls.prototype[propName] instanceof Function) {
      newPrototype[propName] = function () {
        var result;
        trace(this, propName);
        result = cls.prototype[propName].apply(this, arguments);
        trace(this, propName + ' exit');
        return result;
      }
    } else {
      newPrototype[propName] = cls.prototype[propName];
    }
    
    return newPrototype;
  }, {});
  return tracedCls;
};

var Util = require('util');
var ParseError = function (parser, expectation) {
  var message = "ParseError at " + parser._position + " expectations " + expectation;
  Error.call(this, message);
};
Util.inherits(ParseError, Error);

var SymbolTraits = {
  _NUMBERS_INDEX: function () {
    var index = {};
    for (var i = 0; i < 10; i++) {
      index[i] = true; 
    } 
    return index;
  }(),

  _WHITESPACE_INDEX: {
    " ": true,
    "\t": true,
    "\n" : true
  },
  
  isNumber: function (symbol) {
    return this._NUMBERS_INDEX[symbol]
  },

  isWhiteSpace: function (symbol) {
    return this._WHITESPACE_INDEX[symbol]; 
  }

};

var JSONParser = function (string) {
  this._string = string;
  this._position = 0;
  this._length = string.length;
};

JSONParser.prototype = {
  _TOKENS: {
    OBJECT_OPEN: '{',
    OBJECT_CLOSE: '}',
    ARRAY_OPEN: '[',
    ARRAY_CLOSE: ']',
    QUOTE: '"',
    NULL: 'null',
    FALSE: 'false',
    TRUE: 'true',
    COLUMN: ':',
    COMA: ',',
    BACKSLASH: '\\',
    MINUS: '-',
    DOT: '.'
  },

  parse: function () {
    var value = this._parse(); 
    //it's allowed to skip whitespaces at the end of the json
    this._skipWhiteSpace();
    if (this._position !== this._length) {
      throw new ParseError(this, "end of stirng to parse");
    }
    return value;
  },

  _parse: function () {
    while(this._position <= this._length) {
      if (this._lookAheadForToken(this._TOKENS.OBJECT_OPEN)) {
        return this._consumeObject();
      } else if (this._lookAheadForToken(this._TOKENS.ARRAY_OPEN)) {
        return this._consumeArray();
      } else if (this._lookAheadForToken(this._TOKENS.QUOTE)) {
        return this._consumeString();
      } else if (this._lookAheadForToken(this._TOKENS.NULL)) {
        this._consumeToken(this._TOKENS.NULL);
        return null;
      } else if (this._lookAheadForToken(this._TOKENS.TRUE)) {
        this._consumeToken(this._TOKENS.TRUE);
        return true; 
      } else if (this._lookAheadForToken(this._TOKENS.FALSE)) {
        this._consumeToken(this._TOKENS.FALSE);
        return false;
      } else if (this._lookAheadForNumber()) {
        return this._consumeNumber(); 
      } else {
        throw new ParseError(this, "null/true/false/number");
      }
    }
  },

  _consumeObject: function () {
    var key,
      result = {};

    this._consumeToken(this._TOKENS.OBJECT_OPEN);

    do {
      this._skipWhiteSpace();
      if (this._lookAheadForToken(this._TOKENS.OBJECT_CLOSE)) {
        this._consumeToken(this._TOKENS.OBJECT_CLOSE);
        break;
      }
    
      key = this._requireObjectKey();
      this._requireColumn();
      
      this._skipWhiteSpace();
      result[key] = this._parse();

      this._skipWhiteSpace();      
      if (this._lookAheadForToken(this._TOKENS.COMA)) {
        this._consumeToken(this._TOKENS.COMA);     
      }
    } while (true);
      
    return result;
  },

  _consumeArray: function () {
    var result = [];
  
    this._consumeToken(this._TOKENS.ARRAY_OPEN);

    do {
      this._skipWhiteSpace();
      if (this._lookAheadForToken(this._TOKENS.ARRAY_CLOSE)) {
        this._consumeToken(this._TOKENS.ARRAY_CLOSE);
        break;
      }

      this._skipWhiteSpace();
      result.push(this._parse());

      this._skipWhiteSpace();      
      if (this._lookAheadForToken(this._TOKENS.COMA)) {
        this._consumeToken(this._TOKENS.COMA);     
      }
    } while (true);

    return result;
  },

  _requireObjectKey: function () {
    this._skipWhiteSpace();
    if (this._lookAheadForToken(this._TOKENS.QUOTE)) {
      return this._consumeString();
    }
    throw new ParseError(this, 'string as object key expected'); 
  },

  _requireColumn: function () {
    this._skipWhiteSpace();
    if (this._lookAheadForToken(this._TOKENS.COLUMN)) {
      this._consumeToken(this._TOKENS.COLUMN);
    } else {
      throw new ParseError(this, 'column expected'); 
    }
  },

  _consumeString: function () {
    var stringEscapeFlag = false,
      parsedString = []; 
    
    this._consumeToken(this._TOKENS.QUOTE);
  
    do {
      if (stringEscapeFlag) {
        parsedString.push(this._consumeCurrentSymbol());
        stringEscapeFlag = false;
      } else if (this._lookAheadForToken(this._TOKENS.QUOTE)) {
        this._consumeToken(this._TOKENS.QUOTE);  
        break;
      } else if (this._lookAheadForToken(this._TOKENS.BACKSLASH)) {
        this._consumeToken(this._TOKENS.BACKSLASH);   
        stringEscapeFlag = true;
      } else {
        parsedString.push(this._consumeCurrentSymbol());
      }
    } while (true);

    return parsedString.join("");
  },

  _consumeNumber: function () {
    var symbol,
      haveMinus = false,
      haveDot = false,
      initialPosition = this._position,
      symbols = [];

    while (this._position < this._length) {
      symbol = this._getCurrentSymbol();
      if (SymbolTraits.isNumber(symbol)) {
        symbols.push(this._consumeCurrentSymbol());
      } else if (this._lookAheadForToken(this._TOKENS.MINUS)) {
        if (haveMinus) {
          throw new ParseError(this, "unexpected minus");
        }
        symbols.push(this._consumeCurrentSymbol());
        haveMinus = true;
      } else if (this._lookAheadForToken(this._TOKENS.DOT)) {
        if (haveDot) {
          throw new ParseError(this, "unexpected dot"); 
        } 
        symbols.push(this._consumeCurrentSymbol());
        haveDot = true;
      } else {
        break;
      }
    }
    return Number(symbols.join(''));
  },

  _lookAheadForToken: function (pattern) {
    return [].every.call(pattern, function (patternLetter, i) {
      var offset = this._position + i;
      
      if (offset >= this.length) {
        return false; 
      }
      return this._string[offset] === patternLetter;
    }, this);
  },

  _consumeToken: function (token) {
    this._position += token.length; 
  },

  _lookAheadForNumber: function () {
    var currentSymbol = this._getCurrentSymbol();

    return SymbolTraits.isNumber(currentSymbol) || currentSymbol === this._TOKENS.MINUS; 
  },

  _skipWhiteSpace: function () {
    while (this._position < this._length) {
      if (!SymbolTraits.isWhiteSpace([this._string[this._position]])) {
        return; 
      }
      this._position++;
    }
  },

  _advancePosition: function () {
    if (this._position >= this._length) {
      throw new ParseError(this, "unexpected eos");
    } 
    this._position++;
  },

  _getCurrentSymbol: function () {
    if (this._position >= this._length) {
      throw new ParseError(this, "unexpected eos");
    } 
    return this._string[this._position];
  },

  _consumeCurrentSymbol: function () {
    var symbol = this._getCurrentSymbol();
    this._advancePosition();
    return symbol;
  }

};

//JSONParser = attachTraser(JSONParser);

module.exports = {
  parse: function (string) {
    return (new JSONParser(string)).parse();
  }
};
