import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export const LoginForm = () => {
  const { login, signup, resetPassword } = useAuth()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')
  const [signupName, setSignupName] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(loginEmail, loginPassword)
    if (result.success) {
      setSuccess('Exito')
      setTimeout(() => window.location.href = '/', 1000)
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    if (signupPassword !== signupPasswordConfirm) {
      setError('No match')
      setLoading(false)
      return
    }
    const result = await signup(signupEmail, signupPassword, signupName)
    if (result.success) {
      setSuccess('OK')
      setTimeout(() => window.location.href = '/', 1500)
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await resetPassword(resetEmail)
    if (result.success) {
      setSuccess(result.message)
      setResetEmail('')
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded w-96">
        <h1 className="text-2xl font-bold mb-4">RF Presupuestos</h1>
        <div className="flex gap-2 mb-4 border-b">
          <button onClick={() => setTab('login')} className={tab === 'login' ? 'text-blue-600 border-b-2' : ''}>Login</button>
          <button onClick={() => setTab('signup')} className={tab === 'signup' ? 'text-blue-600 border-b-2' : ''}>Signup</button>
          <button onClick={() => setTab('reset')} className={tab === 'reset' ? 'text-blue-600 border-b-2' : ''}>Reset</button>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-2">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" className="w-full p-2 border" required />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className="w-full p-2 border" required />
            <button type="submit" className="w-full bg-blue-600 text-white p-2">{loading ? 'Loading' : 'Login'}</button>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-2">
            <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Name" className="w-full p-2 border" required />
            <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Email" className="w-full p-2 border" required />
            <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Password" className="w-full p-2 border" required />
            <input type="password" value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)} placeholder="Confirm" className="w-full p-2 border" required />
            <button type="submit" className="w-full bg-green-600 text-white p-2">{loading ? 'Loading' : 'Signup'}</button>
          </form>
        )}

        {tab === 'reset' && (
          <form onSubmit={handleReset} className="space-y-2">
            <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email" className="w-full p-2 border" required />
            <button type="submit" className="w-full bg-orange-600 text-white p-2">{loading ? 'Loading' : 'Send'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
```

7. **Commit changes**

---

**¿Já ho has fet?**
```
✅ ELIMINAT i CREAT novo LoginForm sense react-router-dom
