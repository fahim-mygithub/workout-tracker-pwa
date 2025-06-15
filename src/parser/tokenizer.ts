import type { Token } from './types';
import { TokenType } from './types';

export class Tokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    this.tokens.push(this.createToken(TokenType.EOF, ''));
    return this.tokens;
  }

  private nextToken(): Token | null {
    const char = this.input[this.position];

    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber();
    }

    // Single character tokens
    switch (char) {
      case '+':
        return this.advance(TokenType.PLUS);
      case '-':
        return this.advance(TokenType.DASH);
      case ',':
        return this.advance(TokenType.COMMA);
      case '/':
        return this.advance(TokenType.SLASH);
      case ':':
        return this.advance(TokenType.COLON);
      case '@':
        return this.advance(TokenType.AT);
      case '%':
        return this.advance(TokenType.PERCENT);
      case '(':
        return this.advance(TokenType.LPAREN);
      case ')':
        return this.advance(TokenType.RPAREN);
      case '\n':
        const token = this.advance(TokenType.NEWLINE);
        this.line++;
        this.column = 1;
        return token;
    }

    // Multiplication symbols
    if (char === 'x' || char === 'X' || char === '×' || char === '*') {
      return this.advance(TokenType.MULTIPLY);
    }

    // Words and keywords
    if (this.isLetter(char)) {
      return this.readWord();
    }

    // Unknown character
    return this.advance(TokenType.UNKNOWN);
  }

  private readNumber(): Token {
    const start = this.position;
    const startColumn = this.column;
    let hasDecimal = false;

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (this.isDigit(char)) {
        this.position++;
        this.column++;
      } else if (char === '.' && !hasDecimal) {
        hasDecimal = true;
        this.position++;
        this.column++;
      } else {
        break;
      }
    }

    const value = this.input.slice(start, this.position);
    return {
      type: TokenType.NUMBER,
      value,
      position: start,
      line: this.line,
      column: startColumn
    };
  }

  private readWord(): Token {
    const start = this.position;
    const startColumn = this.column;

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (this.isLetter(char) || char === "'") {
        this.position++;
        this.column++;
      } else {
        break;
      }
    }

    const value = this.input.slice(start, this.position);
    const type = this.getWordType(value);

    return {
      type,
      value,
      position: start,
      line: this.line,
      column: startColumn
    };
  }

  private getWordType(word: string): TokenType {
    const lower = word.toLowerCase();

    // Keywords mapping
    const keywords: { [key: string]: TokenType } = {
      'ss': TokenType.SUPERSET,
      'superset': TokenType.SUPERSET,
      'rpe': TokenType.RPE,
      'r': TokenType.REST,
      'rest': TokenType.REST,
      'tempo': TokenType.TEMPO,
      'drop': TokenType.DROP,
      'dropset': TokenType.DROP,
      'amrap': TokenType.AMRAP,
      'bw': TokenType.BW,
      'bodyweight': TokenType.BW,
      'rm': TokenType.RM,
      
      // Weight units
      'lbs': TokenType.WEIGHT_UNIT,
      'lb': TokenType.WEIGHT_UNIT,
      'pounds': TokenType.WEIGHT_UNIT,
      'kg': TokenType.WEIGHT_UNIT,
      'kgs': TokenType.WEIGHT_UNIT,
      'kilos': TokenType.WEIGHT_UNIT,
      
      // Time units
      's': TokenType.TIME_UNIT,
      'sec': TokenType.TIME_UNIT,
      'secs': TokenType.TIME_UNIT,
      'seconds': TokenType.TIME_UNIT,
      'min': TokenType.TIME_UNIT,
      'mins': TokenType.TIME_UNIT,
      'minutes': TokenType.TIME_UNIT,
      'm': TokenType.TIME_UNIT,
    };

    return keywords[lower] || TokenType.WORD;
  }

  private advance(type: TokenType): Token {
    const token = this.createToken(type, this.input[this.position]);
    this.position++;
    this.column++;
    return token;
  }

  private createToken(type: TokenType, value: string): Token {
    const token = {
      type,
      value,
      position: this.position,
      line: this.line,
      column: this.column
    };
    return token;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.position++;
        this.column++;
      } else {
        break;
      }
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isLetter(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z');
  }

  // Utility methods for parser
  static tokenize(input: string): Token[] {
    const tokenizer = new Tokenizer(input);
    return tokenizer.tokenize();
  }
}