import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react'

interface TourStep {
    target: string
    title: string
    description: string
    position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface OnboardingTourProps {
    steps: TourStep[]
    onComplete: () => void
    onSkip: () => void
}

export default function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

    useEffect(() => {
        if (steps[currentStep]?.target) {
            const element = document.querySelector(steps[currentStep].target) as HTMLElement
            setTargetElement(element)

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }, [currentStep, steps])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onComplete()
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const getTooltipPosition = () => {
        if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

        const rect = targetElement.getBoundingClientRect()
        const position = steps[currentStep].position

        switch (position) {
            case 'top':
                return {
                    top: `${rect.top - 20}px`,
                    left: `${rect.left + rect.width / 2}px`,
                    transform: 'translate(-50%, -100%)'
                }
            case 'bottom':
                return {
                    top: `${rect.bottom + 20}px`,
                    left: `${rect.left + rect.width / 2}px`,
                    transform: 'translate(-50%, 0)'
                }
            case 'left':
                return {
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.left - 20}px`,
                    transform: 'translate(-100%, -50%)'
                }
            case 'right':
                return {
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.right + 20}px`,
                    transform: 'translate(0, -50%)'
                }
            default:
                return {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }
        }
    }

    const step = steps[currentStep]

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onSkip}
                />

                {/* Highlight target element */}
                {targetElement && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute pointer-events-none"
                        style={{
                            top: targetElement.getBoundingClientRect().top - 8,
                            left: targetElement.getBoundingClientRect().left - 8,
                            width: targetElement.getBoundingClientRect().width + 16,
                            height: targetElement.getBoundingClientRect().height + 16,
                            border: '3px solid #a855f7',
                            borderRadius: '12px',
                            boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.2), 0 0 30px rgba(168, 85, 247, 0.4)'
                        }}
                    />
                )}

                {/* Tooltip */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bg-white rounded-2xl shadow-2xl p-6 max-w-md"
                    style={getTooltipPosition()}
                >
                    {/* Close button */}
                    <button
                        onClick={onSkip}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-1 mb-4">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'w-8 bg-purple-600'
                                        : index < currentStep
                                            ? 'w-1.5 bg-purple-400'
                                            : 'w-1.5 bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Step counter */}
                    <div className="text-sm text-gray-500 mb-4">
                        Step {currentStep + 1} of {steps.length}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={onSkip}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            Skip Tour
                        </button>

                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrevious}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

// Helper component to trigger tour
export function TourTrigger({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
            title="Start Tour"
        >
            <HelpCircle className="w-6 h-6" />
        </button>
    )
}
