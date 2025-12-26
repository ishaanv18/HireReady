import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Auth API
export const authAPI = {
    registerExtraData: (data: {
        clerkUserId: string
        username: string
        email: string
        privacyPolicyAccepted: boolean
        termsAccepted: boolean
        aiUsageConsentAccepted: boolean
    }) => api.post('/auth/register-extra-data', data),

    sendOTP: (userId: string) => api.post('/auth/send-otp', { userId }),

    verifyOTP: (userId: string, code: string) =>
        api.post('/auth/verify-otp', { userId, code }),

    login: (clerkUserId: string, sessionToken?: string) =>
        api.post('/auth/login', { clerkUserId, sessionToken }),
}

// Resume API
export const resumeAPI = {
    analyze: (formData: FormData) => {
        return api.post('/resume/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    getReport: (userId: string) => api.get(`/resume/report/${userId}`),

    getHistory: (userId: string) => api.get(`/resume/history/${userId}`),

    getById: (resumeId: string) => api.get(`/resume/${resumeId}`),

    delete: (resumeId: string) => api.delete(`/resume/${resumeId}`),
}

// Interview API
export const interviewAPI = {
    start: (data: { userId: string; role: string; mode: string }) =>
        api.post('/interview/start', data),

    submitAnswer: (data: { sessionId: string; questionText: string; userAnswer: string }) =>
        api.post('/interview/submit-answer', data),

    complete: (sessionId: string) =>
        api.post(`/interview/complete/${sessionId}`),

    getHistory: (userId: string) =>
        api.get(`/interview/history/${userId}`),

    getSession: (sessionId: string) =>
        api.get(`/interview/session/${sessionId}`),

    getActive: (userId: string) =>
        api.get(`/interview/active/${userId}`),

    suggestCompanies: (query: string) =>
        api.get(`/interview/suggest-companies?query=${encodeURIComponent(query)}`),

    suggestRoles: (query: string, company?: string) =>
        api.get(`/interview/suggest-roles?query=${encodeURIComponent(query)}${company ? `&company=${encodeURIComponent(company)}` : ''}`),

    suggestPositions: (role: string, company?: string) =>
        api.get(`/interview/suggest-positions?role=${encodeURIComponent(role)}${company ? `&company=${encodeURIComponent(company)}` : ''}`),

    scheduleInterview: (data: {
        userId: string
        company: string
        role: string
        position: string
        roundType: string
        difficulty: string
        scheduledTime: string
    }) => api.post('/interview/schedule', null, { params: data }),

    getSchedules: (userId: string) =>
        api.get(`/interview/schedules/${userId}`),

    canStart: (scheduleId: string) =>
        api.get(`/interview/can-start/${scheduleId}`),

    deleteSchedule: (scheduleId: string) =>
        api.delete(`/interview/schedule/${scheduleId}`),

    // Live Interview APIs
    startLiveInterview: (scheduleId: string) =>
        api.post('/interview/live/start', null, { params: { scheduleId } }),

    getNextQuestion: (sessionId: string, previousAnswer?: string) =>
        api.post('/interview/live/next-question', null, {
            params: { sessionId, previousAnswer: previousAnswer || '' }
        }),

    endInterview: (sessionId: string) =>
        api.post('/interview/live/end', null, { params: { sessionId } }),

    getEvaluationReport: (sessionId: string) =>
        api.get(`/interview/live/report/${sessionId}`)
}

// Dashboard API
export const dashboardAPI = {
    getMetrics: (userId: string) =>
        api.get(`/user/dashboard-metrics/${userId}`),
}

export default api
