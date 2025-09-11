// src/utils/validators.js

// Cek apakah nama customer hanya huruf & spasi
export function isValidCustomerName(name = "") {
  return /^[A-Za-z\s]+$/.test(name.trim());
}
