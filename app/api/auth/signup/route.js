import { NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '../../../../lib/users.js'
import { hashPassword, signToken, COOKIE_NAME, COOKIE_OPTIONS } from '../../../../lib/auth.js'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({ name: name.trim(), email: email.trim(), passwordHash })

    const token = await signToken({ id: user.id, name: user.name, email: user.email })

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } })
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return response
  } catch (err) {
    if (err.message === 'Email already in use') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
