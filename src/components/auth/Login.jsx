// components/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import vanurtechLogo from "../../assets/logo.png";

const SolarLogoIcon = ({ className = "h-10 w-auto" }) => (
  <img
    src={vanurtechLogo}
    alt="Vanurtech Solar"
    className={`${className} object-contain`}
  />
);

const ERROR_TYPES = {
  REQUIRED: "REQUIRED",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  RATE_LIMIT: "RATE_LIMIT",
  PERMISSION_DENIED: "PERMISSION_DENIED",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError, setError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  useEffect(() => {
    setLocalError(null);
    setSuccessMessage("");

    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
      }));
    }
  }, []);

  const validateEmail = (email) => {
    if (!email) return "Email address is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleError = (error) => {
    let errorMessage = "An unexpected error occurred. Please try again.";
    let errorType = ERROR_TYPES.SERVER_ERROR;

    if (error.type) {
      errorType = error.type;
      switch (error.type) {
        case ERROR_TYPES.REQUIRED:
          errorMessage = "Please fill in all required fields";
          break;
        case ERROR_TYPES.INVALID_EMAIL:
          errorMessage = "Please enter a valid email address";
          break;
        case ERROR_TYPES.INVALID_PASSWORD:
          errorMessage = "Please enter a valid password (min 6 characters)";
          break;
        case ERROR_TYPES.UNAUTHORIZED:
          errorMessage = "Invalid email or password. Please try again.";
          break;
        case ERROR_TYPES.PERMISSION_DENIED:
          errorMessage = "You do not have permission to access the system.";
          break;
        default:
          errorMessage = error.message || "An error occurred. Please try again.";
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    setLocalError({ message: errorMessage, type: errorType });
    setError(errorMessage);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (localError || authError) {
      setLocalError(null);
      setError("");
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else if (name === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);

    setErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });

    if (emailErr || passwordErr) {
      handleError({
        type: ERROR_TYPES.REQUIRED,
        message: "Please enter a valid email and password.",
      });
      return;
    }

    setLoading(true);
    setLocalError(null);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result?.success) {
        const userData = result.user;
        const userRole = userData?.role;

        const normalizedRoleMap = {
          SUPER_ADMIN: "SUPER_ADMIN",
          super_admin: "SUPER_ADMIN",
          superadmin: "SUPER_ADMIN",
          Head_office: "ADMIN",
          Admin_panel: "ADMIN",
          ADMIN: "ADMIN",
          ZSM: "PROJECT_HEAD",
          PROJECT_HEAD: "PROJECT_HEAD",
          Incharge: "SUPERVISOR",
          SUPERVISOR: "SUPERVISOR",
          TEAM: "INSTALLER",
          INSTALLER: "INSTALLER",
          MANAGER: "MANAGER",
        };

        const normalizedRole = normalizedRoleMap[userRole] || userRole;

        if (formData.rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        setSuccessMessage("Login successful! Redirecting to dashboard...");

        setTimeout(() => {
          if (normalizedRole === "SUPER_ADMIN") {
            navigate("/super-admin", { replace: true });
          } else if (normalizedRole === "INSTALLER") {
            navigate("/attendance", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 1000);
      } else {
        handleError({
          type: ERROR_TYPES.UNAUTHORIZED,
          message: result?.error || "Invalid email or password",
        });
      }
    } catch (err) {
      handleError({
        type: ERROR_TYPES.SERVER_ERROR,
        message: err.message || "Failed to login. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E1B4B] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans text-slate-100">
      
      {/* Background Soft Glow Circles */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Fine Mesh Background Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(rgba(129, 140, 248, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Sleek Split Login Container Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[980px] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[580px]"
      >
        
        {/* LEFT COLUMN: Modern Sunset Solar Illustration Side */}
        <div className="w-full md:w-[46%] relative bg-slate-950 overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 min-h-[320px] md:min-h-full">
          
          {/* High-res Solar House Sunset Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105 opacity-90"
            style={{ backgroundImage: `url('/solar-house-login.png')` }}
          />

          {/* Elegant Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/80 via-[#111827]/70 to-[#0B0F19]/95" />

          {/* Top Brand & Tagline */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="h-12 px-3 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                <SolarLogoIcon className="h-9 w-auto max-w-[130px]" />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-extrabold tracking-tight text-white">SOLAR</span>
                <span className="text-xl font-extrabold tracking-tight text-purple-400 ml-1.5">CRM</span>
              </div>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              Powering Connections. Driving Growth.
            </p>
          </div>

          {/* 3 Sleek Feature Pills */}
          <div className="relative z-10 space-y-3 mt-6 md:mt-auto">
            {/* Feature 1 */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Secure &amp; Reliable</h4>
                <p className="text-[11px] text-slate-300">Enterprise grade security to keep your data protected.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Smart Insights</h4>
                <p className="text-[11px] text-slate-300">Real-time analytics to help you make better decisions.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Built for Solar Businesses</h4>
                <p className="text-[11px] text-slate-300">Everything you need to manage leads &amp; projects.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pure White Crisp Login Form Side */}
        <div className="w-full md:w-[54%] bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-slate-900">
          
          <div>
            {/* Form Header */}
            <div className="flex flex-col items-center text-center">
              <div className="h-16 px-5 py-2 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center mb-3.5 shadow-md shadow-indigo-100/50">
                <SolarLogoIcon className="h-12 w-auto max-w-[170px]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign In to Vanurtech Solar
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your credentials to access your admin dashboard
              </p>
            </div>

            {/* Error Feedback Alert */}
            <AnimatePresence>
              {(localError || authError) && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{localError?.message || authError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Feedback Alert */}
            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="font-medium">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DIRECT LOGIN FORM (NO FORGOT PASSWORD) */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    placeholder="youremail@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl text-sm border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                      touched.email && errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15"
                    }`}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl text-sm border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                      touched.password && errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox ONLY (NO Forgot Password) */}
              <div className="flex items-center pt-0.5">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none font-medium text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <LockKeyhole className="w-3.5 h-3.5 text-slate-400" />
              <span>Protected with enterprise-grade SSL encryption.</span>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Vanurtech Solar. All rights reserved.
            </p>
            <p className="text-[10px] text-indigo-600 mt-1 font-bold">
              Version 2.1.0 &bull; Security Verified
            </p>
          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default Login;
