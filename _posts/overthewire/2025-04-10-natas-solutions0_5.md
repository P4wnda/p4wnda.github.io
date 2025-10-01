---
title: "OverTheWire - Natas Solutions 0 - 5"
date: 2025-04-10 12:00:00 +0200
categories: [CTF, OverTheWire, Natas, Web, Cookies]
tags: [CTF, writeup, web-security, natas]
description: "Compact walkthroughs and solutions for OverTheWire Natas levels 0–5."
image:
  path: /assets/img/overthewire/OverTheWire.png
  alt: "Natas level screenshots"
toc: true
mermaid: false
math: false
comments: false
---
# Natas Solutions

This page contains my solutions for the Natas wargame challenges 0 - 5 from OverTheWire.

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

![Level 0 Solution](/assets/img/overthewire/natas0_5/natas0.png)

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

![Level 1 Solution](/assets/img/overthewire/natas0_5/natas1.png)

**Password for Level 2**: [REDACTED]

---

### Level 2 --> Level 3
**URL**: http://natas2.natas.labs.overthewire.org  
**Username**: natas2  
**Password**: [REDACTED]

#### Solution
1. Visit the URL and login with credentials.
2. View the page source to find a reference to a hidden image located at `/files/pixel.png`.
   ![Hidden Pixel](/assets/img/overthewire/natas0_5/natas2_2.png)
3. Download and analyze `pixel.png` using tools like `strings`, `xxd`, or `exiftool`. Confirm that the image itself contains no useful information.
4. Access the `/files` directory directly to explore its contents.
5. Discover a file named `users.txt` within the `/files` directory.
   ![Files Folder](/assets/img/overthewire/natas0_5/natas2_3.png)
6. Open `users.txt` to find the password for the next level.
   ![Solution](/assets/img/overthewire/natas0_5/natas2_1.png)

**Password for Level 3**: [REDACTED]

---

### Level 3 --> Level 4
**URL**: http://natas3.natas.labs.overthewire.org  
**Username**: natas3  
**Password**: [REDACTED]

#### Solution
1. Visit the URL and log in with the provided credentials.
2. Inspect the HTML source code of the page. You will find a comment stating:
   ```
   <!-- No more information leaks!! Not even Google will find it this time... -->
   ```
   ![Comment](/assets/img/overthewire/natas0_5/natas3_1.png)
3. Initially, I was unsure of the comments significance. However, after some exploration, I decided to check the `robots.txt` file, which clarified its meaning.
4. Access the `robots.txt` file directly by appending `/robots.txt` to the URL. The file contains:
   ```
   Disallow: /s3cr3t/
   ```
   ![Disallow](/assets/img/overthewire/natas0_5/natas3_2.png)
5. The `Disallow` directive points to a directory named `/s3cr3t/` that is not indexed by search engines.
6. Navigate to the `/s3cr3t/` directory, where you will find a file named `users.txt`.
7. Open `users.txt` to retrieve the password for the next level.
   ![Solution](/assets/img/overthewire/natas0_5/natas3_3.png)

**Password for Level 4**: [REDACTED]

---

### Level 4 --> Level 5
**URL**: http://natas4.natas.labs.overthewire.org  
**Username**: natas4  
**Password**: [REDACTED]

#### Solution
1. Upon accessing the page, you are presented with a message indicating restricted access.
   ![Greeting](/assets/img/overthewire/natas0_5/natas4_1.png)
2. The page only allows requests originating from `http://natas5.natas.labs.overthewire.org/`. This is controlled by the HTTP "Referer" header.
   ![Access Denied](/assets/img/overthewire/natas0_5/natas4_2.png)
3. Modify the "Referer" header to match the required URL and resend the request.
   ![Access Granted](/assets/img/overthewire/natas0_5/natas4_3.png)
4. The modification is successful, and the password for the next level is revealed.

**Password for Level 5**: [REDACTED]

---

### Level 5 --> Level 6
**URL**: http://natas5.natas.labs.overthewire.org  
**Username**: natas5  
**Password**: [REDACTED]

#### Solution
1. Upon visiting the page, a message appears stating: `Access Disallowed. You are not logged in`.
   ![Youre Not logged in](/assets/img/overthewire/natas0_5/natas5_1.png)

2. By inspecting the HTTP request, I discovered a cookie named `loggedIn` with a value set to `0`.
   ![Cookie LoggedIn](/assets/img/overthewire/natas0_5/natas5_2.png)

3. To gain access, I modified the `loggedIn` cookie value to `1` and resent the request. Cookies are sent in an HTTP request as part of the request headers. When the client sends a request to the server, it includes any cookies associated with the domain in the `Cookie` header. By changing the `loggedIn` value to `1`, the server interpreted this as an authenticated session, granting access and revealing the password for the next level.

    ![Success](/assets/img/overthewire/natas0_5/natas5_3.png)

**Password for Level 6**: [REDACTED]

---
