import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home,
    FileText,
    MessageCircle,
    Menu,
    X,
    Sparkles,
    User,
    BarChart3
} from 'lucide-react'
import { UserButton, useUser, useClerk } from '@clerk/clerk-react'
import { useToast } from './ToastNotification'
import { useEffect } from 'react'

interface SidebarProps {
    isCollapsed: boolean
    setIsCollapsed: (value: boolean) => void
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
    const location = useLocation()
    const { user } = useUser()
    const { session } = useClerk()
    const toast = useToast()

    // Detect logout
    useEffect(() => {
        if (!session && !user) {
            // User has logged out
            toast.info('You have been logged out successfully')
        }
    }, [session, user, toast])

    const menuItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'from-purple-500 to-purple-600' },
        { path: '/resume', icon: FileText, label: 'Resume Analyzer', color: 'from-blue-500 to-purple-600' },
        { path: '/interview', icon: MessageCircle, label: 'AI Interview', color: 'from-green-500 to-purple-600' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics', color: 'from-orange-500 to-purple-600' },
    ]

    const sidebarVariants = {
        expanded: { width: '280px' },
        collapsed: { width: '80px' }
    }

    const contentVariants = {
        expanded: { opacity: 1, x: 0 },
        collapsed: { opacity: 0, x: -20 }
    }

    return (
        <>
            {/* Mobile overlay */}
            {!isCollapsed && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            <motion.div
                className="bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white h-screen fixed left-0 top-0 z-50 shadow-2xl"
                variants={sidebarVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                data-tour="sidebar"
            >
                {/* Header */}
                <div className="p-6 border-b border-purple-700/50">
                    <div className="flex items-center justify-between">
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    variants={contentVariants}
                                    initial="collapsed"
                                    animate="expanded"
                                    exit="collapsed"
                                    className="flex items-center space-x-3"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                            HireReady
                                        </h1>
                                        <p className="text-xs text-purple-300">AI Interview Coach</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 rounded-lg hover:bg-purple-700/50 transition-colors duration-200"
                        >
                            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path

                        return (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    className={`
                    relative flex items-center p-3 rounded-xl transition-all duration-200 group
                    ${isActive
                                            ? 'bg-white/10 shadow-lg border border-white/20'
                                            : 'hover:bg-white/5 hover:shadow-md'
                                        }
                  `}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-pink-400 rounded-r-full"
                                            layoutId="activeIndicator"
                                        />
                                    )}

                                    {/* Icon with gradient background */}
                                    <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isActive
                                            ? `bg-gradient-to-r ${item.color} shadow-lg`
                                            : 'bg-white/10 group-hover:bg-white/20'
                                        }
                    transition-all duration-200
                  `}>
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-200'}`} />
                                    </div>

                                    {/* Label */}
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.div
                                                variants={contentVariants}
                                                initial="collapsed"
                                                animate="expanded"
                                                exit="collapsed"
                                                className="ml-4 flex-1"
                                            >
                                                <span className={`
                          font-medium text-sm
                          ${isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'}
                          transition-colors duration-200
                        `}>
                                                    {item.label}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Hover effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-purple-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    />
                                </motion.div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-700/50">
                    {/* User Info */}
                    <div className="mb-4">
                        <AnimatePresence>
                            {!isCollapsed ? (
                                <motion.div
                                    variants={contentVariants}
                                    initial="collapsed"
                                    animate="expanded"
                                    exit="collapsed"
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white truncate">
                                                {user?.firstName || user?.username || 'User'}
                                            </p>
                                            <p className="text-xs text-purple-300">Online</p>
                                        </div>
                                    </div>
                                    <div className="scale-75" data-tour="user-menu">
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    variants={contentVariants}
                                    initial="expanded"
                                    animate="collapsed"
                                    exit="expanded"
                                    className="flex justify-center"
                                >
                                    <div className="scale-75">
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                variants={contentVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                                className="text-center"
                            >
                                <p className="text-xs text-purple-300">
                                    Powered by AI
                                </p>
                                <div className="mt-2 flex justify-center">
                                    <div className="w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    )
}

export default Sidebar
