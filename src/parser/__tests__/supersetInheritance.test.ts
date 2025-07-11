import { SmartParser } from '../smartParser';

describe('Superset Inheritance', () => {
  const parser = new SmartParser();

  it('should inherit sets and reps from first exercise when not specified', () => {
    const input = '5x5 benchpress ss banded pull aparts';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    expect(result.workout).toBeDefined();
    expect(result.workout!.groups).toHaveLength(1);
    
    const group = result.workout!.groups[0];
    expect(group.type).toBe('superset');
    expect(group.exercises).toHaveLength(2);
    
    // First exercise should have 5 sets of 5 reps
    const benchpress = group.exercises[0];
    expect(benchpress.name).toBe('benchpress');
    expect(benchpress.sets).toHaveLength(5);
    expect(benchpress.sets[0].reps).toBe(5);
    
    // Second exercise should inherit 5 sets and 5 reps
    const bandedPullAparts = group.exercises[1];
    expect(bandedPullAparts.name).toBe('banded pull aparts');
    expect(bandedPullAparts.sets).toHaveLength(5);
    expect(bandedPullAparts.sets[0].reps).toBe(5);
  });

  it('should inherit sets but keep specified reps', () => {
    const input = '5x5 benchpress @225lbs ss banded pull aparts 8-10';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    const group = result.workout!.groups[0];
    
    // First exercise
    const benchpress = group.exercises[0];
    expect(benchpress.sets).toHaveLength(5);
    expect(benchpress.sets[0].reps).toBe(5);
    expect(benchpress.sets[0].weight).toEqual({ value: 225, unit: 'lbs' });
    
    // Second exercise should inherit 5 sets but use its own rep range
    const bandedPullAparts = group.exercises[1];
    expect(bandedPullAparts.name).toBe('banded pull aparts');
    expect(bandedPullAparts.sets).toHaveLength(5);
    expect(bandedPullAparts.sets[0].reps).toEqual({ min: 8, max: 10 });
  });

  it('should work with complex superset notation', () => {
    const input = '4x8-12 RDL @185lbs ss 4x15 leg curls';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    const group = result.workout!.groups[0];
    
    // Both exercises explicitly specify sets
    const rdl = group.exercises[0];
    expect(rdl.name).toBe('RDL');
    expect(rdl.sets).toHaveLength(4);
    expect(rdl.sets[0].reps).toEqual({ min: 8, max: 12 });
    
    const legCurls = group.exercises[1];
    expect(legCurls.name).toBe('leg curls');
    expect(legCurls.sets).toHaveLength(4);
    expect(legCurls.sets[0].reps).toBe(15);
  });
});