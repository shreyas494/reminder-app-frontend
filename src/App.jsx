import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import Bills from "./pages/Bills";
import Services from "./pages/Services";
import NearExpiry from "./pages/NearExpiry";
import AdminUsers from "./pages/AdminUsers";
import AdminCreateUser from "./pages/AdminCreateUser";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { APP_ROUTES } from "./constants/routes";

function App() {
  return (
    <Routes>
      <Route path={APP_ROUTES.landing} element={<><Navbar /><Landing /></>} />
      <Route path={APP_ROUTES.login} element={<><Navbar /><Login /></>} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path={APP_ROUTES.dashboard} element={<Dashboard />} />
        <Route path={APP_ROUTES.nearExpiry} element={<NearExpiry />} />
        <Route path={APP_ROUTES.quotations} element={<Quotations />} />
        <Route path={APP_ROUTES.bills} element={<Bills />} />
        <Route path={APP_ROUTES.services} element={<Services />} />
        <Route path={APP_ROUTES.adminUsers} element={<AdminUsers />} />
        <Route path={APP_ROUTES.adminCreateUser} element={<AdminCreateUser />} />
      </Route>

      <Route path="*" element={<Navigate to={APP_ROUTES.landing} />} />
    </Routes>
  );
}

export default App;
