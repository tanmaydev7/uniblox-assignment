import { Loader2 } from 'lucide-react'
import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import UnProtectedLayout from '../layouts/UnProtectedLayout'
import Products from '../pages/store/Products'

// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" />
    </div>
)

type Props = {}

const RoutesManager = (props: Props) => {
    return (
    <Routes>
        {/* Public routes */}
        <Route path={"/store"} element={<Products/>} />
        <Route path="/" element={<Navigate to="/store" />} />
        <Route path={"*"} element={<Navigate to={"/store"}/>}  />

    </Routes>
    )
}

export default RoutesManager