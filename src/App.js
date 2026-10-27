import React from "react";
import "@/App.css";
import { BrowserRouter, StaticRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import Home from "@/screens/HomeRedesign";
import Pricing from "@/screens/Pricing";
import Login from "@/screens/Login";
import Signup from "@/screens/Signup";
import AuthConfirm from "@/screens/AuthConfirm";
import ForgotPassword from "@/screens/ForgotPassword";
import ResetPassword from "@/screens/ResetPassword";
import PublicPage from "@/screens/PublicPage";
import ShortRedirect from "@/screens/ShortRedirect";
import NotFound from "@/screens/NotFound";

import DashboardLayout from "@/components/DashboardLayoutPremium";
import DashOverview from "@/screens/dashboard/OverviewRedesign";
import DashPageBuilder from "@/screens/dashboard/PageBuilder";
import DashLinks from "@/screens/dashboard/Links";
import DashServices from "@/screens/dashboard/Services";
import DashAppointments from "@/screens/dashboard/Appointments";
import DashNotifications from "@/screens/dashboard/Notifications";
import DashSettings from "@/screens/dashboard/Settings";
import DashPlan from "@/screens/dashboard/Plan";
import { safeAuthReturn } from "@/lib/plans";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl, classifyPath, pageSeo } from "../shared/seo.mjs";

import AdminLayout from "@/components/AdminLayout";
import AdminOverview from "@/screens/admin/Overview";
import AdminUsers from "@/screens/admin/Users";
import AdminPages from "@/screens/admin/Pages";
import AdminLinks from "@/screens/admin/Links";
import AdminAppointments from "@/screens/admin/Appointments";
import AdminTickets from "@/screens/admin/Tickets";
import AdminAnnouncements from "@/screens/admin/Announcements";

function Protected({ children, adminOnly = false }) {
    const { user, loading, authError, refresh } = useAuth();
    const location = useLocation();
    const [retrying, setRetrying] = React.useState(false);
    if (loading || retrying) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground" role="status">در حال بررسی حساب…</div>
            </div>
        );
    }
    if (!user && authError) return <div className="pro-error-state" role="alert"><h1>ارتباط با حساب برقرار نشد.</h1><p>{authError}</p><button type="button" onClick={async () => { setRetrying(true); try { await refresh(); } catch {} finally { setRetrying(false); } }}>تلاش دوباره</button></div>;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
    return children;
}

function GuestOnly({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div className="py-12 text-center" role="status">در حال بررسی حساب…</div>;
    if (user) return <Navigate to={safeAuthReturn(location.state?.from, user.role === "admin" ? "/admin" : "/dashboard")} replace />;
    return children;
}

function NavigationSeo() {
    const { pathname } = useLocation();
    if (["home", "pricing", "business"].includes(classifyPath(pathname))) return null;
    const seo = pageSeo(pathname);
    return <SeoHead title={seo.title} description={seo.description} keywords={[]} canonical={absoluteUrl(pathname)} noIndex />;
}

function App({ initialPath = "/", initialPlans, initialPublicData } = {}) {
    const Router = typeof window === "undefined" ? StaticRouter : BrowserRouter;
    return (
        <div className="App" dir="rtl">
            <AuthProvider>
                <Router location={initialPath}>
                    <NavigationSeo />
                    <Routes>
                        {/* Public */}
                        <Route path="/" element={<Home initialPlans={initialPlans} />} />
                        <Route path="/pricing" element={<Pricing initialPlans={initialPlans} />} />
                        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                        <Route path="/auth/confirm" element={<AuthConfirm />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/u/:username" element={<PublicPage initialData={initialPublicData} />} />
                        <Route path="/r/:slug" element={<ShortRedirect />} />

                        {/* Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                <Protected>
                                    <DashboardLayout />
                                </Protected>
                            }
                        >
                            <Route index element={<DashOverview />} />
                            <Route path="page" element={<DashPageBuilder />} />
                            <Route path="links" element={<DashLinks />} />
                            <Route path="services" element={<DashServices />} />
                            <Route path="appointments" element={<DashAppointments />} />
                            <Route path="notifications" element={<DashNotifications />} />
                            <Route path="settings" element={<DashSettings />} />
                            <Route path="plan" element={<DashPlan />} />
                        </Route>

                        {/* Admin */}
                        <Route
                            path="/admin"
                            element={
                                <Protected adminOnly>
                                    <AdminLayout />
                                </Protected>
                            }
                        >
                            <Route index element={<AdminOverview />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="pages" element={<AdminPages />} />
                            <Route path="links" element={<AdminLinks />} />
                            <Route path="appointments" element={<AdminAppointments />} />
                            <Route path="tickets" element={<AdminTickets />} />
                            <Route path="announcements" element={<AdminAnnouncements />} />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
                <Toaster position="top-center" dir="rtl" />
            </AuthProvider>
        </div>
    );
}

export default App;
