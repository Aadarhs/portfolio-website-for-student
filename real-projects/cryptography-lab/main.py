"""
Cryptography Implementation Lab - CLI Interface.

This module provides an interactive command-line interface to demonstrate
and test all implemented cryptographic algorithms:
- AES-128 encryption/decryption
- RSA encryption/decryption with digital signatures
- SHA-256 and MD5 hashing
- HMAC message authentication

Usage:
    python main.py          # Interactive mode
    python main.py --test   # Run test suite
"""

import os
import sys
import argparse
from typing import Optional

from aes import AES
from rsa import RSA
from hashes import SHA256, MD5, HMAC, sha256, md5, hmac_sha256
from utils import bytes_to_int, int_to_bytes


def print_header():
    """Print the program header."""
    print("\n" + "=" * 60)
    print("       CRYPTOGRAPHY IMPLEMENTATION LAB")
    print("       Educational Cryptographic Algorithms")
    print("=" * 60)


def print_menu():
    """Print the main menu."""
    print("\n┌─────────────────────────────────────────┐")
    print("│          MAIN MENU                       │")
    print("├─────────────────────────────────────────┤")
    print("│  1. AES-128 Encryption/Decryption        │")
    print("│  2. RSA Key Generation                   │")
    print("│  3. RSA Encryption/Decryption            │")
    print("│  4. RSA Digital Signatures               │")
    print("│  5. SHA-256 Hashing                      │")
    print("│  6. MD5 Hashing                          │")
    print("│  7. HMAC Authentication                  │")
    print("│  8. Run All Tests                        │")
    print("│  9. Exit                                 │")
    print("└─────────────────────────────────────────┘")


def demo_aes():
    """Demonstrate AES-128 encryption/decryption."""
    print("\n" + "=" * 50)
    print("       AES-128 ENCRYPTION/DECRYPTION")
    print("=" * 50)
    
    # Get key from user or use default
    key_input = input("\nEnter 16-byte key (hex) or press Enter for demo key: ").strip()
    
    if not key_input:
        key = b'0123456789abcdef'
        print(f"Using demo key: {key.hex()}")
    else:
        try:
            key = bytes.fromhex(key_input)
            if len(key) != 16:
                print("Key must be exactly 16 bytes (32 hex characters)")
                return
        except ValueError:
            print("Invalid hex string. Using demo key.")
            key = b'0123456789abcdef'
    
    # Get message
    message = input("Enter message to encrypt: ").strip()
    if not message:
        message = "Hello, AES-128 Encryption!"
        print(f"Using demo message: {message}")
    
    message_bytes = message.encode('utf-8')
    
    # Create AES instance
    aes = AES(key)
    
    # Encrypt
    print(f"\nOriginal message: {message}")
    print(f"Original bytes:   {message_bytes.hex()}")
    
    ciphertext = aes.encrypt_cbc(message_bytes)
    print(f"\nCiphertext (IV + encrypted):")
    print(f"  Hex:      {ciphertext.hex()}")
    print(f"  Length:   {len(ciphertext)} bytes")
    
    # Extract IV for display
    iv = ciphertext[:16]
    encrypted = ciphertext[16:]
    print(f"  IV:       {iv.hex()}")
    print(f"  Encrypted: {encrypted.hex()}")
    
    # Decrypt
    decrypted = aes.decrypt_cbc(ciphertext)
    print(f"\nDecrypted: {decrypted.decode('utf-8')}")
    
    # Verify
    if decrypted == message_bytes:
        print("\n[PASS] Encryption/Decryption successful!")
    else:
        print("\n[FAIL] Encryption/Decryption FAILED!")


def demo_rsa_keygen():
    """Demonstrate RSA key generation."""
    print("\n" + "=" * 50)
    print("       RSA KEY GENERATION")
    print("=" * 50)
    
    # Get key size
    size_input = input("\nEnter key size in bits (default: 1024): ").strip()
    key_size = 1024
    if size_input:
        try:
            key_size = int(size_input)
            if key_size < 256:
                print("Key size too small. Using 1024 bits.")
                key_size = 1024
        except ValueError:
            print("Invalid input. Using 1024 bits.")
    
    print(f"\nGenerating {key_size}-bit RSA key pair...")
    print("(This may take a moment for larger key sizes)")
    
    rsa = RSA(key_size=key_size)
    public_key, private_key = rsa.generate_keypair()
    
    n, e = public_key
    _, d = private_key
    
    print("\n[PASS] Key pair generated successfully!")
    print(f"\nPublic Key:")
    print(f"  n (modulus):  {n}")
    print(f"  e (exponent): {e}")
    
    print(f"\nPrivate Key:")
    print(f"  n (modulus):  {n}")
    print(f"  d (exponent): {d}")
    
    print(f"\nKey size: {n.bit_length()} bits")
    
    # Save keys option
    save = input("\nSave keys to files? (y/n): ").strip().lower()
    if save == 'y':
        with open('public_key.txt', 'w') as f:
            f.write(f"{n}\n{e}")
        with open('private_key.txt', 'w') as f:
            f.write(f"{n}\n{d}")
        print("Keys saved to public_key.txt and private_key.txt")


def demo_rsa_encryption():
    """Demonstrate RSA encryption/decryption."""
    print("\n" + "=" * 50)
    print("       RSA ENCRYPTION/DECRYPTION")
    print("=" * 50)
    
    # Use small key for demo
    print("\nUsing 512-bit key for demo (fast)...")
    rsa = RSA(key_size=512)
    public_key, private_key = rsa.generate_keypair()
    
    n, e = public_key
    
    # Get message
    message = input("\nEnter message to encrypt: ").strip()
    if not message:
        message = "Hello, RSA!"
        print(f"Using demo message: {message}")
    
    message_bytes = message.encode('utf-8')
    
    # Check if message fits
    max_bytes = (n.bit_length() - 1) // 8
    if len(message_bytes) > max_bytes:
        print(f"Message too long for {n.bit_length()}-bit key.")
        print(f"Max length: {max_bytes} bytes, got {len(message_bytes)} bytes")
        return
    
    # Encrypt
    print(f"\nOriginal message: {message}")
    ciphertext = rsa.encrypt(message_bytes, public_key)
    print(f"Ciphertext (hex): {ciphertext.hex()}")
    
    # Decrypt
    decrypted = rsa.decrypt(ciphertext, private_key)
    print(f"Decrypted: {decrypted.decode('utf-8')}")
    
    # Verify
    if decrypted == message_bytes:
        print("\n[PASS] Encryption/Decryption successful!")
    else:
        print("\n[FAIL] Encryption/Decryption FAILED!")


def demo_rsa_signature():
    """Demonstrate RSA digital signatures."""
    print("\n" + "=" * 50)
    print("       RSA DIGITAL SIGNATURES")
    print("=" * 50)
    
    # Generate key pair
    print("\nUsing 512-bit key for demo...")
    rsa = RSA(key_size=512)
    public_key, private_key = rsa.generate_keypair()
    
    # Get message
    message = input("\nEnter message to sign: ").strip()
    if not message:
        message = "This is an important message!"
        print(f"Using demo message: {message}")
    
    message_bytes = message.encode('utf-8')
    
    # Sign
    print(f"\nSigning message: {message}")
    signature = rsa.sign(message_bytes, private_key)
    print(f"Signature (hex): {signature.hex()}")
    
    # Verify
    print("\nVerifying signature...")
    is_valid = rsa.verify(message_bytes, signature, public_key)
    
    if is_valid:
        print("[PASS] Signature is VALID!")
    else:
        print("[FAIL] Signature is INVALID!")
    
    # Test with tampered message
    print("\nTesting with tampered message...")
    tampered = message_bytes + b" (tampered)"
    is_valid_tampered = rsa.verify(tampered, signature, public_key)
    
    if not is_valid_tampered:
        print("[PASS] Tampered message correctly rejected!")
    else:
        print("[FAIL] Tampered message was NOT rejected!")


def demo_sha256():
    """Demonstrate SHA-256 hashing."""
    print("\n" + "=" * 50)
    print("       SHA-256 HASHING")
    print("=" * 50)
    
    # Get message
    message = input("\nEnter message to hash: ").strip()
    if not message:
        message = "Hello, SHA-256!"
        print(f"Using demo message: {message}")
    
    # Hash
    hash_obj = SHA256()
    digest = hash_obj.hash(message.encode('utf-8'))
    
    print(f"\nOriginal message: {message}")
    print(f"SHA-256 hash (hex): {digest.hex()}")
    print(f"Hash length: {len(digest)} bytes ({len(digest) * 8} bits)")
    
    # Show incremental hashing
    print("\nIncremental hashing demo:")
    hash_obj.reset()
    for i, char in enumerate(message[:5]):
        hash_obj.update(char.encode('utf-8'))
        print(f"  After '{char}': {hash_obj.hexdigest()[:32]}...")
    
    # Verify against test vector
    test_result = sha256("abc")
    expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    if test_result.hex() == expected:
        print("\n[PASS] SHA-256 implementation verified against test vector!")
    else:
        print("\n[FAIL] SHA-256 verification failed!")


def demo_md5():
    """Demonstrate MD5 hashing."""
    print("\n" + "=" * 50)
    print("       MD5 HASHING")
    print("=" * 50)
    
    # Get message
    message = input("\nEnter message to hash: ").strip()
    if not message:
        message = "Hello, MD5!"
        print(f"Using demo message: {message}")
    
    # Hash
    hash_obj = MD5()
    digest = hash_obj.hash(message.encode('utf-8'))
    
    print(f"\nOriginal message: {message}")
    print(f"MD5 hash (hex): {digest.hex()}")
    print(f"Hash length: {len(digest)} bytes ({len(digest) * 8} bits)")
    
    # Note about security
    print("\n[WARN] Note: MD5 is cryptographically broken and should not be")
    print("   used for security purposes. Included for educational comparison.")
    
    # Verify against test vector
    test_result = md5("abc")
    expected = "900150983cd24fb0d6963f7d28e17f72"
    if test_result.hex() == expected:
        print("\n[PASS] MD5 implementation verified against test vector!")
    else:
        print("\n[FAIL] MD5 verification failed!")


def demo_hmac():
    """Demonstrate HMAC message authentication."""
    print("\n" + "=" * 50)
    print("       HMAC AUTHENTICATION")
    print("=" * 50)
    
    # Get key and message
    key = input("\nEnter secret key: ").strip()
    if not key:
        key = "my-secret-key"
        print(f"Using demo key: {key}")
    
    message = input("Enter message to authenticate: ").strip()
    if not message:
        message = "Important message"
        print(f"Using demo message: {message}")
    
    # Compute HMAC
    hmac_obj = HMAC(key)
    mac = hmac_obj.compute(message.encode('utf-8'))
    
    print(f"\nKey:      {key}")
    print(f"Message:  {message}")
    print(f"HMAC-SHA256: {mac.hex()}")
    
    # Verify
    print("\nVerifying HMAC...")
    is_valid = hmac_obj.verify(message.encode('utf-8'), mac)
    
    if is_valid:
        print("[PASS] HMAC is VALID!")
    else:
        print("[FAIL] HMAC is INVALID!")
    
    # Test with tampered message
    print("\nTesting with tampered message...")
    tampered = message + " (tampered)"
    is_valid_tampered = hmac_obj.verify(tampered.encode('utf-8'), mac)
    
    if not is_valid_tampered:
        print("[PASS] Tampered message correctly rejected!")
    else:
        print("[FAIL] Tampered message was NOT rejected!")
    
    # Verify against test vector
    test_key = b"Jefe"
    test_msg = b"what do ya want for nothing?"
    test_hmac = hmac_sha256(test_key, test_msg)
    expected = "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
    
    if test_hmac.hex() == expected:
        print("\n[PASS] HMAC implementation verified against RFC 4231 test vector!")
    else:
        print("\n[FAIL] HMAC verification failed!")


def run_tests():
    """Run the complete test suite."""
    print("\n" + "=" * 50)
    print("       RUNNING TEST SUITE")
    print("=" * 50)
    print("\nThis will run comprehensive tests on all implementations...")
    print("Please wait, this may take a minute...\n")
    
    # Import and run tests
    from tests import run_all_tests
    run_all_tests()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Cryptography Implementation Lab')
    parser.add_argument('--test', action='store_true', help='Run test suite')
    args = parser.parse_args()
    
    print_header()
    
    if args.test:
        run_tests()
        return
    
    while True:
        print_menu()
        
        choice = input("\nSelect option (1-9): ").strip()
        
        if choice == '1':
            demo_aes()
        elif choice == '2':
            demo_rsa_keygen()
        elif choice == '3':
            demo_rsa_encryption()
        elif choice == '4':
            demo_rsa_signature()
        elif choice == '5':
            demo_sha256()
        elif choice == '6':
            demo_md5()
        elif choice == '7':
            demo_hmac()
        elif choice == '8':
            run_tests()
        elif choice == '9':
            print("\nThank you for using the Cryptography Implementation Lab!")
            print("Remember: This is for educational purposes only.")
            print("For real applications, use established cryptographic libraries.\n")
            sys.exit(0)
        else:
            print("\nInvalid option. Please select 1-9.")
        
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()
