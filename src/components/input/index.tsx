export const Input = ({ type, value, onChange }: { type: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    return (    
        <input className="w-full px-4 py-3 rounded-lg bg-[#171717] focus:outline-none focus:border-grey-400 transition-colors" type={type} value={value} onChange={onChange} />
    )
}

export default Input;