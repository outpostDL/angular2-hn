import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
    it('renders provided message text', () => {
        render(<ErrorMessage message="Something went wrong" />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders skull graphic container', () => {
        const { container } = render(<ErrorMessage message="Error" />);
        expect(container.querySelector('.skull')).toBeInTheDocument();
    });
});
