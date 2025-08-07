import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-secret-key-here'

// Encrypt data
export const encrypt = (data: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

// Decrypt data
export const decrypt = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

// Generate deterministic hash for searchable fields
export const generateHash = (data: string): string => {
  try {
    return CryptoJS.HmacSHA256(data, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Hash generation error:', error)
    throw new Error('Failed to generate hash')
  }
}

// Encrypt sensitive user data
export const encryptUserData = (userData: any): any => {
  const encryptedData = { ...userData }
  
  // For phone, we'll store both encrypted and hashed versions
  if (encryptedData.phone) {
    try {
      // Store the encrypted version for decryption
      encryptedData.phoneEncrypted = encrypt(encryptedData.phone)
      // Store the hashed version for searching
      encryptedData.phoneHash = generateHash(encryptedData.phone)
      // Keep the original phone for now (we'll remove it after storing)
    } catch (error) {
      console.error('Failed to encrypt phone:', error)
    }
  }
  
  // For other sensitive fields, just encrypt them
  const otherSensitiveFields = ['email', 'name']
  otherSensitiveFields.forEach(field => {
    if (encryptedData[field]) {
      try {
        encryptedData[field] = encrypt(encryptedData[field])
      } catch (error) {
        console.error(`Failed to encrypt ${field}:`, error)
      }
    }
  })
  
  return encryptedData
}

// Decrypt sensitive user data
export const decryptUserData = (encryptedData: any): any => {
  const decryptedData = { ...encryptedData }
  
  // Decrypt phone from encrypted field
  if (decryptedData.phoneEncrypted) {
    try {
      decryptedData.phone = decrypt(decryptedData.phoneEncrypted)
    } catch (error) {
      console.warn('Failed to decrypt phone, keeping original')
    }
  }
  
  // Decrypt other sensitive fields
  const otherSensitiveFields = ['email', 'name']
  otherSensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        decryptedData[field] = decrypt(decryptedData[field])
      } catch (error) {
        console.warn(`Failed to decrypt ${field}, keeping original`)
      }
    }
  })
  
  return decryptedData
}

// Generate secure random key
export const generateSecureKey = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Hash sensitive data for comparison (without storing original)
export const hashSensitiveData = (data: string): string => {
  return CryptoJS.SHA256(data).toString()
}

// Verify if sensitive data matches hash
export const verifySensitiveData = (data: string, hash: string): boolean => {
  const dataHash = hashSensitiveData(data)
  return dataHash === hash
}