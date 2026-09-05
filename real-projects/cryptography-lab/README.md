# Cryptography Implementation Lab

A complete, from-scratch implementation of fundamental cryptographic algorithms in Python. This project demonstrates the inner workings of modern cryptography without relying on cryptographic libraries.

## Implemented Algorithms

### Symmetric Encryption (AES-128)
- AES-128 encryption and decryption
- SubBytes, ShiftRows, MixColumns, AddRoundKey transformations
- Key expansion (128-bit key schedule)
- CBC mode with PKCS7 padding

### Asymmetric Encryption (RSA)
- Prime generation using Miller-Rabin primality test
- RSA key pair generation (public/private keys)
- Encryption and decryption
- Digital signature creation and verification

### Hash Functions
- SHA-256 (from scratch)
- MD5 (from scratch)
- HMAC (Hash-based Message Authentication Code)

## Project Structure

```
cryptography-lab/
├── main.py          # CLI interface demonstrating all algorithms
├── aes.py           # AES-128 implementation
├── rsa.py           # RSA implementation with Miller-Rabin
├── hashes.py        # SHA-256, MD5, HMAC implementations
├── utils.py         # Mathematical utility functions
├── tests.py         # Comprehensive test suite
├── requirements.txt # Project dependencies
└── README.md        # This file
```

## Installation

No external dependencies required - uses only Python standard library!

```bash
cd cryptography-lab
python main.py
```

## Usage

### Interactive CLI

```bash
python main.py
```

This launches an interactive menu allowing you to:
1. Encrypt/decrypt text using AES-128
2. Generate RSA key pairs
3. Encrypt/decrypt messages with RSA
4. Create/verify digital signatures
5. Hash messages with SHA-256 or MD5
6. Generate HMACs for message authentication
7. Run the test suite

### Programmatic Usage

```python
from aes import AES
from rsa import RSA
from hashes import SHA256, MD5, HMAC

# AES Encryption
aes = AES(b'0123456789abcdef')  # 16-byte key
plaintext = b'Hello, World! This is a secret message.'
ciphertext = aes.encrypt_cbc(plaintext)
decrypted = aes.decrypt_cbc(ciphertext)
assert decrypted == plaintext

# RSA Encryption
rsa = RSA(key_size=1024)
public_key, private_key = rsa.generate_keypair()
encrypted = rsa.encrypt(b"Secret message", public_key)
decrypted = rsa.decrypt(encrypted, private_key)
assert decrypted == b"Secret message"

# SHA-256 Hashing
sha = SHA256()
digest = sha.hash(b"Hello, World!")

# HMAC
hmac = HMAC(b"secret-key")
tag = hmac.compute(b"message")
```

## Running Tests

```bash
python tests.py
```

The test suite validates all implementations against known test vectors and runs comprehensive checks for correctness, edge cases, and security properties.

## Educational Notes

This project is designed for **educational purposes**. While the implementations are correct and functional, they are not constant-time and should NOT be used in production systems where timing attacks are a concern.

### Algorithm Details

#### AES (Advanced Encryption Standard)
- **Block size**: 128 bits (16 bytes)
- **Key size**: 128 bits
- **Rounds**: 10
- **Operations**: SubBytes (S-box substitution), ShiftRows (byte permutation), MixColumns (matrix multiplication), AddRoundKey (XOR with round key)

#### RSA
- **Key sizes**: 1024-4096 bits (default: 2048)
- **Padding**: Textbook RSA (for educational clarity)
- **Primality testing**: Miller-Rabin with configurable iterations
- **Security**: Based on difficulty of factoring large semiprimes

#### SHA-256
- **Output**: 256-bit hash
- **Block size**: 512 bits
- **Operations**: Merkle-Damgård construction with compression function
- **Rounds**: 64 per block

#### MD5
- **Output**: 128-bit hash
- **Block size**: 512 bits
- **Rounds**: 64 per block
- **Note**: MD5 is cryptographically broken - included for educational comparison only

## Security Considerations

- **Not for production use** - This is an educational implementation
- No side-channel attack protections (constant-time operations)
- Textbook RSA without proper padding (OAEP)
- Key management not implemented
- No secure memory handling

## License

MIT License - For educational use

## Author

Created as a comprehensive cryptography learning resource demonstrating how modern cryptographic primitives work at the algorithmic level.
