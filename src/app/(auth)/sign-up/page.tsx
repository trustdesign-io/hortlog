import { RegistrationClosed } from './registration-closed'
import { SignUpForm } from './sign-up-form'

// Set REGISTRATION_OPEN=true in environment variables to re-enable public sign-up
const registrationOpen = process.env.REGISTRATION_OPEN === 'true'

export default function SignUpPage() {
  return registrationOpen ? <SignUpForm /> : <RegistrationClosed />
}
