import { UserRole } from '@/types/user'
import React from 'react'

interface ILink{
  label:string
  icon: React.ReactNode
}
interface SidebarProps {
  role: UserRole

}

export const DashboardSideBar = () => {
  return (
    <div className='w-full max-w-[248px] h-screen'>dashboardSideBar</div>
  )
}
