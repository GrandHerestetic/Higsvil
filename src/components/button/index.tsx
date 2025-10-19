export const Button = ({ 
    children, 
    onClick, 
    variant = "default",
    disabled = false
}: { 
    children: React.ReactNode, 
    onClick: () => void,
    variant?: "default" | "square",
    disabled?: boolean
}) => {
    const baseClasses = "rounded-lg bg-custom-lime text-black font-semibold hover:bg-custom-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variantClasses = variant === "square" 
        ? "w-20 aspect-square flex items-center justify-center" 
        : "w-full px-6 py-3"
    
    return (
        <button 
            className={`${baseClasses} ${variantClasses}`} 
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    )
}