import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <h1>Hacker News</h1>
        <Routes>
          <Route path="/" element={<p>Welcome to Hacker News</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
