"""
Hash Function Implementations (SHA-256, MD5, HMAC).

This module provides from-scratch implementations of:
- SHA-256: Secure Hash Algorithm 256-bit
- MD5: Message Digest 5 (included for educational comparison - cryptographically broken)
- HMAC: Hash-based Message Authentication Code

All implementations follow the respective RFC standards:
- SHA-256: FIPS 180-4
- MD5: RFC 1321
- HMAC: RFC 2104

Note: These implementations are for educational purposes. Use Python's hashlib
for production code.
"""

import struct
from typing import Union


class SHA256:
    """
    SHA-256 hash function implementation.
    
    Produces a 256-bit (32-byte) hash digest.
    
    SHA-256 processes messages in 512-bit (64-byte) blocks using the
    Merkle-Damgård construction with a compression function.
    """
    
    # Initial hash values (first 32 bits of fractional parts of square roots of first 8 primes)
    H0 = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]
    
    # Round constants (first 32 bits of fractional parts of cube roots of first 64 primes)
    K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]
    
    BLOCK_SIZE = 64  # 512 bits
    DIGEST_SIZE = 32  # 256 bits
    
    def __init__(self):
        """Initialize SHA-256 hasher."""
        self.reset()
    
    def reset(self):
        """Reset hasher state."""
        self.h = list(self.H0)
        self.message_length = 0
        self.buffer = b''
    
    def _right_rotate(self, value: int, amount: int) -> int:
        """Perform right rotation on a 32-bit integer."""
        return ((value >> amount) | (value << (32 - amount))) & 0xFFFFFFFF
    
    def _process_block(self, block: bytes):
        """Process a single 512-bit block."""
        if len(block) != 64:
            raise ValueError(f"Block must be 64 bytes, got {len(block)}")
        
        # Prepare message schedule
        w = [0] * 64
        
        # Copy first 16 words from block
        for i in range(16):
            w[i] = struct.unpack('>I', block[i * 4:(i + 1) * 4])[0]
        
        # Extend words
        for i in range(16, 64):
            s0 = self._right_rotate(w[i - 15], 7) ^ self._right_rotate(w[i - 15], 18) ^ (w[i - 15] >> 3)
            s1 = self._right_rotate(w[i - 2], 17) ^ self._right_rotate(w[i - 2], 19) ^ (w[i - 2] >> 10)
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF
        
        # Initialize working variables
        a, b, c, d, e, f, g, h = self.h
        
        # Compression function
        for i in range(64):
            S1 = self._right_rotate(e, 6) ^ self._right_rotate(e, 11) ^ self._right_rotate(e, 25)
            ch = (e & f) ^ ((~e) & g)
            temp1 = (h + S1 + ch + self.K[i] + w[i]) & 0xFFFFFFFF
            S0 = self._right_rotate(a, 2) ^ self._right_rotate(a, 13) ^ self._right_rotate(a, 22)
            maj = (a & b) ^ (a & c) ^ (b & c)
            temp2 = (S0 + maj) & 0xFFFFFFFF
            
            h = g
            g = f
            f = e
            e = (d + temp1) & 0xFFFFFFFF
            d = c
            c = b
            b = a
            a = (temp1 + temp2) & 0xFFFFFFFF
        
        # Add compressed chunk to hash value
        self.h[0] = (self.h[0] + a) & 0xFFFFFFFF
        self.h[1] = (self.h[1] + b) & 0xFFFFFFFF
        self.h[2] = (self.h[2] + c) & 0xFFFFFFFF
        self.h[3] = (self.h[3] + d) & 0xFFFFFFFF
        self.h[4] = (self.h[4] + e) & 0xFFFFFFFF
        self.h[5] = (self.h[5] + f) & 0xFFFFFFFF
        self.h[6] = (self.h[6] + g) & 0xFFFFFFFF
        self.h[7] = (self.h[7] + h) & 0xFFFFFFFF
    
    def update(self, data: Union[str, bytes]) -> 'SHA256':
        """
        Add data to be hashed.
        
        Args:
            data: Data to hash (string or bytes)
        
        Returns:
            Self for chaining
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        self.message_length += len(data)
        self.buffer += data
        
        # Process complete blocks
        while len(self.buffer) >= self.BLOCK_SIZE:
            block = self.buffer[:self.BLOCK_SIZE]
            self.buffer = self.buffer[self.BLOCK_SIZE:]
            self._process_block(block)
        
        return self
    
    def digest(self) -> bytes:
        """
        Produce the final hash digest.
        
        Returns:
            32-byte hash digest
        """
        # Work on a copy of state
        h = list(self.h)
        buffer = self.buffer
        message_length = self.message_length
        
        # Padding
        # Append bit '1' (byte 0x80)
        buffer += b'\x80'
        
        # Append zeros until length ≡ 56 mod 64
        padding_length = (56 - len(buffer) % 64) % 64
        buffer += b'\x00' * padding_length
        
        # Append original message length in bits as 64-bit big-endian
        buffer += struct.pack('>Q', message_length * 8)
        
        # Process final block(s)
        for i in range(0, len(buffer), 64):
            block = buffer[i:i + 64]
            
            # Prepare message schedule
            w = [0] * 64
            for j in range(16):
                w[j] = struct.unpack('>I', block[j * 4:(j + 1) * 4])[0]
            
            for j in range(16, 64):
                s0 = ((w[j - 15] >> 7) | (w[j - 15] << 25)) & 0xFFFFFFFF
                s0 ^= ((w[j - 15] >> 18) | (w[j - 15] << 14)) & 0xFFFFFFFF
                s0 ^= (w[j - 15] >> 3)
                
                s1 = ((w[j - 2] >> 17) | (w[j - 2] << 15)) & 0xFFFFFFFF
                s1 ^= ((w[j - 2] >> 19) | (w[j - 2] << 13)) & 0xFFFFFFFF
                s1 ^= (w[j - 2] >> 10)
                
                w[j] = (w[j - 16] + s0 + w[j - 7] + s1) & 0xFFFFFFFF
            
            # Compression
            a, b, c, d, e, f, g, hh = h
            
            for j in range(64):
                S1 = ((e >> 6) | (e << 26)) & 0xFFFFFFFF
                S1 ^= ((e >> 11) | (e << 21)) & 0xFFFFFFFF
                S1 ^= ((e >> 25) | (e << 7)) & 0xFFFFFFFF
                
                ch = (e & f) ^ ((~e) & g)
                temp1 = (hh + S1 + ch + self.K[j] + w[j]) & 0xFFFFFFFF
                
                S0 = ((a >> 2) | (a << 30)) & 0xFFFFFFFF
                S0 ^= ((a >> 13) | (a << 19)) & 0xFFFFFFFF
                S0 ^= ((a >> 22) | (a << 10)) & 0xFFFFFFFF
                
                maj = (a & b) ^ (a & c) ^ (b & c)
                temp2 = (S0 + maj) & 0xFFFFFFFF
                
                hh = g
                g = f
                f = e
                e = (d + temp1) & 0xFFFFFFFF
                d = c
                c = b
                b = a
                a = (temp1 + temp2) & 0xFFFFFFFF
            
            h[0] = (h[0] + a) & 0xFFFFFFFF
            h[1] = (h[1] + b) & 0xFFFFFFFF
            h[2] = (h[2] + c) & 0xFFFFFFFF
            h[3] = (h[3] + d) & 0xFFFFFFFF
            h[4] = (h[4] + e) & 0xFFFFFFFF
            h[5] = (h[5] + f) & 0xFFFFFFFF
            h[6] = (h[6] + g) & 0xFFFFFFFF
            h[7] = (h[7] + hh) & 0xFFFFFFFF
        
        # Produce digest
        digest = b''
        for hash_value in h:
            digest += struct.pack('>I', hash_value)
        
        return digest
    
    def hexdigest(self) -> str:
        """
        Produce the final hash as a hexadecimal string.
        
        Returns:
            64-character hexadecimal string
        """
        return self.digest().hex()
    
    def hash(self, data: Union[str, bytes]) -> bytes:
        """
        Convenience method to hash data in one call.
        
        Args:
            data: Data to hash
        
        Returns:
            32-byte hash digest
        """
        self.reset()
        self.update(data)
        return self.digest()
    
    @staticmethod
    def get_test_vectors():
        """Return known test vectors for SHA-256."""
        return [
            ("", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
            ("abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"),
            ("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnomnop", 
             "f1ef416f56a0fec52ce91f8964fc345beb61f09f282fc12db62bd6423bb69982"),
            ("Hello, World!", "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"),
        ]


class MD5:
    """
    MD5 hash function implementation.
    
    Produces a 128-bit (16-byte) hash digest.
    
    WARNING: MD5 is cryptographically broken and should NOT be used for
    security purposes. This implementation is provided for educational
    comparison only.
    
    Reference: RFC 1321
    """
    
    # Constants
    S = [
        [7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]
    ]
    
    T = [int(2**32 * abs(__import__('math').sin(i + 1))) & 0xFFFFFFFF for i in range(64)]
    
    BLOCK_SIZE = 64  # 512 bits
    DIGEST_SIZE = 16  # 128 bits
    
    def __init__(self):
        """Initialize MD5 hasher."""
        self.reset()
    
    def reset(self):
        """Reset hasher state."""
        # Initial hash values
        self.h = [
            0x67452301,
            0xefcdab89,
            0x98badcfe,
            0x10325476
        ]
        self.message_length = 0
        self.buffer = b''
    
    def _left_rotate(self, value: int, amount: int) -> int:
        """Perform left rotation on a 32-bit integer."""
        return ((value << amount) | (value >> (32 - amount))) & 0xFFFFFFFF
    
    def _F(self, x: int, y: int, z: int) -> int:
        return (x & y) | ((~x) & z)
    
    def _G(self, x: int, y: int, z: int) -> int:
        return (x & z) | (y & (~z))
    
    def _H(self, x: int, y: int, z: int) -> int:
        return x ^ y ^ z
    
    def _I(self, x: int, y: int, z: int) -> int:
        return y ^ (x | (~z))
    
    def _process_block(self, block: bytes):
        """Process a single 512-bit block."""
        if len(block) != 64:
            raise ValueError(f"Block must be 64 bytes, got {len(block)}")
        
        # Prepare message schedule
        M = [0] * 16
        for i in range(16):
            M[i] = struct.unpack('<I', block[i * 4:(i + 1) * 4])[0]
        
        # Initialize hash value for this block
        a, b, c, d = self.h
        
        # Four rounds
        for i in range(64):
            if i < 16:
                f = self._F(b, c, d)
                g = i
            elif i < 32:
                f = self._G(b, c, d)
                g = (5 * i + 1) % 16
            elif i < 48:
                f = self._H(b, c, d)
                g = (3 * i + 5) % 16
            else:
                f = self._I(b, c, d)
                g = (7 * i) % 16
            
            temp = d
            d = c
            c = b
            b = (b + self._left_rotate((a + f + self.T[i] + M[g]) & 0xFFFFFFFF,
                                    self.S[i // 16][i % 4])) & 0xFFFFFFFF
            a = temp
        
        # Add to hash value
        self.h[0] = (self.h[0] + a) & 0xFFFFFFFF
        self.h[1] = (self.h[1] + b) & 0xFFFFFFFF
        self.h[2] = (self.h[2] + c) & 0xFFFFFFFF
        self.h[3] = (self.h[3] + d) & 0xFFFFFFFF
    
    def update(self, data: Union[str, bytes]) -> 'MD5':
        """
        Add data to be hashed.
        
        Args:
            data: Data to hash (string or bytes)
        
        Returns:
            Self for chaining
        """
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        self.message_length += len(data)
        self.buffer += data
        
        # Process complete blocks
        while len(self.buffer) >= self.BLOCK_SIZE:
            block = self.buffer[:self.BLOCK_SIZE]
            self.buffer = self.buffer[self.BLOCK_SIZE:]
            self._process_block(block)
        
        return self
    
    def digest(self) -> bytes:
        """
        Produce the final hash digest.
        
        Returns:
            16-byte hash digest
        """
        # Work on a copy of state
        h = list(self.h)
        buffer = self.buffer
        message_length = self.message_length
        
        # Padding
        buffer += b'\x80'
        
        # Append zeros until length ≡ 56 mod 64
        padding_length = (56 - len(buffer) % 64) % 64
        buffer += b'\x00' * padding_length
        
        # Append original message length in bits as 64-bit little-endian
        buffer += struct.pack('<Q', message_length * 8)
        
        # Process final block(s)
        for i in range(0, len(buffer), 64):
            block = buffer[i:i + 64]
            
            # Prepare message schedule
            M = [0] * 16
            for j in range(16):
                M[j] = struct.unpack('<I', block[j * 4:(j + 1) * 4])[0]
            
            a, b, c, d = h
            
            for j in range(64):
                if j < 16:
                    f = (b & c) | ((~b) & d)
                    g = j
                elif j < 32:
                    f = (b & d) | (c & (~d))
                    g = (5 * j + 1) % 16
                elif j < 48:
                    f = b ^ c ^ d
                    g = (3 * j + 5) % 16
                else:
                    f = c ^ (b | (~d))
                    g = (7 * j) % 16
                
                temp = d
                d = c
                c = b
                b = (b + self._left_rotate((a + f + self.T[j] + M[g]) & 0xFFFFFFFF,
                                        self.S[j // 16][j % 4])) & 0xFFFFFFFF
                a = temp
            
            h[0] = (h[0] + a) & 0xFFFFFFFF
            h[1] = (h[1] + b) & 0xFFFFFFFF
            h[2] = (h[2] + c) & 0xFFFFFFFF
            h[3] = (h[3] + d) & 0xFFFFFFFF
        
        # Produce digest (little-endian)
        digest = b''
        for hash_value in h:
            digest += struct.pack('<I', hash_value)
        
        return digest
    
    def hexdigest(self) -> str:
        """
        Produce the final hash as a hexadecimal string.
        
        Returns:
            32-character hexadecimal string
        """
        return self.digest().hex()
    
    def hash(self, data: Union[str, bytes]) -> bytes:
        """
        Convenience method to hash data in one call.
        
        Args:
            data: Data to hash
        
        Returns:
            16-byte hash digest
        """
        self.reset()
        self.update(data)
        return self.digest()
    
    @staticmethod
    def get_test_vectors():
        """Return known test vectors for MD5."""
        return [
            ("", "d41d8cd98f00b204e9800998ecf8427e"),
            ("a", "0cc175b9c0f1b6a831c399e269772661"),
            ("abc", "900150983cd24fb0d6963f7d28e17f72"),
            ("message digest", "f96b697d7cb7938d525a2f31aaf161d0"),
            ("Hello, World!", "65a8e27d8879283831b664bd8b7f0ad4"),
        ]


class HMAC:
    """
    HMAC (Hash-based Message Authentication Code) implementation.
    
    Provides message authentication using a cryptographic hash function.
    
    HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))
    
    where:
    - K' is the key (padded or hashed to block size)
    - ipad = 0x36 repeated
    - opad = 0x5c repeated
    
    Reference: RFC 2104
    """
    
    def __init__(self, key: Union[str, bytes], hash_func=None):
        """
        Initialize HMAC with a key and hash function.
        
        Args:
            key: Secret key for HMAC
            hash_func: Hash function to use (default: SHA256)
        """
        if isinstance(key, str):
            key = key.encode('utf-8')
        
        if hash_func is None:
            hash_func = SHA256()
        
        self.hash_func = hash_func
        self.block_size = hash_func.BLOCK_SIZE
        
        # If key is longer than block size, hash it first
        if len(key) > self.block_size:
            self.key = hash_func.hash(key)
        else:
            self.key = key
        
        # Pad key to block size
        self.key = self.key.ljust(self.block_size, b'\x00')
        
        # Create inner and outer padding
        self.ipad = bytes([b ^ 0x36 for b in self.key])
        self.opad = bytes([b ^ 0x5c for b in self.key])
    
    def compute(self, message: Union[str, bytes]) -> bytes:
        """
        Compute HMAC for a message.
        
        Args:
            message: Message to authenticate
        
        Returns:
            HMAC digest
        """
        if isinstance(message, str):
            message = message.encode('utf-8')
        
        # Inner hash: H(K' ⊕ ipad || message)
        self.hash_func.reset()
        self.hash_func.update(self.ipad)
        self.hash_func.update(message)
        inner_hash = self.hash_func.digest()
        
        # Outer hash: H(K' ⊕ opad || inner_hash)
        self.hash_func.reset()
        self.hash_func.update(self.opad)
        self.hash_func.update(inner_hash)
        
        return self.hash_func.digest()
    
    def compute_hex(self, message: Union[str, bytes]) -> str:
        """
        Compute HMAC and return as hexadecimal string.
        
        Args:
            message: Message to authenticate
        
        Returns:
            HMAC as hex string
        """
        return self.compute(message).hex()
    
    def verify(self, message: Union[str, bytes], mac: bytes) -> bool:
        """
        Verify an HMAC.
        
        Args:
            message: Original message
            mac: HMAC to verify
        
        Returns:
            True if HMAC is valid
        """
        computed = self.compute(message)
        
        # Constant-time comparison to prevent timing attacks
        if len(computed) != len(mac):
            return False
        
        result = 0
        for x, y in zip(computed, mac):
            result |= x ^ y
        
        return result == 0
    
    @staticmethod
    def get_test_vectors():
        """Return known test vectors for HMAC-SHA256."""
        return [
            # From RFC 4231
            (b"\x0b" * 20, b"Hi There", 
             "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"),
            (b"Jefe", b"what do ya want for nothing?",
             "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"),
            (b"\xaa" * 20, b"\xdd" * 50,
             "773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe"),
        ]


def sha256(data: Union[str, bytes]) -> bytes:
    """Convenience function for SHA-256 hashing."""
    return SHA256().hash(data)


def md5(data: Union[str, bytes]) -> bytes:
    """Convenience function for MD5 hashing."""
    return MD5().hash(data)


def hmac_sha256(key: Union[str, bytes], message: Union[str, bytes]) -> bytes:
    """Convenience function for HMAC-SHA256."""
    return HMAC(key).compute(message)


if __name__ == "__main__":
    # Quick self-tests
    print("Hash Function Self-Tests")
    print("=" * 50)
    
    # SHA-256 tests
    print("\nSHA-256 Tests:")
    for message, expected in SHA256.get_test_vectors()[:2]:  # Test first 2 vectors
        result = sha256(message)
        status = "[PASS]" if result.hex() == expected else "[FAIL]"
        print(f"  {status} SHA256('{message[:30]}...')")
        if result.hex() != expected:
            print(f"    Expected: {expected}")
            print(f"    Got:      {result.hex()}")
    
    # MD5 tests
    print("\nMD5 Tests:")
    for message, expected in MD5.get_test_vectors()[:2]:  # Test first 2 vectors
        result = md5(message)
        status = "[PASS]" if result.hex() == expected else "[FAIL]"
        print(f"  {status} MD5('{message[:30]}...')")
        if result.hex() != expected:
            print(f"    Expected: {expected}")
            print(f"    Got:      {result.hex()}")
    
    # HMAC tests
    print("\nHMAC-SHA256 Tests:")
    for key, message, expected in HMAC.get_test_vectors()[:2]:  # Test first 2 vectors
        result = hmac_sha256(key, message)
        status = "[PASS]" if result.hex() == expected else "[FAIL]"
        print(f"  {status} HMAC-SHA256(key, '{message[:30]}...')")
        if result.hex() != expected:
            print(f"    Expected: {expected}")
            print(f"    Got:      {result.hex()}")
