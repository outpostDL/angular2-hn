import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>Hacker News</h1>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<Navigate to="/news/1" replace />} />
                    <Route path="/news/:page" element={<div>News feed placeholder</div>} />
                    <Route path="/newest/:page" element={<div>Newest feed placeholder</div>} />
                    <Route path="/show/:page" element={<div>Show feed placeholder</div>} />
                    <Route path="/ask/:page" element={<div>Ask feed placeholder</div>} />
                    <Route path="/jobs/:page" element={<div>Jobs feed placeholder</div>} />
                    <Route path="/item/:id" element={<div>Item details placeholder</div>} />
                    <Route path="/user/:id" element={<div>User profile placeholder</div>} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
