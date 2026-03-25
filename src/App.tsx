import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import FeedPage from './pages/FeedPage/FeedPage';
import Loader from './components/Loader/Loader';
import './styles/app.scss';

const ItemDetailsPage = React.lazy(() => import('./pages/ItemDetailsPage'));
const UserPage = React.lazy(() => import('./pages/UserPage/UserPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage/SignupPage'));

function App() {
    const { theme } = useSettings();

    return (
        <div className={theme}>
            <div className="body-cover" />
            <div className="wrapper">
                <Header />
                <Suspense fallback={<Loader />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/news/1" replace />} />
                        <Route path="/news/:page" element={<FeedPage feedType="news" />} />
                        <Route path="/newest/:page" element={<FeedPage feedType="newest" />} />
                        <Route path="/show/:page" element={<FeedPage feedType="show" />} />
                        <Route path="/ask/:page" element={<FeedPage feedType="ask" />} />
                        <Route path="/jobs/:page" element={<FeedPage feedType="jobs" />} />
                        <Route path="/item/:id" element={<ItemDetailsPage />} />
                        <Route path="/user/:id" element={<UserPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                    </Routes>
                </Suspense>
                <Footer />
            </div>
        </div>
    );
}

export default App;
