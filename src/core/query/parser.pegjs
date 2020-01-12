{
const wildcardSymbol = '@cashier-wildcard@';
}

start
  = Space* query:OrQuery? Space* {
    if (query !== null) return query;
    return {
      type: 'is',
      field: {
        type: 'wildcard',
        value: ['', ''],
      },
      value: {
        type: 'wildcard',
        value: ['', ''],
      },
      isPhrase: false,
    };
  }

OrQuery
  = left:AndQuery Or right:OrQuery {
    return {
      type: 'or',
      left,
      right,
    };
  }
  / AndQuery

AndQuery
  = left:NotQuery And right:AndQuery {
    return {
      type: 'and',
      left,
      right,
    };
  }
  / NotQuery

NotQuery
  = Not query:SubQuery {
    return {
      type: 'not',
      query,
    };
  }
  / SubQuery

SubQuery
  = '(' Space* query:OrQuery Space* ')' { return query; }
  / Expression

Expression
  = FieldRangeExpression
  / FieldValueExpression
  / ValueExpression

Field "fieldName"
  = Literal

FieldRangeExpression
  = field:Field Space* operator:RangeOperator Space* value:Literal {
    return {
      type: 'range',
      field,
      operator,
      value,
    };
  }

FieldValueExpression
  = field:Field Space* ':' Space* partial:ListOfValues {
    return partial(field);
  }

ValueExpression
  = partial:Value {
    return partial(null);
  }

ListOfValues
  = '(' Space* partial:OrListOfValues Space* ')' { return partial; }
  / Value

OrListOfValues
  = partialLeft:AndListOfValues Or partialRight:OrListOfValues {
    return (field) => ({
      type: 'or',
      left: partialLeft(field),
      right: partialRight(field),
    });
  }
  / AndListOfValues

AndListOfValues
  = partialLeft:NotListOfValues And partialRight:AndListOfValues {
    return (field) => ({
      type: 'and',
      left: partialLeft(field),
      right: partialRight(field),
    });
  }
  / NotListOfValues

NotListOfValues
  = Not partial:ListOfValues {
    return (field) => ({
      type: 'not',
      query: partial(field),
    });
  }
  / ListOfValues

Value "value"
  = value:QuotedString {
    return (field) => ({
      type: 'is',
      field,
      value,
      isPhrase: true
    });
  }
  / value:UnquotedLiteral {
    return (field) => ({
      type: 'is',
      field,
      value,
      isPhrase: false
    });
  }
  / value:QueryValue

Or "OR"
  = Space+ 'or'i Space+

And "AND"
  = Space+ 'and'i Space+

Not "NOT"
  = 'not'i Space+

Literal "literal"
  = QuotedString / UnquotedLiteral

QuotedString
  = '"' chars:QuotedCharacter* '"' {
    return {type: 'literal', value: chars.join('')};
  }

QuotedCharacter
  = EscapedWhitespace
  / '\\' char:[\\"] { return char; }
  / char:[^"] { return char; }

UnquotedLiteral
  = chars:UnquotedCharacter+ {
    const sequence = chars.join('').trim();
    if (chars.includes(wildcardSymbol)) {
      const splits = [];
      let lastIndex = 0;
      let index;
      while (true) {
        index = chars.indexOf(wildcardSymbol, lastIndex);
        if (index === -1) break;
        splits.push(chars.slice(lastIndex, index));
        lastIndex = index + 1;
      }
      splits.push(chars.slice(lastIndex));
      return {
        type: 'wildcard',
        value: splits.map(x => x.join('')),
      };
    }
    return {type: 'literal', value: sequence};
  }

UnquotedCharacter
  = EscapedWhitespace
  / EscapedSpecialCharacter
  / EscapedKeyword
  / Wildcard
  / !SpecialCharacter !Keyword char:. { return char; }

Wildcard
  = '*' { return wildcardSymbol; }

EscapedWhitespace
  = '\\t' { return '\t'; }
  / '\\r' { return '\r'; }
  / '\\n' { return '\n'; }

EscapedSpecialCharacter
  = '\\' char:SpecialCharacter { return char; }

EscapedKeyword
  = '\\' keyword:('or'i / 'and'i / 'not'i) { return keyword; }

Keyword
  = Or / And / Not

SpecialCharacter
  = [\\():<>"*@]

RangeOperator
  = '<=' { return 'lte'; }
  / '>=' { return 'gte'; }
  / '<' { return 'lt'; }
  / '>' { return 'gt'; }

Space "whitespace"
  = [\ \t\r\n]

QueryValue
  = '@' index:Literal '(' Space* query:OrQuery? Space* ')' {
    return (field) => ({
      type: 'query',
      field,
      index,
      query
    });
  }
