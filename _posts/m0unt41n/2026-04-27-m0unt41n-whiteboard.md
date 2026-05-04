---
layout: post
title: "m0unt41n - whiteboard"
date: 2026-04-27 12:00:00 +0200
categories: [CTF, m0unt41n]
tags: [CTF, writeup, pwn, integer-overflow, c]
description: "Walkthrough and solution for the m0unt41n challenge 'whiteboard', covering an unsigned integer overflow that allows access to a hidden note."
image:
  path: assets/img/mntain/mnt_ain_logo.png
  alt: "m0unt41n challenge screenshot"
toc: true
mermaid: false
math: false
comments: false
---

## Overview

This m0unt41n challenge provides a small note-taking application written in C. Users can create and view notes by ID. At first glance, the program prevents access to internal notes by shifting user-visible note IDs by one.

However, the note ID parsing contains an **unsigned integer overflow**. By supplying the maximum 32-bit unsigned integer, the program wraps the calculated note index back to `0`, allowing access to the hidden secret note.

---

## Step 1: Application Behavior

The program offers a simple menu:

```text
1. create note
2. view note
3. exit
```

A secret note is added internally when the program starts:

```c
004012a3    int64_t add_secret_note()

004012a3    {
004012a3        __builtin_strcpy(&notes, "secret\n");
004012d4        FILE* fp = fopen("secret.txt", "r");
004012d4        
004012e2        if (!fp)
0040130b            return perror("Error opening secret file please contact the organizers");
0040130b        
0040130b        fgets(&data_404160, 0x100, fp);
00401317        return fclose(fp);
004012a3    }
```

This means index 0 contains the flag or secret content.

Normal user-created notes are not stored at index `0`. Instead, the program increments `note_count` first and then writes to that index:

```c
004014f2    int64_t view_note()

004014f2    {
004014f2        printf("id: ");
0040151c        int32_t note_count = number_input() + 1;
0040151c        
00401526        if (note_count < 0)
00401542            return puts("What did you expect would happen? Maybe try to search stuff that "
00401542            "actually exists next time.\n");
00401542        
00401542        if (note_count > note_count)
0040155f            return puts("After countless hours of searching your desired note still couldn't "
0040155f            "be located. Consider chosing another next time.\n");
0040155f        
0040155f        puts(&data_40267d);
0040158c        printf("\x1b[1m%s\x1b[0m", &(&notes)[(int64_t)note_count * 64]);
004015ae        return puts(((int64_t)note_count << 9) + &data_404160);
004014f2    }

```

So the first user note is stored internally as:

```text
user-visible ID 0 -> notes[1]
```

This is meant to hide index 0 from normal users.

---

## Step 2: Inspecting the Note Lookup

When viewing a note, the program reads the user-provided ID and adds `1`:

```c
int32_t note_count = number_input() + 1;
```

The idea is simple:

```text
input 0 -> notes[1]
input 1 -> notes[2]
input 2 -> notes[3]
```

After that, the program performs bounds checks:

```c
00401526        if (note_count < 0)
00401542            return puts("What did you expect would happen? Maybe try to search stuff that "
00401542            "actually exists next time.\n");
00401542        
00401542        if (note_count > note_count)
0040155f            return puts("After countless hours of searching your desired note still couldn't "
0040155f            "be located. Consider chosing another next time.\n");
```

Finally, it prints the selected note:

```c
0040155f        puts(&data_40267d);
0040158c        printf("\x1b[1m%s\x1b[0m", &(&notes)[(int64_t)note_count * 64]);
004015ae        return puts(((int64_t)note_count << 9) + &data_404160);
```

At first, this looks like `notes[0]` should not be reachable, because user input is always shifted by `+1`.

---

## Step 3: The Vulnerable Input Function

The bug is in the input handling:

```c
0040131e    uint64_t number_input()

0040131e    {
0040131e        void* fsbase;
0040132a        int64_t rax = *(uint64_t*)((char*)fsbase + 40);
0040134c        char input_str[0x38];
0040134c        fgets(&input_str, 50, stdin);
00401365        uint64_t result;
00401365        
00401365        if (!strchr(&input_str, '-'))
0040138e            result = strtoul(&input_str, nullptr, '\n');
00401365        else
00401365        {
00401371            puts("why should there be a note with a negative id? Let's just take the first note.\n");
00401376            result = 0;
00401365        }
00401365        
00401397        *(uint64_t*)((char*)fsbase + 40);
00401397        
004013a0        if (rax == *(uint64_t*)((char*)fsbase + 40))
004013a8            return result;
004013a8        
004013a2        __stack_chk_fail();
004013a2        /* no return */
0040131e    }
}
```

The function returns an `unsigned int`.

On most systems, an `unsigned int` is 32 bits wide. Its maximum value is:

```text
4294967295
```

In hexadecimal:

```text
0xffffffff
```

The important part is that unsigned integer arithmetic wraps around when the value becomes too large.

So this calculation:

```c
4294967295u + 1
```

does not become `4294967296`.

Instead, it wraps around to:

```text
0
```

Or in hexadecimal:

```text
0xffffffff + 1 = 0x00000000
```

---

## Step 4: Triggering the Overflow

To exploit the bug, I selected the option to view a note and entered the maximum unsigned 32-bit integer:

```text
2
4294967295
```

The program then performs this calculation:

```c
int32_t note_count = number_input() + 1;
```

Internally, this becomes:

```text
number_input() = 4294967295
4294967295 + 1 = 0
note_count = 0
```

The bounds checks do not block this:

```text
note_count < 0       false
note_count > count   false
```

Since `note_count` is now `0`, the program prints `notes[0]`.

---

## Step 5: Leaking the Secret Note

Running the exploit input leaks the hidden note:

```text
secret
stairctf{XXXXXXXXXXXXXXXXXXXXXXX}
```

---

## Vulnerability Summary

The core issue is here:

```c
int32_t note_count = number_input() + 1;
```

The function `number_input()` returns a `uint64_t` value parsed by `strtoul()`. However, the result of `number_input() + 1` is stored in a 32-bit signed integer.

With the input `4294967295` or other big inputs which convert to 0xffffffff, the calculation becomes:

4294967295 + 1 = 4294967296
0xffffffff + 1 = 0x100000000

When this value is stored in `int32_t`, it is truncated to the lower 32 bits:

0x100000000 -> 0x00000000

As a result, the calculated note index becomes 0. This bypasses the intended +1 offset and causes the program to access index 0, where the secret note is stored.

The vulnerability can be described as:

An integer truncation bug in the note ID calculation allows an attacker to force the calculated note index to 0, bypassing the intended offset and exposing the hidden note at index 0.

---
