interface ProgressBarProps {
    value: number
    max?: number
    className?: string
    showLabel?: boolean
}

const ProgressBar = ({ value, max = 100, className = '', showLabel = true }: ProgressBarProps) => {
    const percentage = Math.min((value / max) * 100, 100)

    const getColor = () => {
        if (percentage >= 80) return 'from-green-500 to-emerald-600'
        if (percentage >= 60) return 'from-blue-500 to-purple-600'
        if (percentage >= 40) return 'from-orange-500 to-yellow-600'
        return 'from-red-500 to-orange-600'
    }

    return (
        <div className={`w-full ${className}`}>
            <div className="flex items-center justify-between mb-2">
                {showLabel && (
                    <span className="text-sm font-medium text-gray-700">
                        {percentage.toFixed(0)}%
                    </span>
                )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

export default ProgressBar
