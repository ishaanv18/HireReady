import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CompanyRoleSearchProps {
    onNext: (company: string, role: string) => void
}

export default function CompanyRoleSearch({ onNext }: CompanyRoleSearchProps) {
    const [company, setCompany] = useState('')
    const [role, setRole] = useState('')
    const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
    const [roleSuggestions, setRoleSuggestions] = useState<string[]>([])
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
    const [loadingCompanies, setLoadingCompanies] = useState(false)
    const [loadingRoles, setLoadingRoles] = useState(false)

    // Comprehensive company list for local filtering
    const ALL_COMPANIES = [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Spotify',
        'Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG', 'IBM', 'Oracle', 'SAP', 'Salesforce', 'Adobe',
        'Intel', 'NVIDIA', 'AMD', 'Qualcomm', 'Cisco', 'VMware', 'Dell', 'HP', 'Lenovo', 'Samsung',
        'Sony', 'LG', 'Panasonic', 'Toshiba', 'Fujitsu', 'NEC', 'Hitachi', 'Canon', 'Nikon', 'Epson',
        'Infosys', 'TCS', 'Wipro', 'HCL', 'Tech Mahindra', 'Cognizant', 'Capgemini', 'Atos', 'DXC Technology',
        'PayPal', 'Square', 'Stripe', 'Visa', 'Mastercard', 'American Express', 'JPMorgan', 'Goldman Sachs',
        'Morgan Stanley', 'Bank of America', 'Citigroup', 'Wells Fargo', 'HSBC', 'Barclays', 'Deutsche Bank',
        'Twitter', 'LinkedIn', 'Snapchat', 'Pinterest', 'Reddit', 'TikTok', 'Discord', 'Slack', 'Zoom',
        'Dropbox', 'Box', 'Atlassian', 'ServiceNow', 'Workday', 'Splunk', 'Twilio', 'Shopify', 'Squarespace'
    ]

    const ALL_ROLES = [
        'Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'QA Engineer',
        'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
        'Cloud Architect', 'Security Engineer', 'Machine Learning Engineer', 'Data Engineer', 'Business Analyst',
        'Project Manager', 'Scrum Master', 'Technical Writer', 'Solutions Architect', 'Site Reliability Engineer',
        'Database Administrator', 'Network Engineer', 'Systems Administrator', 'IT Support', 'Help Desk',
        'Marketing Manager', 'Sales Engineer', 'Account Manager', 'Customer Success Manager', 'HR Manager'
    ]

    // Smart local filtering for companies
    useEffect(() => {
        if (company.length >= 0) { // Changed from >= 2 to >= 0
            setLoadingCompanies(true)
            const timer = setTimeout(() => {
                const filtered = company.length === 0
                    ? ALL_COMPANIES // Show ALL companies when empty
                    : ALL_COMPANIES.filter(c =>
                        c.toLowerCase().includes(company.toLowerCase())
                    ) // Show ALL matching companies
                setCompanySuggestions(filtered)
                setLoadingCompanies(false)
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [company])

    // Smart local filtering for roles
    useEffect(() => {
        if (role.length >= 0) { // Changed from >= 2 to >= 0
            setLoadingRoles(true)
            const timer = setTimeout(() => {
                const filtered = role.length === 0
                    ? ALL_ROLES // Show ALL roles when empty
                    : ALL_ROLES.filter(r =>
                        r.toLowerCase().includes(role.toLowerCase())
                    ) // Show ALL matching roles
                setRoleSuggestions(filtered)
                setLoadingRoles(false)
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [role, company])

    const handleNext = () => {
        if (company && role) {
            onNext(company, role)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Company & Role</h2>
                <p className="text-gray-600">Tell us about the position you're applying for</p>
            </div>

            {/* Company Input */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        onFocus={() => setShowCompanySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                        placeholder="e.g., Google, Microsoft, Amazon..."
                        className="w-full px-4 py-3 pl-10 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    {loadingCompanies && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Company Suggestions */}
                <AnimatePresence>
                    {showCompanySuggestions && companySuggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                        >
                            {companySuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        setCompany(suggestion)
                                        setShowCompanySuggestions(false)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Role Input */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        onFocus={() => setShowRoleSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                        placeholder="e.g., Software Engineer, Data Scientist..."
                        className="w-full px-4 py-3 pl-10 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    {loadingRoles && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Role Suggestions */}
                <AnimatePresence>
                    {showRoleSuggestions && roleSuggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                        >
                            {roleSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        setRole(suggestion)
                                        setShowRoleSuggestions(false)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Next Button */}
            <button
                onClick={handleNext}
                disabled={!company || !role}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                Next: Job Configuration
            </button>
        </div>
    )
}
