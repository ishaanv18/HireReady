interface CardProps {
    children: React.ReactNode
    variant?: 'default' | 'purple' | 'gradient'
    className?: string
}

const Card = ({ children, variant = 'default', className = '' }: CardProps) => {
    const variants = {
        default: 'bg-white border border-gray-200 shadow-lg',
        purple: 'bg-white border border-purple-100 shadow-lg hover:shadow-xl',
        gradient: 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-2xl'
    }

    return (
        <div className={`rounded-2xl transition-all duration-300 ${variants[variant]} ${className}`}>
            {children}
        </div>
    )
}

export default Card
