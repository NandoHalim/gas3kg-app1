import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function ForgotPassword() {
  const { resetPassword } = useAuth(); // pastikan AuthContext punya fungsi ini
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Email harus diisi");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      await resetPassword(email.trim()); // contoh: supabase.auth.resetPasswordForEmail(email)
      setMessage("Link reset password sudah dikirim ke email Anda.");
      toast.show({
        type: "success",
        title: "Reset Password",
        message: "Silakan cek email Anda untuk instruksi selanjutnya.",
      });
    } catch (err) {
      setMessage(err.message || "Gagal mengirim email reset password.");
      toast.show({
        type: "error",
        title: "Error",
        message: err.message || "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "url('/login-bg.jpg') center/cover no-repeat",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <CardContent
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}
        >
          <Typography variant="h5" align="center" fontWeight={700}>
            Reset Password
          </Typography>

          <TextField
            type="email"
            label="Masukkan email Anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />

          {message && (
            <Typography
              variant="body2"
              color={message.startsWith("Link") ? "success.main" : "error"}
            >
              {message}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ py: 1.5, fontWeight: 600 }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Kirim Link Reset"
            )}
          </Button>

          <Button
            fullWidth
            onClick={() => navigate("/login")}
            sx={{ textTransform: "none" }}
          >
            Kembali ke Login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
