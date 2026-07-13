import { Route, Routes } from "react-router-dom"

import PublicThemeControl from "./components/Theme/PublicThemeControl"
import { ThemeProvider } from "./context/ThemeProvider"

import Home from "./pages/Home/Home"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"

import Dashboard from "./pages/Dashboard/Dashboard"
import Profile from "./pages/Profile/Profile"

import Tutoring from "./pages/Tutoring/Tutoring"
import Calendar from "./pages/Calendar/Calendar"

import RequestsList from "./pages/Requests/RequestsList"
import NewRequest from "./pages/Requests/NewRequest"
import MyRequests from "./pages/Requests/MyRequests"
import RequestDetail from "./pages/Requests/RequestDetail"

import GroupsList from "./pages/Groups/GroupsList"
import NewGroup from "./pages/Groups/NewGroup"
import MyGroups from "./pages/Groups/MyGroups"

import MaterialsList from "./pages/Materials/MaterialsList"
import NewMaterial from "./pages/Materials/NewMaterial"
import MyMaterials from "./pages/Materials/MyMaterials"
import FavoriteMaterials from "./pages/Materials/FavoriteMaterials"

import Notifications from "./pages/Notifications/Notifications"
import Chat from "./pages/Chat/Chat"
import Settings from "./pages/Settings/Settings"
import Reputation from "./pages/Reputation/Reputation"
import Admin from "./pages/Admin/Admin"
import Achievements from "./pages/Achievements/Achievements"
import Analytics from "./pages/Analytics/Analytics"
import Assistant from "./pages/Assistant/Assistant"

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"
import DashboardLayout from "./layouts/DashboardLayout"

function App() {
  return (
    <ThemeProvider>
      <PublicThemeControl />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path="perfil" element={<Profile />} />

        <Route path="tutorias" element={<Tutoring />} />
        <Route path="calendario" element={<Calendar />} />

        <Route path="solicitudes" element={<RequestsList />} />
        <Route path="solicitudes/nueva" element={<NewRequest />} />
        <Route path="solicitudes/mias" element={<MyRequests />} />
        <Route
          path="solicitudes/:requestId"
          element={<RequestDetail />}
        />

        <Route path="grupos" element={<GroupsList />} />
        <Route path="grupos/nuevo" element={<NewGroup />} />
        <Route path="grupos/mios" element={<MyGroups />} />

        <Route path="materiales" element={<MaterialsList />} />
        <Route path="materiales/nuevo" element={<NewMaterial />} />
        <Route path="materiales/mios" element={<MyMaterials />} />
        <Route path="materiales/favoritos" element={<FavoriteMaterials />} />

        <Route path="chat" element={<Chat />} />

        <Route path="reputacion" element={<Reputation />} />
        <Route path="logros" element={<Achievements />} />
        <Route path="analiticas" element={<Analytics />} />
        <Route path="asistente" element={<Assistant />} />
        <Route path="administracion" element={<Admin />} />

        <Route
          path="notificaciones"
          element={<Notifications />}
        />

        <Route
          path="configuracion"
          element={<Settings />}
        />
      </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App