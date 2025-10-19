import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from '../config/firebase'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  user: { email: string; uid: string } | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ email: string; uid: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser && firebaseUser.email) {
        setUser({ 
          email: firebaseUser.email,
          uid: firebaseUser.uid 
        })
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (error: any) {
      console.error('Ошибка входа:', error)
      throw new Error(error.message || 'Неверные учетные данные')
    }
  }

  const register = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (error: any) {
      console.error('Ошибка регистрации:', error)
      throw new Error(error.message || 'Ошибка регистрации')
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error: any) {
      console.error('Ошибка выхода:', error)
      throw new Error(error.message || 'Ошибка выхода')
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

