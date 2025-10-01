---
layout: post
title: "picoCTF - Transformation"
date: 2025-04-20 12:00:00 +0200
categories: [CTF, picoCTF, Reverse-Engineering, Forensics, Unicode, Text-Encoding, Python]
tags: [CTF, writeup, picoctf, reverse-engineering, forensics, unicode, encoding, python]
description: "Writeup for picoCTF 'Transformation' — reverse engineering and forensic techniques for Unicode/encoding challenges, with Python examples."
image:
  path: /assets/img/picoctf/picoctf.png
  alt: "picoCTF Transformation screenshots"
toc: true
mermaid: false
math: false
comments: false
---


## Overview

This picoCTF challenge provided a mysterious file named `enc` filled with strange-looking Unicode characters. At first glance, it looked like gibberish — but the true task was uncovering a clever obfuscation method that packed two ASCII bytes into each wide Unicode character. 

It was a byte-level encoding trick used to break basic forensic tools like `strings`, `file`, and `xxd`, often used in real-world malware evasion.

---

## Challenge

I'm given this string:

```
灩捯䍔䙻ㄶ形楴獟楮獴㌴摟潦弸弲㘶㠴挲ぽ%
```

And the following Transformation Logic
 ```python
''.join([chr((ord(flag[i]) << 8) + ord(flag[i + 1])) for i in range(0, len(flag), 2)])
```

---

## Step 1: Basic Forensics

```bash
❯ file enc
enc: UTF-8 Unicode text, with no line terminators

❯ strings enc
(no output)

❯ exiftool enc
File Size                       : 57 bytes
File Type                       : TXT
MIME Type                       : text/plain
Encoding                        : UTF-8
Line Count                      : 1
Word Count                      : 1
```

None of the standard tools provided useful data. Confirmed: UTF-8 text — but it's clearly hiding something.

---

## Step 2: xxd Dump

```bash
❯ xxd enc
00000000: e781 a9e6 8daf e48d 94e4 99bb e384 b6e5  ................
00000010: bda2 e6a5 b4e7 8d9f e6a5 aee7 8db4 e38c  ................
00000020: b4e6 919f e6bd a6e5 bcb8 e5bc b2e3 98b6  ................
00000030: e3a0 b4e6 8cb2 e381 bd                   ............
```

These aren't ASCII characters. Looks like multibyte UTF-8 — possibly CJK (Chinese, Japanese, Korean). The payload is encoded.

---

## Step 3: Analyzing the Encoding


The provided Transformation Logicc packs every two characters of a string into one Unicode character:

- `ord(flag[i]) << 8` shifts the first byte 8 bits left
- `+ ord(flag[i + 1])` adds the second byte
- `chr(...)` converts the 16-bit value into a Unicode character

Let’s say the original flag is:


 0. `flag = "Y0"`
 1. `ord('Y')` → ASCII 89  
 2. `ord('0')` → ASCII 48  
 3. `(89 << 8)` → `22784` (this moves 89 to the **high byte**)
 4. `22784 + 48` → `22832`  
 5. `chr(22832)` → Unicode char: '䍐' (just some CJK glyph)

So:
- For every **two ASCII bytes**, they created a **single 16-bit character**.
- This hides readable content from tools like `strings`, and even breaks some hex editors.

This technique is compact and breaks most ASCII-based parsers.

---

## Step 4: Reversing the Transformation

To decode it, I wrote this script:

```python
with open("enc", "r", encoding="utf-8") as f:
    data = f.read()

out = []
for c in data:
    code = ord(c)
    out.append(chr((code >> 8) & 0xff))
    out.append(chr(code & 0xff))

print("".join(out))
```

This reverses the encoding by splitting each Unicode character into two bytes.

---


## Conclusion

This was a subtle and clever obfuscation challenge. No crypto, no compression — just Unicode trickery.

The main takeaway:
> If something looks like junk, maybe it's just **not in the format your tools expect**.


