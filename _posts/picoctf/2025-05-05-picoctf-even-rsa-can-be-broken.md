---
layout: post
title: "picoCTF - Even RSA Can Be Broken"
date: 2025-05-05 12:00:00 +0200
categories: [CTF, picoCTF, Cryptography, RSA, Ciphertext-Attack]
tags: [CTF, writeup, crypto, rsa, ciphertext-attack, number-theory]
description: "Writeup for picoCTF 'Even RSA Can Be Broken' — exploitation of RSA weaknesses using ciphertext attacks and number-theoretic techniques."
image:
  path: /assets/img/picoctf/picoctf.png
  alt: "picoCTF Even RSA Can Be Broken screenshot"
toc: true
mermaid: false
math: true
comments: false
---


## Overview

In this picoCTF challenge, I encountered a remote service that encrypts a hidden flag using textbook RSA (no padding) and reveals only the public key `(N, e)` plus the ciphertext. 

Through careful analysis of the source code and exploiting the deterministic nature of textbook RSA, I was able to perform a `ciphertext attack` to recover the flag.

## Challenge Description

![RSA Challenge](/assets/img/picoctf/even-rsa-can-be-broken/img1.png)

## Tools & Setup

For this challenge, I used:
- netcat to connect to the remote service
- Python 3 with pycryptodome for cryptographic operations
- FactorDB to verify prime factors

## Initial Reconnaissance

First, I connected to the service using netcat to capture the public values:

![nc listen](/assets/img/picoctf/even-rsa-can-be-broken/img2.png)

## Source Code Analysis

The challenge provided source code that implements a basic RSA encryption scheme:

```python
from sys import exit
from Crypto.Util.number import bytes_to_long, inverse
from setup import get_primes

e = 65537

def gen_key(k):
    """
    Generates RSA key with k bits
    """
    p,q = get_primes(k//2)
    N = p*q
    d = inverse(e, (p-1)*(q-1))

    return ((N,e), d)

def encrypt(pubkey, m):
    N,e = pubkey
    return pow(bytes_to_long(m.encode('utf-8')), e, N)

def main(flag):
    pubkey, _privkey = gen_key(1024)
    encrypted = encrypt(pubkey, flag) 
    return (pubkey[0], encrypted)

if __name__ == "__main__":
    flag = open('flag.txt', 'r').read()
    flag = flag.strip()
    N, cypher  = main(flag)
    print("N:", N)
    print("e:", e)
    print("cyphertext:", cypher)
    exit()
```

The key observation I made was that this implementation uses textbook RSA without any padding scheme. This makes the encryption deterministic and vulnerable to ciphertext attacks. I actually didn't notice at first that the modulus N was even, but when I put N into FactorDB, it immediately returned the factors 2 and q. Later, I realized that an even N in RSA means one of the primes must be 2, which makes factoring N trivial—just divide by 2 to get the other prime.

## The Attack

The real vulnerability here was that the modulus `N` was even—meaning one of the primes was 2. This is a fatal flaw in RSA, as it makes factoring `N` trivial. Here’s how I broke the encryption:

1. Observed that `N` was even, so set `p = 2` and computed `q = N // 2`
2. With both primes known, calculated φ(N) = (p-1) * (q-1)
3. Used the public exponent `e` and φ(N) to compute the private key `d`
4. Decrypted the ciphertext using the standard RSA decryption: m = c^d mod N

This attack worked instantly because factoring `N` was as simple as dividing by 2, completely breaking the intended security.

Here's the Python script I used to perform the attack:

```python
#!/usr/bin/env python3
from Crypto.Util.number import inverse, long_to_bytes

# Values from the remote service
N = 22344207545583405712653166286231472210912648604080353181969716140938098336778336723249610416254181582997706542057541677810634012494750541530932822038710522
c = 14363591000893019295624610418888596715286163932332210133666518842194824822442911666076813690666690327959655166237954132696091848568522141348712493081165335

# Since N is even, one prime must be 2
p = 2
q = N // 2  # This gives us the other prime

# Calculate Euler's totient
phi = (p-1)*(q-1)

# Calculate private key
d = inverse(65537, phi)

# Decrypt the message
m = pow(c, d, N)
print(long_to_bytes(m))
```
This successfully decrypted the ciphertext and revealed the flag: 

![Decryption Output](/assets/img/picoctf/even-rsa-can-be-broken/img3.png)

## Why This Works

This attack was possible because of two critical implementation flaws:

1. **Predictable, Unprotected Encryption (No Padding)**: The RSA scheme here used "textbook" encryption, meaning the plaintext was directly turned into a number and encrypted with no additional processing. Without a padding scheme (like OAEP), the same message always produces the same ciphertext, and the structure of the plaintext leaks through. This makes it easy for an attacker to recognize or manipulate ciphertexts, and enables a range of practical attacks—such as message replay, chosen ciphertext, or even direct recovery if the plaintext is small or guessable.

2. **Trivially Factorable Modulus**: The modulus `N` was even, which is a dead giveaway that one of the primes is 2. In cryptanalysis, this is a catastrophic key generation failure: a quick check (even just looking at the last bit of `N`) reveals the issue, and the attacker can instantly recover both private primes. With both primes known, the attacker can reconstruct the private key and decrypt any message, regardless of the encryption exponent or other parameters.

## Security Lessons

From a cryptanalysis perspective, this challenge highlights several key takeaways for secure RSA deployments:

1. **Always Use Padding**: Padding schemes like OAEP are not just a formality—they are essential to prevent attackers from exploiting the deterministic and malleable nature of textbook RSA. Without padding, the encryption is vulnerable to a wide range of practical attacks.

2. **Key Generation Must Be Robust**: Never use small or predictable primes. Key generation should include checks to ensure both primes are large, random, and not equal to small values like 2. Automated validation should catch these issues before keys are ever used.

3. **Parameter Validation and Testing**: Implement sanity checks for all cryptographic parameters. For example, always verify that the modulus is odd and that both primes are sufficiently large and distinct.

4. **Rely on Trusted Libraries**: Avoid implementing cryptographic primitives yourself. Use established, well-audited libraries that handle all the subtle details of key generation, padding, and parameter validation.

## Conclusion

This challenge was a textbook example of how implementation mistakes—especially skipping padding and failing to validate key parameters—can completely undermine RSA security. Even without deep mathematical attacks, simple cryptanalysis and basic checks can break the system wide open if best practices are not followed. 

> Pretty cool to be honest as I never thought that I could break RSA so easily.
