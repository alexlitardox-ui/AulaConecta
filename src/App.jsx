import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"

import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary"
import PageLoader from "./components/Loading/PageLoader"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"
import PublicThemeControl from "./components/Theme/PublicThemeControl"
import { ThemeProvider } from "./context/ThemeProvider"
import DashboardLayout from "./layouts/DashboardLayout"

const Home = lazy(() => import("./pages/Home/Home"))
const Login = lazy(() => import("./pages/Login/Login"))
const Register = lazy(() => import("./pages/Register/Register"))
const ResetPassword = lazy(() => import("./pages/ResetPassword/ResetPassword"))
const AccountConfirmed = lazy(() => import("./pages/AccountConfirmed/AccountConfirmed"))
const NotFound = lazy(() => import("./pages/NotFound/NotFound"))

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"))
const Profile = lazy(() => import("./pages/Profile/Profile"))
const Tutoring = lazy(() => import("./pages/Tutoring/Tutoring"))
const Calendar = lazy(() => import("./pages/Calendar/Calendar"))
const RequestsList = lazy(() => import("./pages/Requests/RequestsList"))
const NewRequest = lazy(() => import("./pages/Requests/NewRequest"))
const MyRequests = lazy(() => import("./pages/Requests/MyRequests"))
const RequestDetail = lazy(() => import("./pages/Requests/RequestDetail"))
const GroupsList = lazy(() => import("./pages/Groups/GroupsList"))
const NewGroup = lazy(() => import("./pages/Groups/NewGroup"))
const MyGroups = lazy(() => import("./pages/Groups/MyGroups"))
const MaterialsList = lazy(() => import("./pages/Materials/MaterialsList"))
const NewMaterial = lazy(() => import("./pages/Materials/NewMaterial"))
const MyMaterials = lazy(() => import("./pages/Materials/MyMaterials"))
const FavoriteMaterials = lazy(() => import("./pages/Materials/FavoriteMaterials"))
const Notifications = lazy(() => import("./pages/Notifications/Notifications"))
const Chat = lazy(() => import("./pages/Chat/Chat"))
const Settings = lazy(() => import("./pages/Settings/Settings"))
const Reputation = lazy(() => import("./pages/Reputation/Reputation"))
const Admin = lazy(() => import("./pages/Admin/Admin"))
const Achievements = lazy(() => import("./pages/Achievements/Achievements"))
const Analytics = lazy(() => import("./pages/Analytics/Analytics"))
const Assistant = lazy(() => import("./pages/Assistant/Assistant"))
const UserProfile = lazy(() => import("./pages/UserProfile/UserProfile"))
const Support = lazy(() => import("./pages/Support/Support"))

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <PublicThemeControl />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/restablecer-contrasena" element={<ResetPassword />} />
            <Route path="/cuenta-confirmada" element={<AccountConfirmed />} />

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
              <Route path="usuarios/:userId" element={<UserProfile />} />
              <Route path="tutorias" element={<Tutoring />} />
              <Route path="calendario" element={<Calendar />} />
              <Route path="solicitudes" element={<RequestsList />} />
              <Route path="solicitudes/nueva" element={<NewRequest />} />
              <Route path="solicitudes/mias" element={<MyRequests />} />
              <Route path="solicitudes/:requestId" element={<RequestDetail />} />
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
              <Route path="notificaciones" element={<Notifications />} />
              <Route path="configuracion" element={<Settings />} />
              <Route path="soporte" element={<Support />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
