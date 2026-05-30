import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SearchParking from './pages/SearchParking'
import ParkingDetails from './pages/ParkingDetails'
import AddParking from './pages/AddParking'
import HowItWorks from './pages/HowItWorks'
import NotFound from './pages/NotFound'

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchParking />} />
          <Route path="/parking/:id" element={<ParkingDetails />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/owner/dashboard" element={
            <ProtectedRoute roles={['OWNER']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/owner/add-parking" element={
            <ProtectedRoute roles={['OWNER']}>
              <AddParking />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
