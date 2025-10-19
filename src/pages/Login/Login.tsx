import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/button'
import { Input } from '../../components/input'

function Login() {
    const [activeForm, setActiveForm] = useState<'login' | 'register'>('login')
    const { login, register } = useAuth()
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [registerEmail, setRegisterEmail] = useState('')
    const [registerPassword, setRegisterPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await login(loginEmail, loginPassword)
        } catch (err: any) {
            const errorMessage = err.message || 'Error logging in. Please check your data.'
            if (errorMessage.includes('auth/user-not-found')) {
                setError('User not found')
            } else if (errorMessage.includes('auth/wrong-password')) {
                setError('Wrong password')
            } else if (errorMessage.includes('auth/invalid-email')) {
                setError('Invalid email format')
            } else if (errorMessage.includes('auth/invalid-credential')) {
                setError('Invalid credentials')
            } else {
                setError(errorMessage)
            }
        }
    }

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault()
        setError('')

        if (registerPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (registerPassword.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        try {
            await register(registerEmail, registerPassword)
        } catch (err: any) {
            const errorMessage = err.message || 'Registration error. Please try again.'
            if (errorMessage.includes('auth/email-already-in-use')) {
                setError('Email already registered')
            } else if (errorMessage.includes('auth/invalid-email')) {
                setError('Invalid email format')
            } else if (errorMessage.includes('auth/weak-password')) {
                setError('Too simple password')
            } else {
                setError(errorMessage)
            }
        }
    }

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            <div className={`absolute inset-y-0 left-0 w-[30%] flex min-h-screen  border-r-2 border-custom-lime items-center justify-center transition-transform duration-500 ease-in-out ${activeForm === 'login' ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="p-8 rounded-lg w-full max-w-sm">
                    <h2 className="text-3xl font-bold text-left mb-6">
                        Login to <i>Higgsfield</i>
                    </h2>

                    {error && activeForm === 'login' && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg ">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="login-email" className="block font-semibold mb-2">
                                Email
                            </label>
                            <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block font-semibold mb-2">
                                Password
                            </label>
                            <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                        </div>
                        <Button onClick={() => { }}>Login</Button>
                    </form>

                    <p className="text-left mt-4">
                        Don't have an account?{' '}
                        <button
                            onClick={() => setActiveForm('register')}
                            className="hover:underline cursor-pointer text-custom-white"
                        >
                            Register here
                        </button>
                    </p>
                </div>
            </div>
            <div className={`absolute inset-y-0 right-0 w-[30%] flex min-h-screen border-l-2 border-custom-lime items-center justify-center transition-transform duration-500 ease-in-out ${activeForm === 'register' ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="p-8 rounded-lg w-full max-w-sm">
                    <h2 className="text-3xl font-bold text-left mb-6">
                        Create Account
                    </h2>

                    {error && activeForm === 'register' && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg ">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleRegister}>
                        <div>
                            <label htmlFor="register-email" className="block font-semibold mb-2">
                                Email
                            </label>
                            <Input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
                        </div>

                        <div>
                            <label htmlFor="register-password" className="block font-semibold mb-2">
                                Password
                            </label>
                            <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block font-semibold mb-2">
                                Confirm Password
                            </label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>

                        <Button onClick={() => { }}>Create Account</Button>
                    </form>

                    <p className="text-right mt-4">
                        Already have an account?{' '}
                        <button
                            onClick={() => setActiveForm('login')}
                            className="hover:underline cursor-pointer text-custom-white"
                        >
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
