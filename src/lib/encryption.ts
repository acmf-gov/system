import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-secret-key-here'

// Ensure we have a valid encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'your-256-bit-secret-key-here') {
  throw new Error('ENCRYPTION_KEY environment variable is not set or is using default value')
}

// Encrypt data
export const encrypt = (data: string): string => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Data to encrypt is empty')
    }
    
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
    
    if (!encrypted || encrypted.length === 0) {
      throw new Error('Encryption failed - empty result')
    }
    
    return encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

// Decrypt data
export const decrypt = (encryptedData: string): string => {
  try {
    // Check if the data is empty or not properly formatted
    if (!encryptedData || encryptedData.length === 0) {
      throw new Error('Encrypted data is empty')
    }
    
    // Check if it's already in plain text (not encrypted)
    if (!encryptedData.includes('U2FsdGVkX1')) { // AES encrypted data prefix
      return encryptedData
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    
    // Check if decrypted data is valid
    if (!decrypted || decrypted.length === 0) {
      throw new Error('Decrypted data is empty')
    }
    
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
      const decryptedPhone = decrypt(decryptedData.phoneEncrypted)
      if (decryptedPhone && decryptedPhone.length > 0) {
        decryptedData.phone = decryptedPhone
      }
    } catch (error) {
      console.warn('Failed to decrypt phone, keeping original')
      // Keep the original phone if decryption fails
      if (decryptedData.phone) {
        // If original phone exists, keep it
      } else {
        // If no original phone, try to use the encrypted one as fallback
        decryptedData.phone = decryptedData.phoneEncrypted
      }
    }
  }
  
  // Decrypt other sensitive fields
  const otherSensitiveFields = ['email', 'name']
  otherSensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        // Check if it's already decrypted (not encrypted format)
        if (typeof decryptedData[field] === 'string' && !decryptedData[field].includes('U2FsdGVkX1')) {
          // Already decrypted, keep as is
          return
        }
        
        const decryptedField = decrypt(decryptedData[field])
        if (decryptedField && decryptedField.length > 0) {
          decryptedData[field] = decryptedField
        }
      } catch (error) {
        console.warn(`Failed to decrypt ${field}, keeping original`)
        // Keep the original field if decryption fails
        // If the field looks encrypted, try to use it as is
        if (typeof decryptedData[field] === 'string' && decryptedData[field].includes('U2FsdGVkX1')) {
          // It's encrypted but we can't decrypt it, keep it encrypted
        }
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