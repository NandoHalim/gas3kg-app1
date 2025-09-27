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

  const touchStartRef = useRef(null);
  const emailFieldRef = useRef(null);

  // Animasi
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 24, stiffness: 260 },
    },
  };

  // Validasi email
  const validateEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

  // Remember me
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberEmail");
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, []);

  // Preload background image (gate render)
  useEffect(() => {
    const img = new Image();
    img.src = "/login-bg.jpg";
    img.onload = () => setBgLoaded(true);
  }, []);

  // Cek dukungan biometric (Credential Management / WebAuthn)
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

  // Auto-focus mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailFieldRef.current && window.innerWidth < 768) {
        try {
          emailFieldRef.current.focus({ preventScroll: true });
        } catch {
          emailFieldRef.current.focus();
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard-aware (mobile)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const kbVisible = isMobile && window.innerHeight < window.outerHeight;
      setIsKeyboardVisible(kbVisible);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const safeToast = (type, message, title) => {
    if (toast?.show && typeof toast.show === "function") {
      toast.show({ type, title, message });
    } else {
      alert(`${title ? title + ": " : ""}${message}`);
    }
  };

  // Submit normal (form)
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

  // Submit programatik (untuk biometric)
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

  // Biometric login (credential password retrieval; bukan passkey murni)
  const handleBiometricLogin = async () => {
    try {
      if (!("credentials" in navigator)) {
        safeToast("info", "Fitur biometrik tidak didukung", "Info");
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
        safeToast("error", "Autentikasi biometrik gagal", "Error");
      }
    }
  };

  // Gesture untuk show/hide password
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
      setTimeout(() => setGestureFeedback(null), 450);
    }
    touchStartRef.current = null;
  };

  // === Gate render: jika gambar belum siap, jangan render apa pun (tanpa gradient) ===
  if (!bgLoaded) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Bisa kosongkan total jika mau tanpa apa pun:
            return null;
           Di sini pakai spinner kecil agar user paham sedang memuat. */}
        <CircularProgress />
      </Box>
    );
  }

  // Background murni foto (tanpa gradient, tanpa overlay)
  const rootBg = useMemo(
    () => ({
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: { xs: 1, sm: 2, md: 3 },
      backgroundImage: "url('/login-bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: { xs: "scroll", sm: "fixed" },
    }),
    []
  );

  return (
    <Box sx={rootBg}>
      <MotionCard
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        sx={{
          width: "100%",
          maxWidth: { xs: "95%", sm: 400, md: 420 },
          borderRadius: { xs: 2, sm: 3 },
          mx: "auto",
          mb: isKeyboardVisible ? "72px" : 0,
          transition: "margin-bottom .3s ease",
          boxShadow: {
            xs: "0 10px 30px rgba(0,0,0,0.3)",
            sm: "0 20px 40px rgba(0,0,0,0.1)",
          },
          backdropFilter: { sm: "blur(10px)" },
          backgroundColor: { sm: "rgba(255,255,255,0.95)" },
          border: { sm: "1px solid rgba(255,255,255,0.2)" },
        }}
      >
        <CardContent
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight={700}
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem" },
              mb: { xs: 1, sm: 2 },
              background: {
                sm: "linear-gradient(45deg, #1976d2, #42a5f5)",
              },
              backgroundClip: { sm: "text" },
              WebkitBackgroundClip: { sm: "text" },
              color: { xs: "inherit", sm: "transparent" },
            }}
          >
            🔐 Login
          </Typography>

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
                transition: "all .3s ease",
                "&:hover": { transform: "translateY(-2px)" },
              },
              "& .MuiInputBase-input": { fontSize: { xs: "16px", sm: "18px" } },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email fontSize="small" />
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
                transition: "all .3s ease",
                "&:hover": { transform: "translateY(-2px)" },
                boxShadow:
                  gestureFeedback === "show"
                    ? "0 0 0 2px rgba(25,118,210,.4) inset"
                    : gestureFeedback === "hide"
                    ? "0 0 0 2px rgba(0,0,0,.25) inset"
                    : "none",
              },
              "& .MuiInputBase-input": { fontSize: { xs: "16px", sm: "18px" } },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPass((s) => !s)}
                    edge="end"
                    sx={{
                      padding: { xs: "8px", sm: "12px" },
                      "&:active": { backgroundColor: "rgba(0,0,0,0.05)" },
                    }}
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {errorMsg && (
            <Typography color="error" variant="body2">
              ⚠️ {errorMsg}
            </Typography>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
            }
            label="Ingat saya"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !email.trim() || !password.trim()}
            sx={{
              minHeight: "44px",
              py: 1.5,
              borderRadius: 2,
              fontSize: "16px",
              fontWeight: 600,
              textTransform: "none",
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              boxShadow: "0 4px 15px rgba(25,118,210,0.3)",
              transition: "all .3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(25,118,210,0.4)",
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "white" }} />
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
              sx={{ minHeight: "44px", fontSize: "16px" }}
            >
              Login dengan Biometrik
            </Button>
          )}

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Belum punya akun?{" "}
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/register")}
                sx={{ fontWeight: 600 }}
              >
                Daftar di sini
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/forgot-password")}
              >
                Lupa password?
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </MotionCard>
    </Box>
  );
}
