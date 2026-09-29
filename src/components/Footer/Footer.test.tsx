import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
    it('renders the GitHub link', () => {
        render(<Footer />);
        const link = screen.getByRole('link', { name: /github/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://github.com/hdjirdeh/angular2-hn');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders heart emoji text', () => {
        render(<Footer />);
        expect(screen.getByText(/show this project some/i)).toBeInTheDocument();
    });

    it('has the footer container with correct id', () => {
        const { container } = render(<Footer />);
        expect(container.querySelector('#footer')).toBeInTheDocument();
    });
});
