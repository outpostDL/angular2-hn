import { CommentPipe } from './comment.pipe';

describe('CommentPipe', () => {
    let pipe: CommentPipe;

    beforeEach(() => {
        pipe = new CommentPipe();
    });

    it('should create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return "discuss" for 0', () => {
        expect(pipe.transform(0)).toBe('discuss');
    });

    it('should return "1 comment" for 1 (singular)', () => {
        expect(pipe.transform(1)).toBe('1 comment');
    });

    it('should return "5 comments" for 5 (plural)', () => {
        expect(pipe.transform(5)).toBe('5 comments');
    });

    it('should return "discuss" for negative numbers', () => {
        expect(pipe.transform(-1)).toBe('discuss');
    });
});
