import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import './SignupPage.scss';

function SignupPage() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!auth) {
            setError('Authentication is not available');
            return;
        }

        // Check for duplicate email in localStorage before calling signup
        try {
            const raw = localStorage.getItem('mockUsers');
            if (raw) {
                const users: Array<{ email: string }> = JSON.parse(raw);
                if (users.some((u) => u.email === email)) {
                    setError('An account with this email already exists');
                    return;
                }
            }
        } catch {
            // Ignore parse errors, proceed with signup
        }

        setIsSubmitting(true);
        try {
            await auth.signup(email, password, name);
            navigate('/news/1');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-container">
                <h1 className="signup-title">Create Account</h1>

                {error && (
                    <div className="signup-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <label htmlFor="signup-name">Name</label>
                        <input
                            id="signup-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Your name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-email">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder="Choose a password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="signup-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating account...' : 'Sign up'}
                    </button>
                </form>

                <p className="signup-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default SignupPage;
