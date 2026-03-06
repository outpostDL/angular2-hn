import { describe, it, expect } from 'vitest';
import { formatCommentCount } from '../utils/format-comment-count';

describe('formatCommentCount', () => {
    it('returns "discuss" when count is 0', () => {
        expect(formatCommentCount(0)).toBe('discuss');
    });

    it('returns "1 comment" when count is 1', () => {
        expect(formatCommentCount(1)).toBe('1 comment');
    });

    it('returns "N comments" when count is greater than 1', () => {
        expect(formatCommentCount(5)).toBe('5 comments');
        expect(formatCommentCount(100)).toBe('100 comments');
    });
});
