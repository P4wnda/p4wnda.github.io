---
layout: post
title: Natas Solutions
date: 2025-04-10
categories: [OverTheWire, natas]
---
# Natas Solutions

This page contains my solutions for the Natas wargame challenges from OverTheWire.

## Overview
Natas teaches the basics of serverside web-security. Each level contains its own website that requires you to find a vulnerability to gain access to the next level.

## Solutions

### Level 0 --> Level 1
**URL**: http://natas0.natas.labs.overthewire.org  
**Username**: natas0  
**Password**: natas0

#### Solution
1. Visit the URL and login with credentials
2. Right click and View Page Source
3. Find password in HTML comments

![Level 0 Solution](/assets/img/overthewire/natas/natas0.png)

**Password for Level 1**: [REDACTED]

---

### Level 1 --> Level 2
**URL**: http://natas1.natas.labs.overthewire.org  
**Username**: natas1  
**Password**: [REDACTED]

#### Solution
1. Visit the URL and login with credentials
2. Press F12 to open Developer Tools (right-click is disabled)
3. View page source to find password in HTML comments

![Level 1 Solution](/assets/img/overthewire/natas/natas1.png)

**Password for Level 2**: [REDACTED]

---

### Level 2 --> Level 3
**URL**: http://natas2.natas.labs.overthewire.org  
**Username**: natas2  
**Password**: [REDACTED]

#### Solution
1. Visit the URL and login with credentials.
2. View the page source to find a reference to a hidden image located at `/files/pixel.png`.
   ![Hidden Pixel](/assets/img/overthewire/natas/natas2_2.png)
3. Download and analyze `pixel.png` using tools like `strings`, `xxd`, or `exiftool`. Confirm that the image itself contains no useful information.
4. Access the `/files` directory directly to explore its contents.
5. Discover a file named `users.txt` within the `/files` directory.
   ![Hidden Pixel](/assets/img/overthewire/natas/natas2_3.png)
6. Open `users.txt` to find the password for the next level.
   ![Hidden Pixel](/assets/img/overthewire/natas/natas2_1.png)

**Password for Level 3**: [REDACTED]

---

