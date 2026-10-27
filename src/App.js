import React from "react";
import "@/App.css";
import { BrowserRouter, StaticRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import Home from "@/pages/HomeRedesign";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthConfirm from "@/pages/AuthConfirm";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import PublicPage from "@/pages/PublicPage";
import ShortRedirect from "@/pages/ShortRedirect";
import NotFound from "@/pages/NotFound";

import DashboardLayout from "@/components/DashboardLayoutPremium";
import DashOverview from "@/pages/dashboard/OverviewRedesign";
import DashPageBuilder from "@/pages/dashboard/PageBuilder";
import DashLinks from "@/pages/dashboard/Links";
import DashServices from "@/pages/dashboard/Services";
import DashAppointments from "@/pages/dashboard/Appointments";
import DashNotifications from "@/pages/dashboard/Notifications";
import DashSettings from "@/pages/dashboard/Settings";
import DashPlan from "@/pages/dashboard/Plan";
import { safeAuthReturn } from "@/lib/plans";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl, classifyPath, pageSeo } from "../shared/seo.mjs";

import AdminLayout from "@/components/AdminLayout";
import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminPages from "@/pages/admin/Pages";
import AdminLinks from "@/pages/admin/Links";
import AdminAppointments from "@/pages/admin/Appointments";
import AdminTickets from "@/pages/admin/Tickets";
import AdminAnnouncements from "@/pages/admin/Announcements";

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
