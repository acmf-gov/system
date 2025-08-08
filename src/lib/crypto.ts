import nacl from 'tweetnacl'
import { decodeBase64, encodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util'

export interface EncryptedMessage {
  ciphertext: string
  nonce: string
  keys: Array<{
    userId: string
    encryptedKey: string
  }>
  meta: {
    senderId: string
    timestamp: number
  }
}

export class CryptoManager {
  private keyPair: nacl.BoxKeyPair | null = null
  private publicKeys: Map<string, Uint8Array> = new Map()

  constructor() {
    this.loadOrGenerateKeys()
  }

  private loadOrGenerateKeys(): void {
    if (typeof window === 'undefined') return

    const storedPrivateKey = localStorage.getItem('privateKey')
    const storedPublicKey = localStorage.getItem('publicKey')

    if (storedPrivateKey && storedPublicKey) {
      this.keyPair = {
        publicKey: decodeBase64(storedPublicKey),
        secretKey: decodeBase64(storedPrivateKey)
      }
    } else {
      this.keyPair = nacl.box.keyPair()
      localStorage.setItem('privateKey', encodeBase64(this.keyPair.secretKey))
      localStorage.setItem('publicKey', encodeBase64(this.keyPair.publicKey))
    }
  }

  getPublicKey(): string | null {
    return this.keyPair ? encodeBase64(this.keyPair.publicKey) : null
  }

  async storePublicKeyOnServer(userId: string, publicKey: string): Promise<void> {
    try {
      const response = await fetch('/api/users/public-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicKey }),
      })

      if (!response.ok) {
        console.error('Failed to store public key on server')
      }
    } catch (error) {
      console.error('Error storing public key:', error)
    }
  }

  async loadUserPublicKeys(): Promise<void> {
    try {
      const response = await fetch('/api/users/public-keys')
      if (response.ok) {
        const keys = await response.json()
        keys.forEach((key: { userId: string; publicKey: string }) => {
          this.publicKeys.set(key.userId, decodeBase64(key.publicKey))
        })
      }
    } catch (error) {
      console.error('Error loading user public keys:', error)
    }
  }

  encryptMessageForGroup(message: string, userIds: string[]): EncryptedMessage {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized')
    }

    // Generate a symmetric key for the message
    const symmetricKey = nacl.randomBytes(32)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)

    // Encrypt the message with the symmetric key
    const messageUint8 = encodeUTF8(message)
    const ciphertext = nacl.secretbox(messageUint8, nonce, symmetricKey)

    // Encrypt the symmetric key for each user
    const keys = userIds.map(userId => {
      const userPublicKey = this.publicKeys.get(userId)
      if (!userPublicKey) {
        throw new Error(`Public key not found for user ${userId}`)
      }

      const encryptedKey = nacl.box(
        symmetricKey,
        nonce,
        userPublicKey,
        this.keyPair!.secretKey
      )

      return {
        userId,
        encryptedKey: encodeBase64(encryptedKey)
      }
    })

    return {
      ciphertext: encodeBase64(ciphertext),
      nonce: encodeBase64(nonce),
      keys,
      meta: {
        senderId: '', // This should be set by the caller
        timestamp: Date.now()
      }
    }
  }

  decryptMessage(encryptedMessage: EncryptedMessage, senderId: string): string {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized')
    }

    const ciphertext = decodeBase64(encryptedMessage.ciphertext)
    const nonce = decodeBase64(encryptedMessage.nonce)

    // Find the encrypted key for this user
    const userKey = encryptedMessage.keys.find(k => k.userId === this.keyPair!.publicKey.toString())
    if (!userKey) {
      throw new Error('No encrypted key found for this user')
    }

    // Get sender's public key
    const senderPublicKey = this.publicKeys.get(senderId)
    if (!senderPublicKey) {
      throw new Error(`Public key not found for sender ${senderId}`)
    }

    // Decrypt the symmetric key
    const encryptedKey = decodeBase64(userKey.encryptedKey)
    const symmetricKey = nacl.box.open(
      encryptedKey,
      nonce,
      senderPublicKey,
      this.keyPair.secretKey
    )

    if (!symmetricKey) {
      throw new Error('Failed to decrypt symmetric key')
    }

    // Decrypt the message
    const decryptedMessage = nacl.secretbox.open(ciphertext, nonce, symmetricKey)
    if (!decryptedMessage) {
      throw new Error('Failed to decrypt message')
    }

    return decodeUTF8(decryptedMessage)
  }
}

// Singleton instance
export const cryptoManager = new CryptoManager()