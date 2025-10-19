import { type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/icon.avif'

interface LayoutProps {
    children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
    const { isAuthenticated, logout, user } = useAuth()
    const location = useLocation()
    const isLoginPage = location.pathname === '/login'
    const navigate = useNavigate()
    return (
        <div className="min-h-screen  bg-custom-black text-custom-lime flex">
            {isAuthenticated && !isLoginPage && (
                <header className="max-w-[75px] min-h-screen items-center bg-custom-lime text-custom-black border-custom-lime/30 px-2 py-4 flex flex-col justify-between">
                    <div className="flex flex-col gap-4 justify-between items-center">
                        <div className="text-sm font-semibold">
                            <button
                                onClick={() => { navigate('/') }}
                                className="w-[50px] h-[50px] border border-custom-black bg-custom-lime text-custom-black rounded-lg font-semibold transition-colors"
                            >
                                <img src={logo} alt="Higgsfield" className="w-full h-full object-contain" style={{ transform: 'rotate(360deg)' }} />
                            </button>

                        </div>
                        <div className="flex flex-col gap-2 text-sm font-semibold">
                            <button
                                onClick={() => { navigate('/editor') }}
                                className="w-[50px] h-[50px] p-2 border border-custom-black bg-custom-lime text-custom-black rounded-lg font-semibold transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M256 320L216.5 359.5C203.9 354.6 190.3 352 176 352C114.1 352 64 402.1 64 464C64 525.9 114.1 576 176 576C237.9 576 288 525.9 288 464C288 449.7 285.3 436.1 280.5 423.5L563.2 140.8C570.3 133.7 570.3 122.3 563.2 115.2C534.9 86.9 489.1 86.9 460.8 115.2L320 256L280.5 216.5C285.4 203.9 288 190.3 288 176C288 114.1 237.9 64 176 64C114.1 64 64 114.1 64 176C64 237.9 114.1 288 176 288C190.3 288 203.9 285.3 216.5 280.5L256 320zM353.9 417.9L460.8 524.8C489.1 553.1 534.9 553.1 563.2 524.8C570.3 517.7 570.3 506.3 563.2 499.2L417.9 353.9L353.9 417.9zM128 176C128 149.5 149.5 128 176 128C202.5 128 224 149.5 224 176C224 202.5 202.5 224 176 224C149.5 224 128 202.5 128 176zM176 416C202.5 416 224 437.5 224 464C224 490.5 202.5 512 176 512C149.5 512 128 490.5 128 464C128 437.5 149.5 416 176 416z" /></svg>
                            </button>
                            <button
                                onClick={() => { navigate('/projects') }}
                                className="w-[50px] h-[50px] p-2 border border-custom-black bg-custom-lime text-custom-black rounded-lg font-semibold transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end items-center">
                        <button
                            onClick={logout}
                            className="w-[50px] h-[50px] p-2 border border-custom-black bg-custom-lime text-custom-black rounded-lg font-semibold transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M569 337C578.4 327.6 578.4 312.4 569 303.1L425 159C418.1 152.1 407.8 150.1 398.8 153.8C389.8 157.5 384 166.3 384 176L384 256L272 256C245.5 256 224 277.5 224 304L224 336C224 362.5 245.5 384 272 384L384 384L384 464C384 473.7 389.8 482.5 398.8 486.2C407.8 489.9 418.1 487.9 425 481L569 337zM224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160z" /></svg>
                        </button>
                    </div>
                </header>
            )}
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}