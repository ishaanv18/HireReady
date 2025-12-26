import { useState } from 'react'
import { Calendar, Clock, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface TimeSlotPickerProps {
    company: string
    position: string
    roundType: string
    difficulty: string
    onSchedule: (scheduledTime: Date) => void
    onBack: () => void
}

export default function TimeSlotPicker({
    company,
    position,
    roundType,
    difficulty,
    onSchedule,
    onBack
}: TimeSlotPickerProps) {
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTime, setSelectedTime] = useState<string>('')

    // Generate dates starting from today
    const getAvailableDates = () => {
        const dates = []
        for (let i = 0; i <= 7; i++) { // Changed from i=1 to i=0 to include today
            const date = new Date()
            date.setDate(date.getDate() + i)
            dates.push(date)
        }
        return dates
    }

    // Generate time slots: first slot 10 mins from now, then 1-1.5 hour intervals
    const getTimeSlots = () => {
        const slots = []
        const now = new Date()
        const isToday = selectedDate === formatDateValue(new Date())

        if (isToday) {
            // First slot: current time + 10 minutes
            const firstSlot = new Date(now.getTime() + 10 * 60000)
            const firstHour = firstSlot.getHours()
            const firstMinute = firstSlot.getMinutes()
            slots.push(`${firstHour.toString().padStart(2, '0')}:${firstMinute.toString().padStart(2, '0')}`)

            // Subsequent slots: 75 minute intervals (1 hour 15 minutes - middle of 1-1.5 hours)
            let nextSlotTime = new Date(firstSlot.getTime())
            while (nextSlotTime.getHours() < 21 || (nextSlotTime.getHours() === 21 && nextSlotTime.getMinutes() === 0)) {
                // Add 75 minutes
                nextSlotTime = new Date(nextSlotTime.getTime() + 75 * 60000)

                if (nextSlotTime.getHours() < 21 || (nextSlotTime.getHours() === 21 && nextSlotTime.getMinutes() === 0)) {
                    const hour = nextSlotTime.getHours()
                    const minute = nextSlotTime.getMinutes()
                    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
                }
            }
        } else {
            // For future dates: start from 9 AM with 75 minute intervals
            let slotTime = new Date()
            slotTime.setHours(9, 0, 0, 0)

            while (slotTime.getHours() < 21) {
                const hour = slotTime.getHours()
                const minute = slotTime.getMinutes()
                slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)

                // Add 75 minutes
                slotTime = new Date(slotTime.getTime() + 75 * 60000)
            }
        }

        return slots
    }

    const formatDateValue = (date: Date) => {
        return date.toISOString().split('T')[0]
    }

    const handleSchedule = () => {
        if (selectedDate && selectedTime) {
            // Create date in local timezone (IST)
            const [hours, minutes] = selectedTime.split(':').map(Number)
            const scheduledDateTime = new Date(selectedDate)
            scheduledDateTime.setHours(hours, minutes, 0, 0)
            onSchedule(scheduledDateTime)
        }
    }

    const availableDates = getAvailableDates()
    const timeSlots = getTimeSlots()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Interview</h2>
                <p className="text-gray-600">Choose your preferred date and time</p>
                <div className="mt-2 text-sm text-purple-600">
                    {company} • {position} • {roundType} • {difficulty}
                </div>
            </div>

            {/* Date Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Select Date *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableDates.map((date, idx) => {
                        const dateValue = formatDateValue(date)
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(dateValue)}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedDate === dateValue
                                    ? 'border-purple-600 bg-purple-50 scale-105'
                                    : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="text-xs text-gray-500 mb-1">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="font-bold text-lg">
                                    {date.getDate()}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {date.toLocaleDateString('en-US', { month: 'short' })}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Clock className="inline w-4 h-4 mr-1" />
                        Select Time *
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {timeSlots.map((time) => (
                            <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${selectedTime === time
                                    ? 'border-purple-600 bg-purple-50 scale-105'
                                    : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Summary */}
            {selectedDate && selectedTime && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6"
                >
                    <div className="flex items-start space-x-3">
                        <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Interview Scheduled</h3>
                            <div className="space-y-1 text-sm text-gray-700">
                                <p><strong>Company:</strong> {company}</p>
                                <p><strong>Position:</strong> {position}</p>
                                <p><strong>Round:</strong> {roundType}</p>
                                <p><strong>Difficulty:</strong> {difficulty}</p>
                                <p><strong>Date & Time:</strong> {new Date(`${selectedDate}T${selectedTime}`).toLocaleString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                            <p className="mt-3 text-xs text-purple-600 font-medium">
                                ⚠️ You can only start this interview at the scheduled time
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-3">
                <button
                    onClick={onBack}
                    className="flex-1 px-6 py-4 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all"
                >
                    Back
                </button>
                <button
                    onClick={handleSchedule}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    Confirm Schedule
                </button>
            </div>
        </div>
    )
}
