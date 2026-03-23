// src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Lawyers from "./pages/Lawyers/Lawyers.jsx";
import QA from "./pages/QA/QA.jsx";
import Templates from "./pages/Templates/Templates.jsx";
import Upload from "./pages/Upload/Upload.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />{" "}
        {/* We need a default landing page enja the dashboard  */}
        {/*bas landing akam heshtawa w renamem kradawa ba dashboard cuz i think the one i had made zyaya bw*/ }
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/qa" element={<QA />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/lawyers" element={<Lawyers />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
