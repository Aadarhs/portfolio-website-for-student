"""
AES-128 Encryption/Decryption Implementation.

This module provides a complete implementation of AES-128 (Advanced Encryption Standard)
with 128-bit keys, including CBC mode with PKCS7 padding.

AES operates on 16-byte blocks and performs 10 rounds of transformations:
- SubBytes: Non-linear byte substitution using S-box
- ShiftRows: Cyclic shifting of rows
- MixColumns: Mixing columns using polynomial multiplication
- AddRoundKey: XOR with round key

Reference: FIPS 197 - Advanced Encryption Standard (AES)
"""

from typing import Optional
from utils import xor_bytes, pkcs7_pad, pkcs7_unpad, split_blocks


class AES:
    """
    AES-128 encryption/decryption implementation.
    
    Supports:
    - Single block encryption/decryption
    - CBC mode with PKCS7 padding
    """
    
    # AES S-box for SubBytes transformation
    S_BOX = [
        0x63, 0x7C, 0x77, 0x7B, 0xF2, 0x6B, 0x6F, 0xC5, 0x30, 0x01, 0x67, 0x2B, 0xFE, 0xD7, 0xAB, 0x76,
        0xCA, 0x82, 0xC9, 0x7D, 0xFA, 0x59, 0x47, 0xF0, 0xAD, 0xD4, 0xA2, 0xAF, 0x9C, 0xA4, 0x72, 0xC0,
        0xB7, 0xFD, 0x93, 0x26, 0x36, 0x3F, 0xF7, 0xCC, 0x34, 0xA5, 0xE5, 0xF1, 0x71, 0xD8, 0x31, 0x15,
        0x04, 0xC7, 0x23, 0xC3, 0x18, 0x96, 0x05, 0x9A, 0x07, 0x12, 0x80, 0xE2, 0xEB, 0x27, 0xB2, 0x75,
        0x09, 0x83, 0x2C, 0x1A, 0x1B, 0x6E, 0x5A, 0xA0, 0x52, 0x3B, 0xD6, 0xB3, 0x29, 0xE3, 0x2F, 0x84,
        0x53, 0xD1, 0x00, 0xED, 0x20, 0xFC, 0xB1, 0x5B, 0x6A, 0xCB, 0xBE, 0x39, 0x4A, 0x4C, 0x58, 0xCF,
        0xD0, 0xEF, 0xAA, 0xFB, 0x43, 0x4D, 0x33, 0x85, 0x45, 0xF9, 0x02, 0x7F, 0x50, 0x3C, 0x9F, 0xA8,
        0x51, 0xA3, 0x40, 0x8F, 0x92, 0x9D, 0x38, 0xF5, 0xBC, 0xB6, 0xDA, 0x21, 0x10, 0xFF, 0xF3, 0xD2,
        0xCD, 0x0C, 0x13, 0xEC, 0x5F, 0x97, 0x44, 0x17, 0xC4, 0xA7, 0x7E, 0x3D, 0x64, 0x5D, 0x19, 0x73,
        0x60, 0x81, 0x4F, 0xDC, 0x22, 0x2A, 0x90, 0x88, 0x46, 0xEE, 0xB8, 0x14, 0xDE, 0x5E, 0x0B, 0xDB,
        0xE0, 0x32, 0x3A, 0x0A, 0x49, 0x06, 0x24, 0x5C, 0xC2, 0xD3, 0xAC, 0x62, 0x91, 0x95, 0xE4, 0x79,
        0xE7, 0xC8, 0x37, 0x6D, 0x8D, 0xD5, 0x4E, 0xA9, 0x6C, 0x56, 0xF4, 0xEA, 0x65, 0x7A, 0xAE, 0x08,
        0xBA, 0x78, 0x25, 0x2E, 0x1C, 0xA6, 0xB4, 0xC6, 0xE8, 0xDD, 0x74, 0x1F, 0x4B, 0xBD, 0x8B, 0x8A,
        0x70, 0x3E, 0xB5, 0x66, 0x48, 0x03, 0xF6, 0x0E, 0x61, 0x35, 0x57, 0xB9, 0x86, 0xC1, 0x1D, 0x9E,
        0xE1, 0xF8, 0x98, 0x11, 0x69, 0xD9, 0x8E, 0x94, 0x9B, 0x1E, 0x87, 0xE9, 0xCE, 0x55, 0x28, 0xDF,
        0x8C, 0xA1, 0x89, 0x0D, 0xBF, 0xE6, 0x42, 0x68, 0x41, 0x99, 0x2D, 0x0F, 0xB0, 0x54, 0xBB, 0x16,
    ]
    
    # Inverse S-box for InvSubBytes transformation
    INV_S_BOX = [
        0x52, 0x09, 0x6A, 0xD5, 0x30, 0x36, 0xA5, 0x38, 0xBF, 0x40, 0xA3, 0x9E, 0x81, 0xF3, 0xD7, 0xFB,
        0x7C, 0xE3, 0x39, 0x82, 0x9B, 0x2F, 0xFF, 0x87, 0x34, 0x8E, 0x43, 0x44, 0xC4, 0xDE, 0xE9, 0xCB,
        0x54, 0x7B, 0x94, 0x32, 0xA6, 0xC2, 0x23, 0x3D, 0xEE, 0x4C, 0x95, 0x0B, 0x42, 0xFA, 0xC3, 0x4E,
        0x08, 0x2E, 0xA1, 0x66, 0x28, 0xD9, 0x24, 0xB2, 0x76, 0x5B, 0xA2, 0x49, 0x6D, 0x8B, 0xD1, 0x25,
        0x72, 0xF8, 0xF6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xD4, 0xA4, 0x5C, 0xCC, 0x5D, 0x65, 0xB6, 0x92,
        0x6C, 0x70, 0x48, 0x50, 0xFD, 0xED, 0xB9, 0xDA, 0x5E, 0x15, 0x46, 0x57, 0xA7, 0x8D, 0x9D, 0x84,
        0x90, 0xD8, 0xAB, 0x00, 0x8C, 0xBC, 0xD3, 0x0A, 0xF7, 0xE4, 0x58, 0x05, 0xB8, 0xB3, 0x45, 0x06,
        0xD0, 0x2C, 0x1E, 0x8F, 0xCA, 0x3F, 0x0F, 0x02, 0xC1, 0xAF, 0xBD, 0x03, 0x01, 0x13, 0x8A, 0x6B,
        0x3A, 0x91, 0x11, 0x41, 0x4F, 0x67, 0xDC, 0xEA, 0x97, 0xF2, 0xCF, 0xCE, 0xF0, 0xB4, 0xE6, 0x73,
        0x96, 0xAC, 0x74, 0x22, 0xE7, 0xAD, 0x35, 0x85, 0xE2, 0xF9, 0x37, 0xE8, 0x1C, 0x75, 0xDF, 0x6E,
        0x47, 0xF1, 0x1A, 0x71, 0x1D, 0x29, 0xC5, 0x89, 0x6F, 0xB7, 0x62, 0x0E, 0xAA, 0x18, 0xBE, 0x1B,
        0xFC, 0x56, 0x3E, 0x4B, 0xC6, 0xD2, 0x79, 0x20, 0x9A, 0xDB, 0xC0, 0xFE, 0x78, 0xCD, 0x5A, 0xF4,
        0x1F, 0xDD, 0xA8, 0x33, 0x88, 0x07, 0xC7, 0x31, 0xB1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xEC, 0x5F,
        0x60, 0x51, 0x7F, 0xA9, 0x19, 0xB5, 0x4A, 0x0D, 0x2D, 0xE5, 0x7A, 0x9F, 0x93, 0xC9, 0x9C, 0xEF,
        0xA0, 0xE0, 0x3B, 0x4D, 0xAE, 0x2A, 0xF5, 0xB0, 0xC8, 0xEB, 0xBB, 0x3C, 0x83, 0x53, 0x99, 0x61,
        0x17, 0x2B, 0x04, 0x7E, 0xBA, 0x77, 0xD6, 0x26, 0xE1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0C, 0x7D,
    ]
    
    # Round constants for key expansion
    RCON = [
        0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36
    ]
    
    # Number of rounds for AES-128
    NUM_ROUNDS = 10
    
    # Block size in bytes
    BLOCK_SIZE = 16
    
    def __init__(self, key: bytes):
        """
        Initialize AES with a 128-bit key.
        
        Args:
            key: 16-byte encryption key
        
        Raises:
            ValueError: If key is not 16 bytes
        """
        if len(key) != 16:
            raise ValueError(f"Key must be 16 bytes, got {len(key)}")
        
        self.key = key
        self.round_keys = self._expand_key(key)
    
    def _sub_bytes(self, state: list) -> list:
        """Apply SubBytes transformation using S-box."""
        return [self.S_BOX[b] for b in state]
    
    def _inv_sub_bytes(self, state: list) -> list:
        """Apply inverse SubBytes transformation."""
        return [self.INV_S_BOX[b] for b in state]
    
    def _shift_rows(self, state: list) -> list:
        """Apply ShiftRows transformation."""
        result = list(state)
        
        # Row 1: shift left by 1
        result[1], result[5], result[9], result[13] = state[5], state[9], state[13], state[1]
        
        # Row 2: shift left by 2
        result[2], result[6], result[10], result[14] = state[10], state[14], state[2], state[6]
        
        # Row 3: shift left by 3
        result[3], result[7], result[11], result[15] = state[15], state[3], state[7], state[11]
        
        return result
    
    def _inv_shift_rows(self, state: list) -> list:
        """Apply inverse ShiftRows transformation."""
        result = list(state)
        
        # Row 1: shift right by 1
        result[1], result[5], result[9], result[13] = state[13], state[1], state[5], state[9]
        
        # Row 2: shift right by 2
        result[2], result[6], result[10], result[14] = state[10], state[14], state[2], state[6]
        
        # Row 3: shift right by 3
        result[3], result[7], result[11], result[15] = state[7], state[11], state[15], state[3]
        
        return result
    
    def _mix_columns(self, state: list) -> list:
        """Apply MixColumns transformation."""
        result = list(state)
        
        for col in range(4):
            i = col * 4
            a = state[i:i + 4]
            
            # Multiply by [2, 3, 1, 1] modulo x^4 + 1
            result[i] = self._gmul(a[0], 2) ^ self._gmul(a[1], 3) ^ a[2] ^ a[3]
            result[i + 1] = a[0] ^ self._gmul(a[1], 2) ^ self._gmul(a[2], 3) ^ a[3]
            result[i + 2] = a[0] ^ a[1] ^ self._gmul(a[2], 2) ^ self._gmul(a[3], 3)
            result[i + 3] = self._gmul(a[0], 3) ^ a[1] ^ a[2] ^ self._gmul(a[3], 2)
        
        return result
    
    def _inv_mix_columns(self, state: list) -> list:
        """Apply inverse MixColumns transformation."""
        result = list(state)
        
        for col in range(4):
            i = col * 4
            a = state[i:i + 4]
            
            # Multiply by [14, 11, 13, 9] modulo x^4 + 1
            result[i] = self._gmul(a[0], 14) ^ self._gmul(a[1], 11) ^ self._gmul(a[2], 13) ^ self._gmul(a[3], 9)
            result[i + 1] = self._gmul(a[0], 9) ^ self._gmul(a[1], 14) ^ self._gmul(a[2], 11) ^ self._gmul(a[3], 13)
            result[i + 2] = self._gmul(a[0], 13) ^ self._gmul(a[1], 9) ^ self._gmul(a[2], 14) ^ self._gmul(a[3], 11)
            result[i + 3] = self._gmul(a[0], 11) ^ self._gmul(a[1], 13) ^ self._gmul(a[2], 9) ^ self._gmul(a[3], 14)
        
        return result
    
    def _add_round_key(self, state: list, round_key: list) -> list:
        """Apply AddRoundKey transformation."""
        return [s ^ k for s, k in zip(state, round_key)]
    
    def _gmul(self, a: int, b: int) -> int:
        """
        Galois Field multiplication of two bytes in GF(2^8).
        
        Uses the irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11B).
        """
        p = 0
        for _ in range(8):
            if b & 1:
                p ^= a
            high_bit = a & 0x80
            a = (a << 1) & 0xFF
            if high_bit:
                a ^= 0x1B  # x^8 + x^4 + x^3 + x + 1
            b >>= 1
        return p
    
    def _expand_key(self, key: bytes) -> list:
        """
        Expand the cipher key into the key schedule.
        
        AES-128 uses 11 round keys (initial + 10 rounds).
        Each round key is 16 bytes.
        """
        # Convert key to list of 16 bytes (state)
        key_bytes = list(key)
        
        # We need 11 round keys (176 bytes total)
        expanded_key = list(key_bytes)
        
        for i in range(4, 44):  # 44 words (176 bytes / 4 bytes per word)
            temp = expanded_key[(i - 1) * 4:i * 4]
            
            if i % 4 == 0:
                # RotWord: rotate left by 1 byte
                temp = temp[1:] + temp[:1]
                # SubWord: apply S-box to each byte
                temp = [self.S_BOX[b] for b in temp]
                # XOR with round constant
                temp[0] ^= self.RCON[i // 4 - 1]
            
            # XOR with word 4 positions back
            prev_word = expanded_key[(i - 4) * 4:(i - 3) * 4]
            new_word = [a ^ b for a, b in zip(prev_word, temp)]
            expanded_key.extend(new_word)
        
        # Split into 11 round keys of 16 bytes each
        round_keys = []
        for i in range(11):
            round_key = expanded_key[i * 16:(i + 1) * 16]
            round_keys.append(round_key)
        
        return round_keys
    
    def _bytes_to_state(self, data: bytes) -> list:
        """Convert 16 bytes to 4x4 state matrix (column-major)."""
        return list(data)
    
    def _state_to_bytes(self, state: list) -> bytes:
        """Convert state matrix to bytes."""
        return bytes(state)
    
    def encrypt_block(self, block: bytes) -> bytes:
        """
        Encrypt a single 16-byte block.
        
        Args:
            block: 16-byte plaintext block
        
        Returns:
            16-byte ciphertext block
        
        Raises:
            ValueError: If block is not 16 bytes
        """
        if len(block) != self.BLOCK_SIZE:
            raise ValueError(f"Block must be {self.BLOCK_SIZE} bytes")
        
        state = self._bytes_to_state(block)
        
        # Initial round key addition
        state = self._add_round_key(state, self.round_keys[0])
        
        # Main rounds (1-9)
        for round_num in range(1, self.NUM_ROUNDS):
            state = self._sub_bytes(state)
            state = self._shift_rows(state)
            state = self._mix_columns(state)
            state = self._add_round_key(state, self.round_keys[round_num])
        
        # Final round (no MixColumns)
        state = self._sub_bytes(state)
        state = self._shift_rows(state)
        state = self._add_round_key(state, self.round_keys[self.NUM_ROUNDS])
        
        return self._state_to_bytes(state)
    
    def decrypt_block(self, block: bytes) -> bytes:
        """
        Decrypt a single 16-byte block.
        
        Args:
            block: 16-byte ciphertext block
        
        Returns:
            16-byte plaintext block
        
        Raises:
            ValueError: If block is not 16 bytes
        """
        if len(block) != self.BLOCK_SIZE:
            raise ValueError(f"Block must be {self.BLOCK_SIZE} bytes")
        
        state = self._bytes_to_state(block)
        
        # Reverse final round
        state = self._add_round_key(state, self.round_keys[self.NUM_ROUNDS])
        state = self._inv_shift_rows(state)
        state = self._inv_sub_bytes(state)
        
        # Reverse main rounds (9-1)
        for round_num in range(self.NUM_ROUNDS - 1, 0, -1):
            state = self._add_round_key(state, self.round_keys[round_num])
            state = self._inv_mix_columns(state)
            state = self._inv_shift_rows(state)
            state = self._inv_sub_bytes(state)
        
        # Reverse initial round key addition
        state = self._add_round_key(state, self.round_keys[0])
        
        return self._state_to_bytes(state)
    
    def encrypt_cbc(self, plaintext: bytes, iv: Optional[bytes] = None) -> bytes:
        """
        Encrypt plaintext using CBC mode with PKCS7 padding.
        
        Args:
            plaintext: Data to encrypt (any length)
            iv: 16-byte initialization vector (random if not provided)
        
        Returns:
            IV + ciphertext (IV is prepended for decryption)
        """
        import os
        
        if iv is None:
            iv = os.urandom(self.BLOCK_SIZE)
        
        if len(iv) != self.BLOCK_SIZE:
            raise ValueError(f"IV must be {self.BLOCK_SIZE} bytes")
        
        # Apply PKCS7 padding
        padded_data = pkcs7_pad(plaintext, self.BLOCK_SIZE)
        
        # Split into blocks
        blocks = split_blocks(padded_data, self.BLOCK_SIZE)
        
        # Encrypt each block
        ciphertext = iv
        prev_block = iv
        
        for block in blocks:
            # XOR with previous ciphertext block
            xored = xor_bytes(block, prev_block)
            # Encrypt
            encrypted = self.encrypt_block(xored)
            ciphertext += encrypted
            prev_block = encrypted
        
        return ciphertext
    
    def decrypt_cbc(self, ciphertext: bytes) -> bytes:
        """
        Decrypt ciphertext encrypted with CBC mode.
        
        Args:
            ciphertext: IV + encrypted data
        
        Returns:
            Decrypted plaintext
        """
        if len(ciphertext) < self.BLOCK_SIZE * 2:
            raise ValueError("Ciphertext too short")
        
        if len(ciphertext) % self.BLOCK_SIZE != 0:
            raise ValueError("Ciphertext length is not a multiple of block size")
        
        # Extract IV
        iv = ciphertext[:self.BLOCK_SIZE]
        encrypted_data = ciphertext[self.BLOCK_SIZE:]
        
        # Split into blocks
        blocks = split_blocks(encrypted_data, self.BLOCK_SIZE)
        
        # Decrypt each block
        plaintext = b''
        prev_block = iv
        
        for block in blocks:
            # Decrypt
            decrypted = self.decrypt_block(block)
            # XOR with previous ciphertext block
            xored = xor_bytes(decrypted, prev_block)
            plaintext += xored
            prev_block = block
        
        # Remove PKCS7 padding
        return pkcs7_unpad(plaintext, self.BLOCK_SIZE)
    
    @staticmethod
    def get_test_vector():
        """Return NIST test vector for validation."""
        # NIST AES-128 test vector
        key = bytes([0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
                     0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c])
        plaintext = bytes([0x32, 0x43, 0xf6, 0xa8, 0x88, 0x5a, 0x30, 0x8d,
                          0x31, 0x31, 0x98, 0xa2, 0xe0, 0x37, 0x07, 0x34])
        expected_ciphertext = bytes([0x39, 0x25, 0x84, 0x1d, 0x02, 0xdc, 0x09, 0xfb,
                                    0xdc, 0x11, 0x85, 0x97, 0x19, 0x6a, 0x0b, 0x32])
        return key, plaintext, expected_ciphertext


if __name__ == "__main__":
    # Quick self-test
    key, plaintext, expected = AES.get_test_vector()
    aes = AES(key)
    ciphertext = aes.encrypt_block(plaintext)
    
    if ciphertext == expected:
        print("[PASS] AES encryption test passed!")
    else:
        print("[FAIL] AES encryption test failed!")
        print(f"  Expected: {expected.hex()}")
        print(f"  Got:      {ciphertext.hex()}")
    
    # Test decryption
    decrypted = aes.decrypt_block(ciphertext)
    if decrypted == plaintext:
        print("[PASS] AES decryption test passed!")
    else:
        print("[FAIL] AES decryption test failed!")
    
    # Test CBC mode
    test_aes = AES(b'0123456789abcdef')
    test_msg = b"Hello, AES-CBC!"
    encrypted = test_aes.encrypt_cbc(test_msg)
    decrypted = test_aes.decrypt_cbc(encrypted)
    
    if decrypted == test_msg:
        print("[PASS] AES-CBC test passed!")
    else:
        print("[FAIL] AES-CBC test failed!")
