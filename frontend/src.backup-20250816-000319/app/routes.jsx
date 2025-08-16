import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/app/layout/RootLayout";
import Services from "@/features/services/pages/Services";
import ServiceDetail from "@/features/services/pages/ServiceDetail";
import Booking from "@/features/booking/pages/Booking";
import MyBookings from "@/features/booking/pages/MyBookings";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import CreateService from "@/features/admin/pages/CreateService";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Services /> },
      { path: "services/:id", element: <ServiceDetail /> },
      {
        path: "booking",
        element: (
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-bookings",
        element: (
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/create-service",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <CreateService />
          </ProtectedRoute>
        ),
      },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
]);
