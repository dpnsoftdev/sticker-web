import { Suspense } from "react";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ROLES_NAME, ROUTES_APP } from "@constants";
import AccountPage from "@pages/account";
import ErrorPage from "@pages/error";
import ForgotPasswordPage from "@pages/forgot-password";
import LoginPage from "@pages/login";
import RegisterPage from "@pages/register";
import UnauthorizedPage from "@pages/unauthorized";

import AppLayout from "./AppLayout";
import PrivateLayout from "./PrivateLayout";
import RoleBasedRoute from "./RoleBasedRoute";

const AppLoader = () => {
  return <></>;
};

const AppRouter = () => {
  const router = createBrowserRouter([
    {
      id: "app-router",
      path: ROUTES_APP.ROOT,
      element: <AppLayout />,
      ErrorBoundary: ErrorPage,
      children: [
        {
          index: true,
          element: <LoginPage />,
        },
        {
          path: ROUTES_APP.LOGIN,
          element: <LoginPage />,
        },
        {
          path: ROUTES_APP.REGISTER,
          element: <RegisterPage />,
        },
        {
          path: ROUTES_APP.FORGOT_PASSWORD,
          element: <ForgotPasswordPage />,
        },
        {
          path: ROUTES_APP.UNAUTHORIZED,
          element: <UnauthorizedPage />,
        },
        // @Private Layout
        {
          path: ROUTES_APP.ROOT,
          element: (
            <RoleBasedRoute allowedRoles={[ROLES_NAME.ADMIN]}>
              <PrivateLayout />
            </RoleBasedRoute>
          ),
          children: [
            {
              path: ROUTES_APP.ACCOUNT,
              element: <AccountPage />,
            },
          ],
        },
      ],
    },
  ]);

  return (
    <Suspense fallback={<AppLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRouter;
