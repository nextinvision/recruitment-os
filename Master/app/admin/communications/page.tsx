import { redirect } from 'next/navigation'

export default function AdminCommunicationsRedirect() {
  redirect('/admin?tab=communications')
}
