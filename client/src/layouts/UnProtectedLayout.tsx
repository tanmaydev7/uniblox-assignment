import React from 'react'
import { Outlet } from 'react-router'
import TopBar from '../components/TopBar'

type Props = {}

const UnProtectedLayout = (props: Props) => {
  return (
    <div>
        <TopBar />
        <Outlet/>
    </div>
  )
}

export default UnProtectedLayout