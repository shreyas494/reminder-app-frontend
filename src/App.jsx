import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCreateUser from "./pages/AdminCreateUser";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      <Route path="/landing" element={<><Navbar /><Landing /></>} />
      <Route path="/login" element={<><Navbar /><Login /></>} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/create" element={<AdminCreateUser />} />
      </Route>

      <Route path="*" element={<Navigate to="/landing" />} />
    </Routes>
  );
}

export default App;
