---
layout: post
title: "picoCTF - Flag Hunters"
date: 2025-04-20 12:00:00 +0200
categories: [CTF, picoCTF, Python, Input-Injection, Reverse-Engineering]
tags: [CTF, writeup, picoctf, python, reverse-engineering, input-injection]
description: "Walkthrough and solution for the picoCTF challenge 'Flag Hunters', focusing on Python input injection and reverse engineering."
image:
  path: /assets/img/picoctf/picoctf.png
  alt: "picoCTF Flag Hunters challenge screenshot"
toc: true
mermaid: false
math: false
comments: false
---


## Overview

This picoCTF challenge presented a custom Python interpreter disguised as a musical lyric processor. The real goal was to reverse the execution flow to reveal a hidden flag buried in the unexecuted part of the script.

---

## Step 1: Challenge Description

The remote server ran a Python script over a netcat session. 

![Initial Songtext](/assets/img/picoctf/flag%20hunters/img1.png)

It simulated a song-like script processor, with keywords like `REFRAIN`, `RETURN`, and `END` defining control flow.

By reviewing the Python source, I determined that the script concatenated a secret `intro` section (which included the flag) before continuing with the body of the "song". Specifically:

- The flag was read from `flag.txt` and appended to a string on line 3:
  ```python
  secret_intro = '''Pico warriors rising, puzzles laid bare,
  Solving each challenge with precision and flair.
  With unity and skill, flags we deliver,
  The ether’s ours to conquer, ''' + flag + '\n'
  ```

- Execution started at `[VERSE1]` because of this call:
  ```python
  reader(song_flag_hunters, '[VERSE1]')
  ```

- The `reader()` function parsed lines one at a time, looking for keywords like `RETURN`, `REFRAIN`, `CROWD`, or `END`. If a line began with `CROWD`, the function prompted for input and inserted it into the script like this:
  ```python
  song_lines[lip] = 'Crowd: ' + crowd_input
  ```

This setup meant I couldn’t directly jump to the flag’s location without bypassing the hardcoded input format.

---

## Step 2: Understanding Control Flow

The interpreter recognized valid `RETURN` statements in the format:

```
RETURN <line_number>
```

However, input was prefixed automatically with `Crowd:`, making any naïve attempt to redirect control flow invalid. For example, the input:

```
RETURN 3
```

became:

```
Crowd: RETURN 3
```

This failed to match the regex `^RETURN [0-9]+`, which the script used to identify jump instructions.

---

## Step 3: Exploiting Multi-Statement Parsing

I found that the interpreter split each line by the `;` delimiter and processed each part individually. This allowed me to bypass the `Crowd:` prefix by placing a valid command after a harmless dummy statement.

**Exploit Input:**
```
x;RETURN 3
```

After injection, the script evaluated:
```
song_lines[lip] = 'Crowd: x;RETURN 3'
```

The line was split on `;`, resulting in:
1. `Crowd: x` → ignored
2. `RETURN 3` → valid, triggered a jump

Execution resumed at line 3, which printed the flag.

---

## Step 4: Retrieving the Flag

With the crafted input, the script output:
```
The ether’s ours to conquer, picoCTF{*************}
```
![Exploit Success](/assets/img/picoctf/flag%20hunters/img2.png)

This confirmed the exploit succeeded in redirecting execution to an otherwise unreachable line.

---

## Conclusion

This challenge demonstrated how input injection combined with weak parsing logic can lead to powerful exploitation. Key insights:

- Custom interpreters are often fragile and improperly validate control flow.
- Regex-based line parsing introduces opportunities to evade constraints.
- `;` delimiters can be weaponized to stack multiple statements into one line.

**Flag:** `picoCTF{*************}`

