import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserPage from './UserPage';

// Mock the useUser hook
vi.mock('../../hooks/useUser', () => ({
    useUser: vi.fn(),
}));

import { useUser } from '../../hooks/useUser';

function renderUserPage(userId: string = 'testuser') {
    return render(
        <MemoryRouter initialEntries={[`/user/${userId}`]}>
            <Routes>
                <Route path="/user/:id" element={<UserPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('UserPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Loader when loading', () => {
        vi.mocked(useUser).mockReturnValue({
            user: null,
            error: null,
            loading: true,
        });

        const { container } = renderUserPage();
        expect(container.querySelector('.loading-section')).toBeInTheDocument();
    });

    it('renders ErrorMessage with user ID on error', () => {
        vi.mocked(useUser).mockReturnValue({
            user: null,
            error: 'User not found',
            loading: false,
        });

        renderUserPage('baduser');
        expect(screen.getByText('Could not load user baduser.')).toBeInTheDocument();
    });

    it('renders user ID and karma', () => {
        vi.mocked(useUser).mockReturnValue({
            user: {
                id: 'pg',
                created_time: 1160418111,
                created: '15 years ago',
                karma: 157236,
                avg: 0,
                about: '',
            },
            error: null,
            loading: false,
        });

        const { container } = renderUserPage('pg');
        const nameEl = container.querySelector('.main-details .name');
        expect(nameEl).toBeInTheDocument();
        expect(nameEl).toHaveTextContent('pg');

        const karmaEl = container.querySelector('.main-details .right');
        expect(karmaEl).toBeInTheDocument();
        expect(karmaEl).toHaveTextContent('157236');
        expect(karmaEl).toHaveTextContent('★');
    });

    it('renders created date', () => {
        vi.mocked(useUser).mockReturnValue({
            user: {
                id: 'pg',
                created_time: 1160418111,
                created: '15 years ago',
                karma: 157236,
                avg: 0,
                about: '',
            },
            error: null,
            loading: false,
        });

        const { container } = renderUserPage('pg');
        const ageEl = container.querySelector('.main-details .age');
        expect(ageEl).toBeInTheDocument();
        expect(ageEl).toHaveTextContent('Created 15 years ago');
    });

    it('renders about HTML content when present', () => {
        vi.mocked(useUser).mockReturnValue({
            user: {
                id: 'dang',
                created_time: 1234567890,
                created: '10 years ago',
                karma: 12345,
                avg: 0,
                about: '<p>Hello <b>world</b></p>',
            },
            error: null,
            loading: false,
        });

        const { container } = renderUserPage('dang');
        const otherDetails = container.querySelector('.other-details');
        expect(otherDetails).toBeInTheDocument();
        const aboutP = otherDetails!.querySelector('p');
        expect(aboutP).toBeInTheDocument();
        expect(aboutP!.innerHTML).toBe('<p>Hello <b>world</b></p>');
    });

    it('hides about section when user.about is empty', () => {
        vi.mocked(useUser).mockReturnValue({
            user: {
                id: 'pg',
                created_time: 1160418111,
                created: '15 years ago',
                karma: 157236,
                avg: 0,
                about: '',
            },
            error: null,
            loading: false,
        });

        const { container } = renderUserPage('pg');
        const otherDetails = container.querySelector('.other-details');
        expect(otherDetails).not.toBeInTheDocument();
    });

    it('hides about section when user.about is null/undefined', () => {
        vi.mocked(useUser).mockReturnValue({
            user: {
                id: 'pg',
                created_time: 1160418111,
                created: '15 years ago',
                karma: 157236,
                avg: 0,
                about: null as unknown as string,
            },
            error: null,
            loading: false,
        });

        const { container } = renderUserPage('pg');
        const otherDetails = container.querySelector('.other-details');
        expect(otherDetails).not.toBeInTheDocument();
    });
});
