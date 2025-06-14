import { describe, it, expect } from 'vitest';
import { Tokenizer } from '../tokenizer';
import { TokenType } from '../types';

describe('Tokenizer', () => {
  it('should tokenize simple sets x reps', () => {
    const tokens = Tokenizer.tokenize('5x10');
    
    expect(tokens).toHaveLength(4); // 5, x, 10, EOF
    expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: '5' });
    expect(tokens[1]).toMatchObject({ type: TokenType.MULTIPLY, value: 'x' });
    expect(tokens[2]).toMatchObject({ type: TokenType.NUMBER, value: '10' });
    expect(tokens[3]).toMatchObject({ type: TokenType.EOF });
  });

  it('should handle various multiplication symbols', () => {
    const inputs = ['5x10', '5X10', '5×10', '5*10'];
    
    inputs.forEach(input => {
      const tokens = Tokenizer.tokenize(input);
      expect(tokens[1].type).toBe(TokenType.MULTIPLY);
    });
  });

  it('should tokenize exercise names', () => {
    const tokens = Tokenizer.tokenize('Bench Press');
    
    expect(tokens).toHaveLength(3); // Bench, Press, EOF
    expect(tokens[0]).toMatchObject({ type: TokenType.WORD, value: 'Bench' });
    expect(tokens[1]).toMatchObject({ type: TokenType.WORD, value: 'Press' });
  });

  it('should recognize keywords', () => {
    const tests = [
      { input: 'ss', expected: TokenType.SUPERSET },
      { input: 'RPE', expected: TokenType.RPE },
      { input: 'lbs', expected: TokenType.WEIGHT_UNIT },
      { input: 'kg', expected: TokenType.WEIGHT_UNIT },
      { input: 'AMRAP', expected: TokenType.AMRAP },
      { input: 'BW', expected: TokenType.BW },
      { input: 'rest', expected: TokenType.REST },
      { input: 'R', expected: TokenType.REST },
    ];

    tests.forEach(({ input, expected }) => {
      const tokens = Tokenizer.tokenize(input);
      expect(tokens[0].type).toBe(expected);
    });
  });

  it('should handle complex workout notation', () => {
    const tokens = Tokenizer.tokenize('3x8-12 Bench Press @225lbs RPE8 R90s');
    
    const expectedTypes = [
      TokenType.NUMBER,     // 3
      TokenType.MULTIPLY,   // x
      TokenType.NUMBER,     // 8
      TokenType.DASH,       // -
      TokenType.NUMBER,     // 12
      TokenType.WORD,       // Bench
      TokenType.WORD,       // Press
      TokenType.AT,         // @
      TokenType.NUMBER,     // 225
      TokenType.WEIGHT_UNIT,// lbs
      TokenType.RPE,        // RPE
      TokenType.NUMBER,     // 8
      TokenType.REST,       // R
      TokenType.NUMBER,     // 90
      TokenType.TIME_UNIT,  // s
      TokenType.EOF
    ];

    tokens.forEach((token, i) => {
      expect(token.type).toBe(expectedTypes[i]);
    });
  });

  it('should handle decimal numbers', () => {
    const tokens = Tokenizer.tokenize('2.5x10');
    
    expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: '2.5' });
  });

  it('should track line and column positions', () => {
    const tokens = Tokenizer.tokenize('5x10\n3x8');
    
    expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
    expect(tokens[2]).toMatchObject({ line: 1, column: 4 });
    expect(tokens[3]).toMatchObject({ type: TokenType.NEWLINE, line: 1 });
    expect(tokens[4]).toMatchObject({ line: 2, column: 1 });
  });

  it('should handle supersets', () => {
    const tokens = Tokenizer.tokenize('5x10 Bench ss 5x10 Flyes');
    
    const ssToken = tokens.find(t => t.type === TokenType.SUPERSET);
    expect(ssToken).toBeDefined();
    expect(ssToken?.value).toBe('ss');
  });

  it('should handle percentage notation', () => {
    const tokens = Tokenizer.tokenize('5@75%');
    
    expect(tokens).toContainEqual(
      expect.objectContaining({ type: TokenType.PERCENT })
    );
  });

  it('should handle parentheses', () => {
    const tokens = Tokenizer.tokenize('5x10 (225lbs)');
    
    expect(tokens).toContainEqual(
      expect.objectContaining({ type: TokenType.LPAREN })
    );
    expect(tokens).toContainEqual(
      expect.objectContaining({ type: TokenType.RPAREN })
    );
  });

  it('should handle comma-separated reps', () => {
    const tokens = Tokenizer.tokenize('225x5,5,3');
    
    const commaTokens = tokens.filter(t => t.type === TokenType.COMMA);
    expect(commaTokens).toHaveLength(2);
  });

  it('should handle slash notation for drop sets', () => {
    const tokens = Tokenizer.tokenize('12/10/8');
    
    const slashTokens = tokens.filter(t => t.type === TokenType.SLASH);
    expect(slashTokens).toHaveLength(2);
  });

  it('should handle tempo notation', () => {
    const tokens = Tokenizer.tokenize('3x10 tempo 2-1-2');
    
    expect(tokens).toContainEqual(
      expect.objectContaining({ type: TokenType.TEMPO })
    );
  });

  it('should preserve whitespace information', () => {
    const input = '5x10  Squat';
    const tokens = Tokenizer.tokenize(input);
    
    // Should skip whitespace but track positions correctly
    expect(tokens[2]).toMatchObject({ 
      type: TokenType.WORD, 
      value: 'Squat',
      column: 7 // After '5x10  '
    });
  });
});