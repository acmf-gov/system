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

// Encrypt sensitive user data
export const encryptUserData = (userData: any): any => {
  const sensitiveFields = ['phone', 'email', 'name']
  const encryptedData = { ...userData }
  
  sensitiveFields.forEach(field => {
    if (encryptedData[field]) {
      encryptedData[field] = encrypt(encryptedData[field])
    }
  })
  
  return encryptedData
}

// Decrypt sensitive user data
export const decryptUserData = (encryptedData: any): any => {
  const sensitiveFields = ['phone', 'email', 'name']
  const decryptedData = { ...encryptedData }
  
  sensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        decryptedData[field] = decrypt(decryptedData[field])
      } catch (error) {
        // If decryption fails, keep original data
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