import { Await, Navigate, Outlet, Route, Routes } from "react-router-dom";
import React, { Suspense, lazy, useState, useEffect } from "react";
import isLogin from "../utils/isLogin";


const Login = lazy(() => import("../pages/Login/login"));
const LoginLayout = lazy(() => import("../pages/Login/loginLayout"));
const Layout = lazy(() => import("../pages/Layout/layout"));
const NotFound = lazy(() => import("../pages/NotFound/404"));
const SignUp = lazy(() => import("../pages/Admin/SignUp/signup"));
const Box = lazy(() => import("../pages/Box/box"));
const Thread = lazy(() => import("../pages/Thread/thread"));
const Search = lazy(() => import("../pages/Search/search"));
const Home = lazy(() => import("../pages/Home/home"));
const Profile = lazy(() => import("../pages/Profile/profile"));
const Admin = lazy(() => import("../pages/Admin/admin"));
const Notification = lazy(() => import("../pages/Notification/notification"));
const ForgotPassword = lazy(() =>
  import("../pages/Login/ForgotPassword/forgotPassword")
);
const ResetPassword = lazy(() =>
  import("../pages/Login/ForgotPassword/resetPassword")
);
const UserProfile = lazy(() => import("../pages/UserProfile/userProfile"));
const Management = lazy(() => import("../pages/Admin/Management/management"));
const AuthRequiredRoute = ({ auth, element }) => {
  return auth ? element : <Navigate to="/login" />;
};

function Router() {
  const [state, setState] = useState({ isLoading: true, authenticated: false, user: {} });
  useEffect(() => {
    async function checkAuth() {
      const isAuth = await isLogin();
      setState({ isLoading: false, authenticated: !!isAuth, user: isAuth || {} });
    }
    checkAuth();
  }, []);
  if (state.isLoading) {
    return (
    
      <div className="d-flex text-warning align-items-center justify-content-center py-4  vh-100"
      style={{backgroundColor: '#162B40'}}
      >
        <div class="d-flex justify-content-center ">
          <div class="spinner-border" role="status"></div>

      </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthRequiredRoute auth={state.authenticated} element={<Layout />} />
        }
      >
        <Route exact path="/" element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="management/user" element={<Management />} />
        <Route path="management" element={<Management />} />
        <Route path="box/:box_id" element={<Box />} />
        <Route path="box/:box_id/:page" element={<Box />} />
        <Route path="thread/:thread_id" element={<Thread />} />
        <Route path="thread/:thread_id/:page" element={<Thread />} />
        <Route path="search/:page" element={<Search />} />
        <Route path="user/:user_id" element={<UserProfile user={state.user} />} />
        <Route path="*" element={<NotFound />} />
        <Route path="notification" element={<Notification />} />
      </Route>
      <Route
        exact
        path="/signup"
        element={
          <AuthRequiredRoute auth={state.authenticated} element={<SignUp />} />
        }
      />
      <Route path="/login" element={<LoginLayout auth={state.authenticated} />}>
        <Route exact path="/login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:reset_token" element={<ResetPassword />} />
      </Route>
      <Route path="*" element={<NotFound />} />

      <Route path="/admin" element={<Admin auth={state.authenticated} />} />
    </Routes>
  );
}

export default Router;
