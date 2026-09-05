"""
RSA Encryption/Decryption Implementation.

This module provides a complete implementation of the RSA algorithm including:
- Prime number generation using Miller-Rabin primality test
- RSA key pair generation
- Encryption and decryption
- Digital signature creation and verification

RSA Security: Based on the computational difficulty of factoring large
semiprimes (products of two large primes).

Reference: RSA Algorithm (Rivest, Shamir, Adleman, 1977)

Note: This is a textbook RSA implementation for educational purposes.
Production systems should use proper padding schemes like OAEP.
"""

import os
import hashlib
from typing import Tuple, Optional
from utils import (
    mod_exp, gcd, mod_inverse, generate_prime,
    bytes_to_int, int_to_bytes
)


class RSA:
    """
    RSA encryption/decryption implementation.
    
    Supports:
    - Key pair generation
    - Encryption/decryption
    - Digital signature creation/verification
    """
    
    # Common public exponents
    PUBLIC_EXPONENT = 65537  # 2^16 + 1 (F4)
    
    def __init__(self, key_size: int = 2048):
        """
        Initialize RSA with specified key size.
        
        Args:
            key_size: Size of RSA key in bits (must be >= 256)
        """
        if key_size < 256:
            raise ValueError("Key size must be at least 256 bits")
        if key_size % 64 != 0:
            raise ValueError("Key size must be a multiple of 64")
        
        self.key_size = key_size
        self.half_size = key_size // 2
    
    def generate_keypair(self) -> Tuple[Tuple[int, int], Tuple[int, int]]:
        """
        Generate an RSA key pair.
        
        Returns:
            Tuple of ((public_key, private_key)) where each key is (n, e) or (n, d)
        
        Process:
        1. Generate two distinct large primes p and q
        2. Compute n = p * q (modulus)
        3. Compute φ(n) = (p-1)(q-1) (Euler's totient)
        4. Choose e such that 1 < e < φ(n) and gcd(e, φ(n)) = 1
        5. Compute d = e^(-1) mod φ(n) (private exponent)
        """
        print(f"Generating {self.key_size}-bit RSA key pair...")
        
        # Generate two distinct large primes
        p = generate_prime(self.half_size)
        q = generate_prime(self.half_size)
        
        # Ensure p != q (extremely unlikely but possible)
        while p == q:
            q = generate_prime(self.half_size)
        
        # Compute n = p * q
        n = p * q
        
        # Compute Euler's totient φ(n) = (p-1)(q-1)
        phi_n = (p - 1) * (q - 1)
        
        # Choose public exponent e
        e = self._find_public_exponent(phi_n)
        
        # Compute private exponent d
        d = mod_inverse(e, phi_n)
        
        print("[OK] Key pair generated successfully!")
        
        # Public key: (n, e), Private key: (n, d)
        public_key = (n, e)
        private_key = (n, d)
        
        # Store primes for potential future use (not recommended in production)
        self._p = p
        self._q = q
        self._phi_n = phi_n
        
        return public_key, private_key
    
    def _find_public_exponent(self, phi_n: int) -> int:
        """
        Find a suitable public exponent e.
        
        Uses 65537 (2^16 + 1) if coprime with phi_n, otherwise finds next suitable value.
        
        Args:
            phi_n: Euler's totient function value
        
        Returns:
            Public exponent e
        """
        # Try 65537 first (standard choice)
        if gcd(self.PUBLIC_EXPONENT, phi_n) == 1:
            return self.PUBLIC_EXPONENT
        
        # Find next suitable exponent
        e = 3
        while e < phi_n:
            if gcd(e, phi_n) == 1:
                return e
            e += 2
        
        raise ValueError("Could not find suitable public exponent")
    
    def encrypt(self, plaintext: bytes, public_key: Tuple[int, int]) -> bytes:
        """
        Encrypt plaintext using RSA public key.
        
        Args:
            plaintext: Data to encrypt
            public_key: Tuple of (n, e)
        
        Returns:
            Encrypted bytes
        
        Raises:
            ValueError: If message is too long for the key
        """
        n, e = public_key
        
        # Convert plaintext to integer
        message_int = bytes_to_int(plaintext)
        
        # Check if message is too large
        if message_int >= n:
            raise ValueError(
                f"Message too long for key size. "
                f"Max message length: {(n.bit_length() - 1) // 8} bytes, "
                f"got {len(plaintext)} bytes"
            )
        
        # Encrypt: c = m^e mod n
        ciphertext_int = mod_exp(message_int, e, n)
        
        # Convert to bytes (same length as modulus)
        byte_length = (n.bit_length() + 7) // 8
        return int_to_bytes(ciphertext_int, byte_length)
    
    def decrypt(self, ciphertext: bytes, private_key: Tuple[int, int]) -> bytes:
        """
        Decrypt ciphertext using RSA private key.
        
        Args:
            ciphertext: Encrypted data
            private_key: Tuple of (n, d)
        
        Returns:
            Decrypted bytes
        """
        n, d = private_key
        
        # Convert ciphertext to integer
        ciphertext_int = bytes_to_int(ciphertext)
        
        # Decrypt: m = c^d mod n
        message_int = mod_exp(ciphertext_int, d, n)
        
        # Convert back to bytes, preserving original length
        byte_length = (n.bit_length() + 7) // 8
        result = int_to_bytes(message_int, byte_length)
        
        # Remove leading zeros (from encryption padding)
        result = result.lstrip(b'\x00')
        
        return result
    
    def sign(self, message: bytes, private_key: Tuple[int, int]) -> bytes:
        """
        Create a digital signature for a message.
        
        Uses textbook RSA signature: s = H(m)^d mod n
        
        For better security, should use RSA-PSS. This is simplified for education.
        
        Args:
            message: Message to sign
            private_key: Tuple of (n, d)
        
        Returns:
            Digital signature bytes
        """
        n, d = private_key
        
        # Hash the message using SHA-256
        hash_value = hashlib.sha256(message).digest()
        
        # Convert hash to integer
        hash_int = bytes_to_int(hash_value)
        
        # Ensure hash fits in modulus
        if hash_int >= n:
            raise ValueError("Hash value too large for modulus")
        
        # Sign: s = H(m)^d mod n
        signature_int = mod_exp(hash_int, d, n)
        
        # Convert to bytes
        byte_length = (n.bit_length() + 7) // 8
        return int_to_bytes(signature_int, byte_length)
    
    def verify(self, message: bytes, signature: bytes, public_key: Tuple[int, int]) -> bool:
        """
        Verify a digital signature.
        
        Uses textbook RSA verification: H(m) == s^e mod n
        
        Args:
            message: Original message
            signature: Digital signature to verify
            public_key: Tuple of (n, e)
        
        Returns:
            True if signature is valid, False otherwise
        """
        n, e = public_key
        
        try:
            # Compute expected hash: H(m)
            expected_hash = hashlib.sha256(message).digest()
            expected_hash_int = bytes_to_int(expected_hash)
            
            # Verify: s^e mod n == H(m)
            signature_int = bytes_to_int(signature)
            recovered_hash_int = mod_exp(signature_int, e, n)
            
            return recovered_hash_int == expected_hash_int
        except Exception:
            return False
    
    def encrypt_int(self, message_int: int, public_key: Tuple[int, int]) -> int:
        """
        Encrypt an integer (for internal use and testing).
        
        Args:
            message_int: Integer message
            public_key: Tuple of (n, e)
        
        Returns:
            Encrypted integer
        """
        n, e = public_key
        return mod_exp(message_int, e, n)
    
    def decrypt_int(self, ciphertext_int: int, private_key: Tuple[int, int]) -> int:
        """
        Decrypt an integer (for internal use and testing).
        
        Args:
            ciphertext_int: Encrypted integer
            private_key: Tuple of (n, d)
        
        Returns:
            Decrypted integer
        """
        n, d = private_key
        return mod_exp(ciphertext_int, d, n)
    
    @staticmethod
    def get_test_vectors():
        """Return test vectors for validation."""
        # Small RSA parameters for testing (NOT secure - for testing only)
        # p = 61, q = 53, n = 3233, e = 17, d = 2753
        p, q = 61, 53
        n = p * q
        e = 17
        d = 2753
        
        public_key = (n, e)
        private_key = (n, d)
        
        # Test encryption/decryption
        plaintext_int = 65  # ASCII 'A'
        ciphertext_int = mod_exp(plaintext_int, e, n)
        decrypted_int = mod_exp(ciphertext_int, d, n)
        
        return {
            'p': p,
            'q': q,
            'n': n,
            'e': e,
            'd': d,
            'public_key': public_key,
            'private_key': private_key,
            'plaintext_int': plaintext_int,
            'ciphertext_int': ciphertext_int,
            'decrypted_int': decrypted_int
        }


if __name__ == "__main__":
    # Quick self-test
    print("RSA Self-Test")
    print("=" * 40)
    
    # Test with small known values
    vectors = RSA.get_test_vectors()
    
    print(f"p = {vectors['p']}")
    print(f"q = {vectors['q']}")
    print(f"n = {vectors['n']}")
    print(f"e = {vectors['e']}")
    print(f"d = {vectors['d']}")
    print()
    
    # Test encryption/decryption
    rsa = RSA(key_size=256)  # Small key for testing
    plaintext = vectors['plaintext_int']
    
    encrypted = rsa.encrypt_int(plaintext, vectors['public_key'])
    decrypted = rsa.decrypt_int(encrypted, vectors['private_key'])
    
    if decrypted == plaintext:
        print("[PASS] RSA integer encryption/decryption test passed!")
    else:
        print("[FAIL] RSA integer encryption/decryption test failed!")
        print(f"  Expected: {plaintext}, Got: {decrypted}")
    
    # Test with actual keys
    print("\nGenerating test key pair...")
    rsa_test = RSA(key_size=512)
    pub, priv = rsa_test.generate_keypair()
    
    test_msg = b"Hello, RSA!"
    encrypted_msg = rsa_test.encrypt(test_msg, pub)
    decrypted_msg = rsa_test.decrypt(encrypted_msg, priv)
    
    if decrypted_msg == test_msg:
        print("[PASS] RSA bytes encryption/decryption test passed!")
    else:
        print("[FAIL] RSA bytes encryption/decryption test failed!")
    
    # Test digital signature
    signature = rsa_test.sign(test_msg, priv)
    if rsa_test.verify(test_msg, signature, pub):
        print("[PASS] RSA digital signature test passed!")
    else:
        print("[FAIL] RSA digital signature test failed!")
    
    # Test invalid signature
    bad_sig = bytearray(signature)
    bad_sig[0] ^= 0xFF
    bad_sig = bytes(bad_sig)
    
    if not rsa_test.verify(test_msg, bad_sig, pub):
        print("[PASS] RSA invalid signature rejection test passed!")
    else:
        print("[FAIL] RSA invalid signature rejection test failed!")
