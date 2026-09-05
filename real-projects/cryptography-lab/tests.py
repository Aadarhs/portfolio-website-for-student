"""
Cryptography Implementation Lab - Test Suite.

This module provides comprehensive tests for all implemented cryptographic algorithms,
verifying correctness against known test vectors and running functional tests.

Usage:
    python tests.py          # Run all tests
    python tests.py --verbose  # Verbose output
"""

import sys
import time
from typing import List, Tuple, Any

from aes import AES
from rsa import RSA
from hashes import SHA256, MD5, HMAC, sha256, md5, hmac_sha256
from utils import (
    mod_exp, gcd, extended_gcd, mod_inverse, is_prime,
    bytes_to_int, int_to_bytes, xor_bytes,
    pkcs7_pad, pkcs7_unpad, split_blocks
)


class TestResult:
    """Container for test results."""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def record_pass(self):
        self.passed += 1
    
    def record_fail(self, test_name: str, expected: Any, got: Any):
        self.failed += 1
        self.errors.append((test_name, expected, got))
    
    @property
    def total(self):
        return self.passed + self.failed
    
    @property
    def success(self):
        return self.failed == 0


class TestSuite:
    """Cryptographic algorithm test suite."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.result = TestResult()
    
    def log(self, message: str):
        if self.verbose:
            print(f"  {message}")
    
    def assert_equal(self, test_name: str, expected: Any, got: Any):
        if expected == got:
            self.result.record_pass()
            self.log(f"[PASS] {test_name}")
        else:
            self.result.record_fail(test_name, expected, got)
            self.log(f"[FAIL] {test_name}")
            self.log(f"  Expected: {expected}")
            self.log(f"  Got:      {got}")
    
    def run_utilities_tests(self):
        """Test utility functions."""
        print("\n1. Testing Utility Functions...")
        
        # Test modular exponentiation
        self.assert_equal("mod_exp(2, 10, 1000)", 24, mod_exp(2, 10, 1000))
        self.assert_equal("mod_exp(3, 13, 47)", 36, mod_exp(3, 13, 47))
        self.assert_equal("mod_exp(7, 256, 13)", 9, mod_exp(7, 256, 13))
        self.assert_equal("mod_exp(0, 0, 1)", 0, mod_exp(0, 0, 1))
        self.assert_equal("mod_exp(1, 0, 100)", 1, mod_exp(1, 0, 100))
        
        # Test GCD
        self.assert_equal("gcd(48, 18)", 6, gcd(48, 18))
        self.assert_equal("gcd(54, 24)", 6, gcd(54, 24))
        self.assert_equal("gcd(17, 13)", 1, gcd(17, 13))
        self.assert_equal("gcd(100, 75)", 25, gcd(100, 75))
        self.assert_equal("gcd(0, 5)", 5, gcd(0, 5))
        
        # Test extended GCD
        g, x, y = extended_gcd(35, 15)
        self.assert_equal("extended_gcd(35, 15) gcd", 5, g)
        self.assert_equal("extended_gcd(35, 15) check", 0, 35 * x + 15 * y - g)
        
        g, x, y = extended_gcd(30, 20)
        self.assert_equal("extended_gcd(30, 20) gcd", 10, g)
        
        # Test modular inverse
        self.assert_equal("mod_inverse(3, 7)", 5, mod_inverse(3, 7))
        self.assert_equal("mod_inverse(7, 13)", 2, mod_inverse(7, 13))
        self.assert_equal("mod_inverse(17, 3120)", 2753, mod_inverse(17, 3120))
        
        # Verify modular inverse property: a * a^(-1) ≡ 1 (mod m)
        for a, m in [(3, 7), (7, 13), (11, 26), (17, 3120)]:
            inv = mod_inverse(a, m)
            product = (a * inv) % m
            self.assert_equal(f"mod_inverse({a}, {m}) verification", 1, product)
        
        # Test primality test
        primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]
        for p in primes:
            self.assert_equal(f"is_prime({p})", True, is_prime(p))
        
        composites = [4, 6, 8, 9, 10, 12, 14, 15, 21, 25]
        for c in composites:
            self.assert_equal(f"is_prime({c})", False, is_prime(c))
        
        # Test bytes/int conversion
        self.assert_equal("bytes_to_int(b'\\x00\\x01')", 1, bytes_to_int(b'\x00\x01'))
        self.assert_equal("int_to_bytes(256, 2)", b'\x01\x00', int_to_bytes(256, 2))
        
        # Test XOR
        self.assert_equal("xor_bytes", b'\x00\x00\x00', xor_bytes(b'\x01\x02\x03', b'\x01\x02\x03'))
        
        # Test PKCS7 padding
        self.assert_equal("pkcs7_pad('ABC', 8)", b'ABC\x05\x05\x05\x05\x05', pkcs7_pad(b'ABC', 8))
        self.assert_equal("pkcs7_pad('ABCDEFG', 8)", b'ABCDEFG\x01', pkcs7_pad(b'ABCDEFG', 8))
        self.assert_equal("pkcs7_unpad(pkcs7_pad('ABC', 8), 8)", b'ABC', 
                         pkcs7_unpad(pkcs7_pad(b'ABC', 8), 8))
    
    def run_aes_tests(self):
        """Test AES implementation."""
        print("\n2. Testing AES Implementation...")
        
        # Test with NIST test vector
        key, plaintext, expected = AES.get_test_vector()
        aes = AES(key)
        
        # Test single block encryption
        ciphertext = aes.encrypt_block(plaintext)
        self.assert_equal("AES-128 encryption (NIST)", expected, ciphertext)
        
        # Test single block decryption
        decrypted = aes.decrypt_block(ciphertext)
        self.assert_equal("AES-128 decryption (NIST)", plaintext, decrypted)
        
        # Test CBC mode
        test_key = b'0123456789abcdef'
        test_aes = AES(test_key)
        
        test_cases = [
            b"Hello, AES!",
            b"Test message for CBC mode",
            b"A" * 16,  # Exactly one block
            b"A" * 17,  # One block + one byte
            b"",  # Empty (will be padded to one block)
            b"X" * 100,  # Multiple blocks
        ]
        
        for i, plaintext in enumerate(test_cases):
            ciphertext = test_aes.encrypt_cbc(plaintext)
            decrypted = test_aes.decrypt_cbc(ciphertext)
            self.assert_equal(f"AES-CBC test {i+1}", plaintext, decrypted)
        
        # Test different keys
        keys = [
            b'\x00' * 16,
            b'\xff' * 16,
            b'abcdefghijklmnop',
        ]
        
        for key in keys:
            aes = AES(key)
            plaintext = b"Test with different key"
            ciphertext = aes.encrypt_cbc(plaintext)
            decrypted = aes.decrypt_cbc(ciphertext)
            self.assert_equal(f"AES key test ({key[:4].hex()}...)", plaintext, decrypted)
        
        # Test block size validation
        try:
            AES(b'short')
            self.assert_equal("AES key length validation", "error", "no error")
        except ValueError:
            self.assert_equal("AES key length validation", "error", "error")
    
    def run_rsa_tests(self):
        """Test RSA implementation."""
        print("\n3. Testing RSA Implementation...")
        
        # Test with small known values
        vectors = RSA.get_test_vectors()
        
        # Test integer encryption/decryption
        rsa_temp = RSA(key_size=256)
        encrypted = rsa_temp.encrypt_int(vectors['plaintext_int'], vectors['public_key'])
        decrypted = rsa_temp.decrypt_int(encrypted, vectors['private_key'])
        self.assert_equal("RSA integer encryption", vectors['plaintext_int'], decrypted)
        
        # Test with actual RSA key pair
        rsa = RSA(key_size=512)
        public_key, private_key = rsa.generate_keypair()
        
        # Test encryption/decryption
        test_messages = [
            b"Hello, RSA!",
            b"Test",
            b"A" * 50,
        ]
        
        for i, msg in enumerate(test_messages):
            try:
                encrypted = rsa.encrypt(msg, public_key)
                decrypted = rsa.decrypt(encrypted, private_key)
                self.assert_equal(f"RSA bytes encryption {i+1}", msg, decrypted)
            except ValueError as e:
                if "too long" in str(e):
                    self.log(f"  Skipping message {i+1} (too long for key)")
        
        # Test digital signatures
        test_msg = b"Message to sign"
        signature = rsa.sign(test_msg, private_key)
        is_valid = rsa.verify(test_msg, signature, public_key)
        self.assert_equal("RSA signature creation/verification", True, is_valid)
        
        # Test invalid signature
        bad_sig = bytearray(signature)
        bad_sig[0] ^= 0xFF
        is_valid_bad = rsa.verify(test_msg, bytes(bad_sig), public_key)
        self.assert_equal("RSA invalid signature rejection", False, is_valid_bad)
        
        # Test signature with different message
        is_valid_diff = rsa.verify(b"Different message", signature, public_key)
        self.assert_equal("RSA different message rejection", False, is_valid_diff)
    
    def run_sha256_tests(self):
        """Test SHA-256 implementation."""
        print("\n4. Testing SHA-256 Implementation...")
        
        # Test against known vectors
        test_vectors = SHA256.get_test_vectors()
        
        for message, expected in test_vectors:
            result = sha256(message.encode('utf-8') if message else b'')
            self.assert_equal(f"SHA-256('{message[:30]}...')", expected, result.hex())
        
        # Test incremental hashing
        sha = SHA256()
        sha.update(b"Hello, ")
        sha.update(b"World!")
        full_hash = sha.hexdigest()
        
        sha2 = SHA256()
        sha2.update(b"Hello, World!")
        full_hash2 = sha2.hexdigest()
        
        self.assert_equal("SHA-256 incremental hashing", full_hash, full_hash2)
        
        # Test reset functionality
        sha3 = SHA256()
        sha3.update(b"test")
        _ = sha3.hexdigest()
        sha3.reset()
        sha3.update(b"test")
        self.assert_equal("SHA-256 reset", True, len(sha3.hexdigest()) == 64)
    
    def run_md5_tests(self):
        """Test MD5 implementation."""
        print("\n5. Testing MD5 Implementation...")
        
        # Test against known vectors
        test_vectors = MD5.get_test_vectors()
        
        for message, expected in test_vectors:
            result = md5(message.encode('utf-8') if message else b'')
            self.assert_equal(f"MD5('{message[:30]}...')", expected, result.hex())
        
        # Test incremental hashing
        md5_hash = MD5()
        md5_hash.update(b"Hello, ")
        md5_hash.update(b"World!")
        full_hash = md5_hash.hexdigest()
        
        md5_hash2 = MD5()
        md5_hash2.update(b"Hello, World!")
        full_hash2 = md5_hash2.hexdigest()
        
        self.assert_equal("MD5 incremental hashing", full_hash, full_hash2)
    
    def run_hmac_tests(self):
        """Test HMAC implementation."""
        print("\n6. Testing HMAC Implementation...")
        
        # Test against RFC 4231 vectors
        test_vectors = HMAC.get_test_vectors()
        
        for key, message, expected in test_vectors:
            result = hmac_sha256(key, message)
            self.assert_equal(
                f"HMAC-SHA256(key, '{message[:20]}...')",
                expected,
                result.hex()
            )
        
        # Test HMAC verification
        hmac_obj = HMAC(b"test-key")
        message = b"test message"
        mac = hmac_obj.compute(message)
        
        self.assert_equal("HMAC verification (valid)", True, hmac_obj.verify(message, mac))
        
        # Test invalid message
        self.assert_equal("HMAC verification (invalid msg)", False, 
                         hmac_obj.verify(b"wrong message", mac))
        
        # Test invalid MAC
        bad_mac = bytearray(mac)
        bad_mac[0] ^= 0xFF
        self.assert_equal("HMAC verification (invalid MAC)", False,
                         hmac_obj.verify(message, bytes(bad_mac)))
        
        # Test with string inputs
        hmac_str = HMAC("secret")
        mac_str = hmac_str.compute("message")
        self.assert_equal("HMAC with strings", True, len(mac_str) == 32)
    
    def run_edge_case_tests(self):
        """Test edge cases and error handling."""
        print("\n7. Testing Edge Cases...")
        
        # Test empty inputs
        self.assert_equal("SHA-256 empty string", 
                         "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                         sha256(b"").hex())
        
        self.assert_equal("MD5 empty string",
                         "d41d8cd98f00b204e9800998ecf8427e",
                         md5(b"").hex())
        
        # Test PKCS7 padding edge cases
        # Exactly one block
        data = b"A" * 16
        padded = pkcs7_pad(data, 16)
        self.assert_equal("PKCS7 full block", 32, len(padded))
        self.assert_equal("PKCS7 full block content", data, pkcs7_unpad(padded, 16))
        
        # Empty data
        padded_empty = pkcs7_pad(b"", 16)
        self.assert_equal("PKCS7 empty data", 16, len(padded_empty))
        self.assert_equal("PKCS7 empty data unpad", b"", pkcs7_unpad(padded_empty, 16))
        
        # Test modular exponentiation edge cases
        self.assert_equal("mod_exp(0, 0, 1)", 0, mod_exp(0, 0, 1))
        self.assert_equal("mod_exp(1, 1, 1)", 0, mod_exp(1, 1, 1))
        self.assert_equal("mod_exp(5, 0, 7)", 1, mod_exp(5, 0, 7))
        
        # Test GCD edge cases
        self.assert_equal("gcd(0, 0)", 0, gcd(0, 0))
        self.assert_equal("gcd(1, 1)", 1, gcd(1, 1))
        
        # Test RSA key size validation
        try:
            RSA(key_size=100)  # Too small
            self.assert_equal("RSA small key rejection", "error", "no error")
        except ValueError:
            self.assert_equal("RSA small key rejection", "error", "error")
    
    def run_performance_tests(self):
        """Run basic performance tests."""
        print("\n8. Running Performance Tests...")
        
        # AES performance
        start = time.time()
        aes = AES(b'0123456789abcdef')
        data = b"X" * 10000
        for _ in range(100):
            aes.encrypt_cbc(data)
        aes_time = time.time() - start
        self.log(f"  AES-128 CBC: {aes_time:.3f}s for 100 encryptions of 10KB")
        
        # SHA-256 performance
        start = time.time()
        for _ in range(1000):
            sha256(b"test data for hashing")
        sha_time = time.time() - start
        self.log(f"  SHA-256: {sha_time:.3f}s for 1000 hashes")
        
        # MD5 performance
        start = time.time()
        for _ in range(1000):
            md5(b"test data for hashing")
        md5_time = time.time() - start
        self.log(f"  MD5: {md5_time:.3f}s for 1000 hashes")
        
        self.log(f"\n  Note: SHA-256/MD5 times include Python overhead")
    
    def run_all(self):
        """Run all test suites."""
        print("=" * 60)
        print("       CRYPTOGRAPHY IMPLEMENTATION LAB - TEST SUITE")
        print("=" * 60)
        
        start_time = time.time()
        
        self.run_utilities_tests()
        self.run_aes_tests()
        self.run_rsa_tests()
        self.run_sha256_tests()
        self.run_md5_tests()
        self.run_hmac_tests()
        self.run_edge_case_tests()
        self.run_performance_tests()
        
        elapsed = time.time() - start_time
        
        # Print summary
        print("\n" + "=" * 60)
        print("       TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"\nTotal tests:  {self.result.total}")
        print(f"Passed:       {self.result.passed}")
        print(f"Failed:       {self.result.failed}")
        print(f"Time elapsed: {elapsed:.2f}s")
        
        if self.result.errors:
            print("\nFailed tests:")
            for name, expected, got in self.result.errors:
                print(f"  - {name}")
                print(f"    Expected: {expected}")
                print(f"    Got:      {got}")
        
        print("\n" + "=" * 60)
        if self.result.success:
            print("       [PASS] ALL TESTS PASSED!")
        else:
            print(f"       [FAIL] {self.result.failed} TEST(S) FAILED!")
        print("=" * 60)
        
        return self.result.success


def run_all_tests(verbose: bool = False):
    """Run the complete test suite."""
    suite = TestSuite(verbose=verbose)
    success = suite.run_all()
    return 0 if success else 1


def main():
    """Main entry point."""
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    exit_code = run_all_tests(verbose)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
