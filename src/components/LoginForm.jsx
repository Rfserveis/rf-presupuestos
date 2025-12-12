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
      setSuccess('Inicio exitoso')
      setTimeout(() => window.location.href = '/', 1000)
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    if (signupPassword !== signupPasswordConfirm) {
      setError('Contraseñas no coinciden'); setLoading(false); return
    }
    const result = await signup(signupEmail, signupPassword, signupName)
    if (result.success) {
      setSuccess('Cuenta creada'); setTimeout(() => window.location.href = '/', 1500)
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault(); setError(null); setLoading(true)
    const result = await resetPassword(resetEmail)
    if (result.success) { setSuccess(result.message); setResetEmail('') }
    else { setError(result.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">RF Presupuestos</h1>
        <div className="flex gap-2 mt-6 mb-6 border-b">
          <button onClick={() => {setTab('login'); setError(null); setSuccess(null)}} className={`flex-1 py-2 ${tab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>Login</button>
          <button onClick={() => {setTab('signup'); setError(null); setSuccess(null)}} className={`flex-1 py-2 ${tab === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>Signup</button>
          <button onClick={() => {setTab('reset'); setError(null); setSuccess(null)}} className={`flex-1 py-2 ${tab === 'reset' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>Reset</button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        {tab === 'login' && (<form onSubmit={handleLogin} className="space-y-4"><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border rounded" required/><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2 border rounded" required/><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Loading' : 'Login'}</button></form>)}
        {tab === 'signup' && (<form onSubmit={handleSignup} className="space-y-4"><input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Name" className="w-full px-4 py-2 border rounded" required/><input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border rounded" required/><input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2 border rounded" required/><input type="password" value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)} placeholder="Confirm" className="w-full px-4 py-2 border rounded" required/><button type="submit" className="w-full bg-green-600 text-white py-2 rounded">{loading ? 'Loading' : 'Signup'}</button></form>)}
        {tab === 'reset' && (<form onSubmit={handleReset} className="space-y-4"><input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border rounded" required/><button type="submit" className="w-full bg-orange-600 text-white py-2 rounded">{loading ? 'Loading' : 'Send'}</button></form>)}
      </div>
    </div>
  )
}
```

**Clica "Commit changes"**

---

**¿Já ho has fet?**
```
✅ Copia sense react-router-dom pujada a GitHub
❌ Vull explicació
