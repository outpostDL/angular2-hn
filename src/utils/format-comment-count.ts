export function formatCommentCount(n: number): string {
    if (n === 0) {
        return 'discuss';
    }
    if (n === 1) {
        return '1 comment';
    }
    return `${n} comments`;
}
