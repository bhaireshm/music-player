import { useAuth } from '@/hooks/useAuth'
import { theme1Dark } from "@/lib/theme"
import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from './page'

// Mock the hooks
jest.mock('@/hooks/useAuth')
jest.mock('next/navigation')

const renderWithMantine = (ui: React.ReactNode) => {
  return render(
    <MantineProvider theme={theme1Dark} forceColorScheme="dark">{ui}</MantineProvider>
  )
}

describe('LoginPage', () => {
  const mockSignIn = jest.fn()
  const mockSignInWithGoogle = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

      // Default mock implementations
      ; (useAuth as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        signInWithGoogle: mockSignInWithGoogle,
        loading: false,
        error: null,
      })

      ; (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      })

      ; (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      })
  })

  it('renders login form', () => {
    renderWithMantine(<LoginPage />)

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('handles email/password submission', async () => {
    renderWithMantine(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('handles google sign in', async () => {
    renderWithMantine(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }))

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })

    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('displays error message on failure', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

    renderWithMantine(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'wrong' } })

    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})
