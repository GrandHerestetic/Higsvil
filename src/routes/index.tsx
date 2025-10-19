import { Route, Routes } from "react-router-dom"
import Home from "../pages/Home"
import Login from "../pages/Login/Login"
import { ProtectedRoute } from "../components/ProtectedRoute"
import Editor from "../pages/Editor"
import { Projects } from "../pages/Projects"

export const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
    </Routes>
  )
}