import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Comment from './Comment';
import type { Comment as CommentType } from '../../types';

const baseComment: CommentType = {
    id: 1,
    level: 0,
    user: 'testuser',
    time: 1234567890,
    time_ago: '3 hours ago',
    content: '<em>Hello</em> world',
    deleted: false,
    comments: [],
};

function renderComment(comment: CommentType) {
    return render(
        <MemoryRouter>
            <Comment comment={comment} />
        </MemoryRouter>
    );
}

describe('Comment', () => {
    it('renders user link and time_ago', () => {
        renderComment(baseComment);
        const userLink = screen.getByRole('link', { name: 'testuser' });
        expect(userLink).toBeInTheDocument();
        expect(userLink).toHaveAttribute('href', '/user/testuser');
        expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    });

    it('renders comment content as HTML', () => {
        const { container } = renderComment(baseComment);
        const commentText = container.querySelector('.comment-text');
        expect(commentText).toBeInTheDocument();
        expect(commentText!.innerHTML).toContain('<em>Hello</em> world');
    });

    it('collapse toggle shows [-] by default and hides content when clicked', () => {
        const { container } = renderComment(baseComment);
        const toggle = screen.getByText('[-]');
        expect(toggle).toBeInTheDocument();

        // Content should be visible initially
        const commentTree = container.querySelector('.comment-tree > div');
        expect(commentTree).not.toHaveAttribute('hidden');

        // Click to collapse
        fireEvent.click(toggle);
        expect(screen.getByText('[+]')).toBeInTheDocument();
        expect(container.querySelector('.comment-tree > div')).toHaveAttribute('hidden');
    });

    it('clicking toggle again re-expands content', () => {
        const { container } = renderComment(baseComment);
        const toggle = screen.getByText('[-]');

        // Collapse
        fireEvent.click(toggle);
        expect(screen.getByText('[+]')).toBeInTheDocument();

        // Expand
        fireEvent.click(screen.getByText('[+]'));
        expect(screen.getByText('[-]')).toBeInTheDocument();
        expect(container.querySelector('.comment-tree > div')).not.toHaveAttribute('hidden');
    });

    it('renders nested comments recursively', () => {
        const nestedComment: CommentType = {
            ...baseComment,
            comments: [
                {
                    id: 2,
                    level: 1,
                    user: 'nesteduser',
                    time: 1234567891,
                    time_ago: '2 hours ago',
                    content: 'Nested reply',
                    deleted: false,
                    comments: [],
                },
            ],
        };
        renderComment(nestedComment);
        expect(screen.getByRole('link', { name: 'nesteduser' })).toBeInTheDocument();
        expect(screen.getByText('Nested reply')).toBeInTheDocument();
    });

    it('renders deleted comment with deleted message', () => {
        const deletedComment: CommentType = {
            ...baseComment,
            deleted: true,
            user: '',
            content: '',
        };
        const { container } = renderComment(deletedComment);
        const deletedMeta = container.querySelector('.deleted-meta');
        expect(deletedMeta).toBeInTheDocument();
        expect(deletedMeta!.textContent).toContain('[deleted]');
        expect(deletedMeta!.textContent).toContain('Comment Deleted');
    });

    it('meta has meta-collapse class when collapsed', () => {
        const { container } = renderComment(baseComment);
        const meta = container.querySelector('.meta');
        expect(meta).not.toHaveClass('meta-collapse');

        fireEvent.click(screen.getByText('[-]'));
        expect(meta).toHaveClass('meta-collapse');
    });
});
