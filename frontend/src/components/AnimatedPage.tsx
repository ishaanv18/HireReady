import { motion } from 'framer-motion'

interface AnimatedPageProps {
    children: React.ReactNode
    className?: string
}

const AnimatedPage = ({ children, className = '' }: AnimatedPageProps) => {
    return (
        <motion.div
            className={`w-full h-full ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
        >
            {children}
        </motion.div>
    )
}

export default AnimatedPage
