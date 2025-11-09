import React from 'react'
import { Outlet } from 'react-router'

type Props = {}

const UnProtectedLayout = (props: Props) => {
  return (
    <div>
        <Outlet/>
    </div>
  )
}

export default UnProtectedLayout