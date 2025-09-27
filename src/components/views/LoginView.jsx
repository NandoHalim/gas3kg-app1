// src/components/views/LoginView.jsx
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
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
import { Visibility, VisibilityOff, Email, Lock, Fingerprint } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// === Konteks aplikasi (tetap sama dengan logika lama) ===
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const MotionCard = motion(Card);

// Lazy component contoh (untuk demo lazy load bundle di mobile)
const HeavyComponent = React.lazy(() => import(/* webpackChunkName: "heavy-chunk" */ "./_HeavyComponentDemo.jsx"));

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

  // === Mobile-first helpers ===
  const [bgLoaded, setBgLoaded] = useState(false);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const touchStartRef = useRef(null);
  const emailFieldRef = useRef(null);

  // Prefill remember me (tetap)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberEmail");
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, []);

  // Lazy load background image untuk mobile performance
  useEffect(() => {
    const img = new Image();
    img.src = "/login-bg.jpg";
    img.onload = () => setBgLoaded(true);
  }, []);

  // Deteksi dukungan kredensial sederhana (progressive enhancement)
  useEffect(() => {
    try {
      if ("credentials" in navigator) setSupportsBiometric(true);
    } catch {}
  }, []);

  // Auto-focus yang tidak memaksa scroll (menghindari layout jump di mobile)
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

  const safeToast = (type, message, title) => {
    if (toast?.show && typeof toast.show === "function") {
      toast.show({ type, title, message });
    } else {
      // Fallback: notifikasi ringan yang mobile-friendly
      showMobileNotification(message, type);
    }
  };

  const showMobileNotification = (message, type) => {
    const n = document.createElement("div");
    n.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === "error" ? "#f44336" : "#4caf50"};
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      z-index: 10000;
      font-size: 14px;
      max-width: 90%;
      text-align: center;
      box-shadow: 0 6px 16px rgba(0,0,0,.15);
    `;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => {
      try { document.body.removeChild(n); } catch {}
    }, 2800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const em = email.trim();
    const pw = password.trim();
    if (!em || !pw) return;

    setLoading(true);
    setErrorMsg("");
    try {
      await signInEmailPassword(em, pw);

      if (remember) localStorage.setItem("rememberEmail", em);
      else localStorage.removeItem("rememberEmail");

      safeToast("success", "Selamat datang kembali 👋", "Login Sukses");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.message || "Email atau password salah";
      setErrorMsg(msg);
      safeToast("error", msg, "Login Gagal");
    } finally {
      setLoading(false);
    }
  };

  // Biometric (progressive enhancement – akan fallback jika tidak didukung)
  const handleBiometricLogin = async () => {
    try {
      // Catatan: Ini hanya contoh sederhana.
      // Untuk produksi, gunakan WebAuthn/Passkeys dengan server-side verification.
      if (!("credentials" in navigator)) return;
      const cred = await navigator.credentials.get({ mediation: "optional", password: true });
      if (cred) {
        setEmail(cred.id || "");
        setPassword(cred.password || "");
        // Submit setelah isi field
        const fakeEvent = new Event("submit");
        // Kirim via handler
        await handleSubmit(fakeEvent);
      }
    } catch {
      safeToast("error", "Biometric login tidak tersedia atau dibatalkan", "Info");
    }
  };

  // Gesture swipe pada field password untuk show/hide
  const onTouchStart = (e) => {
    touchStartRef.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    const startX = touchStartRef.current;
    if (startX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? startX;
    const diff = startX - endX;
    if (diff > 50) setShowPass(true);      // swipe kiri -> show
    else if (diff < -50) setShowPass(false); // swipe kanan -> hide
    touchStartRef.current = null;
  };

  // Style memo untuk menghindari re-render mahal di mobile
  const rootBg = useMemo(() => ({
    minHeight: "100dvh", // dynamic viewport height untuk mobile
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: { xs: 1, sm: 2, md: 3 },
    backgroundImage:
      bgLoaded
        ? { xs: "none", sm: "url('/login-bg.jpg')" }
        : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: { xs: "scroll", sm: "fixed" },
    background: {
      xs: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      sm: "none",
    },
  }), [bgLoaded]);

  return (
    <Box sx={rootBg}>
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          width: "100%",
          maxWidth: { xs: "95%", sm: 400, md: 420 },
          borderRadius: { xs: 2, sm: 3 },
          mx: "auto",
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
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3 },
          }}
          noValidate
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight={700}
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem" },
              mb: { xs: 1, sm: 2 },
              background: { sm: "linear-gradient(45deg, #1976d2, #42a5f5)" },
              backgroundClip: { sm: "text" },
              WebkitBackgroundClip: { sm: "text" },
              color: { xs: "inherit", sm: "transparent" },
              userSelect: "none",
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
            inputMode="email" // Keyboard optimization
            inputRef={emailFieldRef}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-2px)" },
              },
              "& .MuiInputLabel-root": { fontSize: { xs: "14px", sm: "16px" } },
              "& .MuiInputBase-input": { fontSize: { xs: "16px", sm: "18px" } }, // iOS prevent zoom
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email fontSize="small" />
                </InputAdornment>
              ),
              style: { fontSize: "16px" }, // iOS prevent zoom (fallback)
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
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-2px)" },
              },
              "& .MuiInputLabel-root": { fontSize: { xs: "14px", sm: "16px" } },
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
                      padding: { xs: "8px", sm: "12px" }, // larger touch target
                      "&:active": { backgroundColor: "rgba(0,0,0,0.05)" },
                    }}
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              style: { fontSize: "16px" }, // iOS prevent zoom (fallback)
            }}
          />

          {errorMsg && (
            <Typography color="error" variant="body2" sx={{ mt: -0.5 }}>
              ⚠️ {errorMsg}
            </Typography>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                sx={{ mr: 1 }}
              />
            }
            label="Ingat saya"
            sx={{ m: 0 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !email.trim() || !password.trim()}
            sx={{
              minHeight: "44px", // touch target min
              py: 1.5,
              borderRadius: 2,
              fontSize: "16px", // cegah zoom iOS
              fontWeight: 600,
              textTransform: "none",
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              boxShadow: "0 4px 15px rgba(25,118,210,0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(25,118,210,0.4)",
              },
              "&:active": { transform: "translateY(0)" },
              mt: 0.5,
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
              sx={{
                minHeight: "44px",
                fontSize: "16px",
              }}
            >
              Login dengan Biometrik
            </Button>
          )}

          <Box sx={{ textAlign: "center" }}>
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
                sx={{ fontWeight: 500 }}
              >
                Lupa password?
              </Link>
            </Typography>
          </Box>

          {/* Contoh penggunaan lazy component hanya bila diperlukan */}
          <Suspense fallback={null}>
            {false && <HeavyComponent />}
          </Suspense>
        </CardContent>
      </MotionCard>
    </Box>
  );
}
