"""
Mathematical utility functions for cryptographic operations.

This module provides foundational math functions used across the cryptographic
implementations, including modular arithmetic, number theory, and conversions.
"""

from typing import Tuple, Optional


def mod_exp(base: int, exponent: int, modulus: int) -> int:
    """
    Perform modular exponentiation using the square-and-multiply algorithm.
    
    Args:
        base: The base number
        exponent: The exponent (non-negative)
        modulus: The modulus (positive)
    
    Returns:
        (base ** exponent) % modulus
    
    Raises:
        ValueError: If modulus is not positive
    """
    if modulus <= 0:
        raise ValueError("Modulus must be positive")
    if exponent < 0:
        raise ValueError("Exponent must be non-negative")
    if modulus == 1:
        return 0
    
    result = 1
    base = base % modulus
    
    while exponent > 0:
        # If exponent is odd, multiply base with result
        if exponent % 2 == 1:
            result = (result * base) % modulus
        
        # Exponent must be even now
        exponent = exponent >> 1  # Divide by 2
        base = (base * base) % modulus
    
    return result


def gcd(a: int, b: int) -> int:
    """
    Compute the Greatest Common Divisor using the Euclidean algorithm.
    
    Args:
        a: First integer
        b: Second integer
    
    Returns:
        The GCD of a and b
    """
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a


def extended_gcd(a: int, b: int) -> Tuple[int, int, int]:
    """
    Extended Euclidean Algorithm.
    
    Computes integers x, y such that: a*x + b*y = gcd(a, b)
    
    Args:
        a: First integer
        b: Second integer
    
    Returns:
        Tuple of (gcd, x, y) where a*x + b*y = gcd(a, b)
    """
    if a == 0:
        return b, 0, 1
    
    gcd_val, x1, y1 = extended_gcd(b % a, a)
    x = y1 - (b // a) * x1
    y = x1
    
    return gcd_val, x, y


def mod_inverse(a: int, m: int) -> int:
    """
    Compute the modular multiplicative inverse.
    
    Finds x such that (a * x) % m == 1
    
    Args:
        a: The number to find inverse of
        m: The modulus
    
    Returns:
        The modular inverse of a modulo m
    
    Raises:
        ValueError: If modular inverse doesn't exist
    """
    gcd_val, x, _ = extended_gcd(a % m, m)
    
    if gcd_val != 1:
        raise ValueError(f"Modular inverse doesn't exist for {a} mod {m}")
    
    return x % m


def is_prime(n: int, iterations: int = 20) -> bool:
    """
    Test if a number is prime using the Miller-Rabin primality test.
    
    Args:
        n: The number to test
        iterations: Number of rounds of testing (higher = more accurate)
    
    Returns:
        True if n is probably prime, False if definitely composite
    """
    if n < 2:
        return False
    if n == 2 or n == 3:
        return True
    if n % 2 == 0:
        return False
    
    # Write n-1 as 2^r * d
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2
    
    # Perform iterations rounds
    for _ in range(iterations):
        if not miller_rabin_round(n, r, d):
            return False
    
    return True


def miller_rabin_round(n: int, r: int, d: int) -> bool:
    """
    Perform a single round of Miller-Rabin primality test.
    
    Args:
        n: The number being tested
        r: The exponent of 2 in n-1
        d: The odd part of n-1
    
    Returns:
        True if the round passes (probably prime), False if definitely composite
    """
    import random
    
    # Pick a random witness
    a = random.randrange(2, n - 1)
    
    x = mod_exp(a, d, n)
    
    if x == 1 or x == n - 1:
        return True
    
    for _ in range(r - 1):
        x = mod_exp(x, 2, n)
        if x == n - 1:
            return True
    
    return False


def generate_prime(bits: int) -> int:
    """
    Generate a random prime number with the specified number of bits.
    
    Args:
        bits: Number of bits in the prime (e.g., 512 for RSA-1024)
    
    Returns:
        A random prime number
    """
    import random
    
    while True:
        # Generate random odd number with correct bit length
        n = random.getrandbits(bits)
        # Set the highest bit to ensure correct length
        n |= (1 << (bits - 1))
        # Set the lowest bit to make it odd
        n |= 1
        
        # Quick divisibility tests for small primes
        if n % 3 == 0 or n % 5 == 0 or n % 7 == 0:
            continue
        
        # Test for primality
        if is_prime(n):
            return n


def bytes_to_int(data: bytes) -> int:
    """Convert bytes to integer (big-endian)."""
    return int.from_bytes(data, byteorder='big')


def int_to_bytes(n: int, length: int = None) -> bytes:
    """
    Convert integer to bytes (big-endian).
    
    Args:
        n: The integer to convert
        length: Desired output length in bytes (padded with zeros if needed)
    
    Returns:
        Byte representation of the integer
    """
    if n < 0:
        raise ValueError("Cannot convert negative integer to bytes")
    
    if length is None:
        if n == 0:
            return b'\x00'
        length = (n.bit_length() + 7) // 8
    
    return n.to_bytes(length, byteorder='big')


def xor_bytes(a: bytes, b: bytes) -> bytes:
    """
    XOR two byte strings.
    
    Args:
        a: First byte string
        b: Second byte string
    
    Returns:
        XOR of a and b
    
    Raises:
        ValueError: If lengths don't match
    """
    if len(a) != len(b):
        raise ValueError(f"Length mismatch: {len(a)} vs {len(b)}")
    
    return bytes(x ^ y for x, y in zip(a, b))


def pkcs7_pad(data: bytes, block_size: int) -> bytes:
    """
    Apply PKCS7 padding to data.
    
    Args:
        data: Data to pad
        block_size: Block size in bytes
    
    Returns:
        Padded data
    
    Raises:
        ValueError: If block_size is invalid
    """
    if block_size < 1 or block_size > 255:
        raise ValueError("Block size must be between 1 and 255")
    
    padding_length = block_size - (len(data) % block_size)
    padding = bytes([padding_length] * padding_length)
    return data + padding


def pkcs7_unpad(data: bytes, block_size: int) -> bytes:
    """
    Remove PKCS7 padding from data.
    
    Args:
        data: Padded data
        block_size: Block size in bytes
    
    Returns:
        Unpadded data
    
    Raises:
        ValueError: If padding is invalid
    """
    if not data:
        raise ValueError("Empty data")
    
    if len(data) % block_size != 0:
        raise ValueError(f"Data length {len(data)} is not a multiple of block size {block_size}")
    
    padding_length = data[-1]
    
    # Validate padding
    if padding_length == 0 or padding_length > block_size:
        raise ValueError(f"Invalid padding length: {padding_length}")
    
    # Check all padding bytes
    for i in range(padding_length):
        if data[-(i + 1)] != padding_length:
            raise ValueError("Invalid PKCS7 padding")
    
    return data[:-padding_length]


def split_blocks(data: bytes, block_size: int) -> list:
    """
    Split data into blocks of specified size.
    
    Args:
        data: Data to split
        block_size: Size of each block in bytes
    
    Returns:
        List of byte blocks
    """
    return [data[i:i + block_size] for i in range(0, len(data), block_size)]
