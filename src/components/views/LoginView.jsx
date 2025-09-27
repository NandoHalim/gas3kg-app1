// src/components/views/LoginView.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Fingerprint,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const MotionCard = motion(Card);

export default function LoginView() {
  const { signInEmailPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [attemptCount, setAttemptCount] = useState(0);
  const [coolDown, setCoolDown] = useState(false);

  const [gestureFeedback, setGestureFeedback] = useState(null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const touchStartRef = useRef(null);
  const emailFieldRef = useRef(null);

  // Enhanced animation variants dengan lebih smooth
  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        duration: 0.6
      },
    },
  };

  const validateEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

  // App initialization dengan simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setIsAppReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberEmail");
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, []);

  // Enhanced background preload dengan gradient fallback
  useEffect(() => {
    const img = new Image();
    img.src = "/login-bg.jpg";
    img.onload = () => {
      setBgLoaded(true);
      // Add subtle fade-in effect untuk background
      document.body.style.transition = "background-image 0.8s ease-in-out";
    };
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        if (
          window.PublicKeyCredential &&
          (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
        ) {
          setSupportsBiometric(true);
        } else if ("credentials" in navigator) {
          setSupportsBiometric(true);
        }
      } catch {}
    };
    check();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailFieldRef.current && window.innerWidth < 768) {
        try {
          emailFieldRef.current.focus({ preventScroll: true });
        } catch {
          emailFieldRef.current.focus();
        }
      }
    }, 500); // Increased delay untuk better UX
    return () => clearTimeout(timer);
  }, []);

  // Enhanced keyboard detection dengan threshold
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const kbVisible = isMobile && (window.outerHeight - viewportHeight) > 100;
      setIsKeyboardVisible(kbVisible);
    };
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const safeToast = (type, message, title) => {
    if (toast?.show && typeof toast.show === "function") {
      toast.show({ type, title, message });
    } else {
      // Enhanced fallback notification
      showEnhancedNotification(message, type);
    }
  };

  const showEnhancedNotification = (message, type) => {
    const notification = document.createElement("div");
    const bgColor = type === "error" ? "#f44336" : 
                   type === "success" ? "#4caf50" : 
                   type === "warning" ? "#ff9800" : "#2196f3";
    
    notification.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: ${bgColor};
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      max-width: 85%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      backdrop-filter: blur(10px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255,255,255,0.1);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = "translateX(-50%) translateY(0)";
      notification.style.opacity = "1";
    });

    setTimeout(() => {
      // Animate out
      notification.style.transform = "translateX(-50%) translateY(-20px)";
      notification.style.opacity = "0";
      setTimeout(() => {
        try { document.body.removeChild(notification); } catch {}
      }, 400);
    }, 3200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (coolDown) {
      safeToast("warning", "Tunggu 30 detik sebelum mencoba lagi", "Peringatan");
      return;
    }
    if (loading) return;

    const em = email.trim();
    const pw = password.trim();

    if (!em || !pw) {
      setErrorMsg("Email dan password harus diisi");
      return;
    }
    if (!validateEmail(em)) {
      setErrorMsg("Format email tidak valid");
      return;
    }
    if (pw.length < 6) {
      setErrorMsg("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await signInEmailPassword(em, pw);
      setAttemptCount(0);

      if (remember) localStorage.setItem("rememberEmail", em);
      else localStorage.removeItem("rememberEmail");

      safeToast("success", "Selamat datang kembali 👋", "Login Sukses");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.message || "Email atau password salah";
      const next = attemptCount + 1;
      setAttemptCount(next);

      if (next >= 3) {
        setCoolDown(true);
        setTimeout(() => setCoolDown(false), 30_000);
        setErrorMsg("Terlalu banyak percobaan. Tunggu 30 detik.");
      } else {
        setErrorMsg(msg);
      }
      safeToast("error", msg, "Login Gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProgrammatically = async (em, pw) => {
    if (loading) return;
    if (!validateEmail(em || "")) {
      setErrorMsg("Format email tidak valid");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await signInEmailPassword(em, pw);
      setAttemptCount(0);
      
      // FIX: Handle remember me untuk biometric login
      if (remember) localStorage.setItem("rememberEmail", em);
      else localStorage.removeItem("rememberEmail");
      
      safeToast("success", "Selamat datang kembali 👋", "Login Sukses");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.message || "Autentikasi biometrik gagal";
      setErrorMsg(msg);
      safeToast("error", msg, "Login Gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!("credentials" in navigator)) {
        safeToast("info", "Fitur biometrik tidak didukung di browser ini", "Info");
        return;
      }
      const cred = await navigator.credentials.get({
        mediation: "optional",
        password: true,
      });
      if (cred) {
        const em = cred.id || "";
        const pw = cred.password || "";
        setEmail(em);
        setPassword(pw);
        await handleSubmitProgrammatically(em, pw);
      }
    } catch (error) {
      if (error?.name !== "NotAllowedError") {
        safeToast("error", "Autentikasi biometrik gagal atau dibatalkan", "Error");
      }
    }
  };

  // Enhanced touch gestures dengan visual feedback
  const onTouchStart = (e) => {
    touchStartRef.current = e.touches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    const startX = touchStartRef.current;
    if (startX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? startX;
    const diff = startX - endX;

    if (Math.abs(diff) > 30) {
      const show = diff > 0;
      setShowPass(show);
      setGestureFeedback(show ? "show" : "hide");
      
      // Enhanced feedback dengan longer duration
      setTimeout(() => setGestureFeedback(null), 600);
    }
    touchStartRef.current = null;
  };

  // Enhanced background styling dengan layered design
  const rootBg = useMemo(() => ({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: { xs: 1, sm: 2, md: 3 },
    
    // Layered background approach
    backgroundColor: "#667eea", // Base fallback color
    backgroundImage: bgLoaded 
      ? "linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url('/login-bg.jpg')"
      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: { xs: "scroll", sm: "fixed" },
    backgroundBlendMode: "overlay",
    transition: "all 0.8s ease-in-out",
    
    // Smooth loading state
    opacity: isAppReady ? 1 : 0,
    transform: isAppReady ? "scale(1)" : "scale(1.02)",
  }), [bgLoaded, isAppReady]);

  // Loading skeleton sebelum app ready
  if (!isAppReady) {
    return (
      <Box sx={{ 
        minHeight: "100dvh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <CircularProgress 
          size={60} 
          sx={{ 
            color: "white",
            opacity: 0.8
          }} 
        />
      </Box>
    );
  }

  return (
    <Fade in={isAppReady} timeout={800}>
      <Box sx={rootBg}>
        <MotionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          sx={{
            width: "100%",
            maxWidth: { xs: "95%", sm: 400, md: 420 },
            borderRadius: { xs: 3, sm: 4 }, // Enhanced border radius
            mx: "auto",
            mb: isKeyboardVisible ? "80px" : 0, // Adjusted for better spacing
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: {
              xs: "0 20px 40px rgba(0,0,0,0.25)",
              sm: "0 32px 64px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.1)",
            },
            backdropFilter: { xs: "blur(5px)", sm: "blur(12px)" },
            backgroundColor: { 
              xs: "rgba(255,255,255,0.92)", 
              sm: "rgba(255,255,255,0.96)" 
            },
            border: { 
              xs: "1px solid rgba(255,255,255,0.3)", 
              sm: "1px solid rgba(255,255,255,0.4)" 
            },
            // Subtle hover effect
            "&:hover": {
              boxShadow: {
                xs: "0 24px 48px rgba(0,0,0,0.3)",
                sm: "0 40px 80px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.15)",
              },
            },
          }}
        >
          <CardContent
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 2.5, sm: 3.5 }, // Enhanced spacing
              p: { xs: 3, sm: 4 }, // Increased padding
            }}
          >
            {/* Enhanced Header dengan better hierarchy */}
            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2.25rem" },
                  background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  letterSpacing: "-0.5px",
                  mb: 0.5,
                }}
              >
                🔐 Login
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  opacity: 0.8
                }}
              >
                Selamat datang kembali
              </Typography>
            </Box>

            {/* Enhanced Email Field */}
            <TextField
              id="email-field"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              inputRef={emailFieldRef}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": { 
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.15)",
                  },
                  "&.Mui-focused": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(25, 118, 210, 0.2)",
                  },
                },
                "& .MuiInputBase-input": { 
                  fontSize: { xs: "16px", sm: "17px" },
                  padding: { xs: "14px 16px", sm: "16px 18px" }
                },
                "& .MuiInputLabel-root": {
                  fontSize: { xs: "15px", sm: "16px" }
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 1 }}>
                    <Email fontSize="small" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Enhanced Password Field dengan gesture feedback */}
            <TextField
              label="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              fullWidth
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": { 
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.15)",
                  },
                  "&.Mui-focused": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(25, 118, 210, 0.2)",
                  },
                  border: gestureFeedback === "show" 
                    ? "2px solid rgba(25, 118, 210, 0.6)" 
                    : gestureFeedback === "hide" 
                    ? "2px solid rgba(0, 0, 0, 0.2)" 
                    : undefined,
                },
                "& .MuiInputBase-input": { 
                  fontSize: { xs: "16px", sm: "17px" },
                  padding: { xs: "14px 16px", sm: "16px 18px" }
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 1 }}>
                    <Lock fontSize="small" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPass((s) => !s)}
                      edge="end"
                      sx={{
                        padding: { xs: "10px", sm: "12px" },
                        transition: "all 0.2s ease",
                        "&:hover": { 
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                          transform: "scale(1.1)" 
                        },
                        "&:active": { transform: "scale(0.95)" },
                      }}
                    >
                      {showPass ? 
                        <VisibilityOff fontSize="small" /> : 
                        <Visibility fontSize="small" />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Enhanced Error Message */}
            {errorMsg && (
              <Fade in={!!errorMsg}>
                <Typography 
                  color="error" 
                  variant="body2" 
                  sx={{ 
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "error.light",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  ⚠️ {errorMsg}
                </Typography>
              </Fade>
            )}

            {/* Enhanced Remember Me dengan better spacing */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  sx={{ 
                    mr: 1.5,
                    "&.Mui-checked": { color: "primary.main" }
                  }}
                />
              }
              label="Ingat saya"
              sx={{ 
                m: 0,
                "& .MuiFormControlLabel-label": {
                  fontSize: "15px",
                  fontWeight: 500,
                }
              }}
            />

            {/* Enhanced Primary Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email.trim() || !password.trim()}
              sx={{
                minHeight: "52px",
                py: 1.75,
                borderRadius: 3,
                fontSize: "17px",
                fontWeight: 700,
                textTransform: "none",
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                boxShadow: "0 8px 24px rgba(25, 118, 210, 0.35)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 32px rgba(25, 118, 210, 0.45)",
                  background: "linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)",
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
                },
                "&:disabled": {
                  transform: "none",
                  boxShadow: "none",
                  opacity: 0.7,
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  transition: "left 0.5s ease",
                },
                "&:hover::before": {
                  left: "100%",
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={22} sx={{ color: "white" }} />
                  Memproses...
                </Box>
              ) : (
                "Masuk"
              )}
            </Button>

            {/* Enhanced Biometric Button */}
            {supportsBiometric && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Fingerprint />}
                onClick={handleBiometricLogin}
                sx={{
                  minHeight: "48px",
                  fontSize: "15px",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 3,
                  borderColor: "primary.main",
                  color: "primary.main",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "primary.main",
                    color: "white",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(25, 118, 210, 0.2)",
                  },
                }}
              >
                Login dengan Biometrik
              </Button>
            )}

            {/* Enhanced Footer Links */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Belum punya akun?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate("/register")}
                  sx={{ 
                    fontWeight: 700,
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" }
                  }}
                >
                  Daftar di sini
                </Link>
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  sx={{ 
                    fontWeight: 600,
                    color: "text.secondary",
                    textDecoration: "none",
                    "&:hover": { 
                      color: "primary.main",
                      textDecoration: "underline" 
                    }
                  }}
                >
                  Lupa password?
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </MotionCard>
      </Box>
    </Fade>
  );
}