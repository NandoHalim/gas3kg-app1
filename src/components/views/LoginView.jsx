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

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
      },
    },
  };

  const validateEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppReady(true), 600);
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

  useEffect(() => {
    const img = new Image();
    img.src = "/login-bg.jpg";
    img.onload = () => setBgLoaded(true);
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
    }, 400);
    return () => clearTimeout(timer);
  }, []);

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
      alert(`${title ? title + ": " : ""}${message}`);
    }
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
      setTimeout(() => setGestureFeedback(null), 500);
    }
    touchStartRef.current = null;
  };

  // BACKGROUND LEBIH TERANG dan CARD LEBIH KECIL
  const rootBg = useMemo(() => ({
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: { xs: 2, sm: 3 },
    
    // Background lebih terang dan jelas
    backgroundColor: "#667eea",
    backgroundImage: bgLoaded 
      ? "linear-gradient(135deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%), url('/login-bg.jpg')"
      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: { xs: "scroll", sm: "fixed" },
    backgroundBlendMode: "overlay",
    transition: "all 0.6s ease-in-out",
    
    opacity: isAppReady ? 1 : 0,
  }), [bgLoaded, isAppReady]);

  if (!isAppReady) {
    return (
      <Box sx={{ 
        minHeight: "100dvh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <CircularProgress size={50} sx={{ color: "white" }} />
      </Box>
    );
  }

  return (
    <Fade in={isAppReady} timeout={600}>
      <Box sx={rootBg}>
        <MotionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          sx={{
            width: "100%",
            maxWidth: { xs: "90%", sm: 380, md: 400 }, // Card lebih kecil
            borderRadius: 2.5,
            mx: "auto",
            mb: isKeyboardVisible ? "60px" : 0,
            transition: "all 0.3s ease",
            boxShadow: {
              xs: "0 8px 32px rgba(0,0,0,0.15)",
              sm: "0 12px 48px rgba(0,0,0,0.12)",
            },
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(255,255,255,0.96)", // Lebih solid
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <CardContent
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5, // Gap lebih compact
              p: { xs: 2.5, sm: 3 }, // Padding lebih kecil
            }}
          >
            {/* Header yang lebih compact */}
            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2rem" }, // Ukuran lebih reasonable
                  background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  mb: 0.5,
                }}
              >
                🔐 Login
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ 
                  fontSize: "0.95rem",
                  opacity: 0.8
                }}
              >
                Selamat datang kembali
              </Typography>
            </Box>

            {/* Form fields yang lebih compact */}
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
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.1)",
                  },
                },
                "& .MuiInputBase-input": { 
                  fontSize: "15px",
                  padding: "14px 16px",
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
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.1)",
                  },
                },
                "& .MuiInputBase-input": { 
                  fontSize: "15px",
                  padding: "14px 16px",
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
                      sx={{ padding: "8px" }}
                    >
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {errorMsg && (
              <Fade in={!!errorMsg}>
                <Typography 
                  color="error" 
                  variant="body2" 
                  sx={{ 
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "error.light",
                    fontSize: "14px",
                  }}
                >
                  ⚠️ {errorMsg}
                </Typography>
              </Fade>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  size="small"
                />
              }
              label="Ingat saya"
              sx={{ 
                "& .MuiFormControlLabel-label": {
                  fontSize: "14px",
                }
              }}
            />

            {/* Button yang lebih compact tapi tetap prominent */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email.trim() || !password.trim()}
              sx={{
                minHeight: "46px",
                py: 1.25,
                borderRadius: 2,
                fontSize: "15px",
                fontWeight: 600,
                textTransform: "none",
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} sx={{ color: "white" }} />
                  Memproses...
                </Box>
              ) : (
                "Masuk"
              )}
            </Button>

            {supportsBiometric && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Fingerprint />}
                onClick={handleBiometricLogin}
                sx={{
                  minHeight: "42px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: 2,
                  borderColor: "primary.main",
                  color: "primary.main",
                }}
              >
                Login dengan Biometrik
              </Button>
            )}

            {/* Footer links yang compact */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px", mb: 1.5 }}>
                Belum punya akun?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate("/register")}
                  sx={{ 
                    fontWeight: 600,
                    color: "primary.main",
                    fontSize: "14px",
                  }}
                >
                  Daftar di sini
                </Link>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  sx={{ 
                    fontWeight: 500,
                    color: "text.secondary",
                    fontSize: "14px",
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