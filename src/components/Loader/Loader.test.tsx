import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader', () => {
    it('renders without crashing', () => {
        const { container } = render(<Loader />);
        expect(container.querySelector('.loading-section')).toBeInTheDocument();
    });

    it('has correct CSS class for animation', () => {
        const { container } = render(<Loader />);
        expect(container.querySelector('.loader')).toBeInTheDocument();
    });
});
