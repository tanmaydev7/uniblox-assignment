import { Loader2 } from 'lucide-react'
import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import UnProtectedLayout from '../layouts/UnProtectedLayout'
import Products from '../pages/store/Products'
import ProductDetail from '../pages/store/ProductDetail'
import Cart from '../pages/store/Cart'

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
            <Route element={<UnProtectedLayout/>} >
                <Route path={"store"} element={<Products/>} />
                <Route path={"store/product/:id"} element={<ProductDetail/>} />
                <Route path={"store/cart"} element={<Cart/>} />
            </Route>
            <Route path="/" element={<Navigate to="/store" />} />
            <Route path={"*"} element={<Navigate to={"/store"}/>}  />
        </Routes>
    )
}

export default RoutesManager