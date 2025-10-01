---
layout: post
title: "picoCTF - Cookies"
date: 2025-04-20 12:00:00 +0200
categories: [CTF, picoCTF, Web, IDOR, Cookies]
tags: [CTF, writeup, web-security, picoctf, cookies, idor]
description: "Walkthrough and solution for the picoCTF challenge 'Cookies', covering IDOR and cookie-based vulnerabilities."
image:
  path: /assets/img/picoctf/picoctf.png
  alt: "picoCTF Cookies challenge screenshot"
toc: true
mermaid: false
math: false
comments: false
---


## Overview

This picoCTF challenge featured a web page that let users search for different types of cookies. At first glance, it seemed harmless — but under the hood, it revealed a classic **Insecure Direct Object Reference (IDOR)** vulnerability.

Using Burp Suite and cookie manipulation, I was able to brute-force a numeric identifier and extract the flag.

---

## Step 1: Application Behavior

The page allows users to search for cookies by name using an input field. When a search is made, a request is sent with a cookie that looks like this:

```
Cookie: name=VALUE
```
![Good Cookie](/assets/img/picoctf/cookies/img1.png)

Certain cookies like `snickerdoodle` are recognized as valid but non-special:

> That is a cookie! Not very special though...

![Snickerdoodle Response](/assets/img/picoctf/cookies/img2.png)

Others, such as `bananacookie`, return:

> That doesn't appear to be a valid cookie.


![Bad Cookie](/assets/img/picoctf/cookies/img5.png)

This suggests that cookie names are mapped to internal identifiers used for server-side validation.

---

## Step 2: Inspecting the Request

Using Burp Suite, I noticed that the actual validation is done using a **numeric value** in the `name` cookie — not the string I typed in.

Example request:

```
GET /check HTTP/1.1
Host: mercury.picoctf.net:6418
Cookie: name=3
```

This hinted at an ID-based lookup — likely an internal ID corresponding to a cookie entry.

---

## Step 3: Brute Forcing with Burp Intruder

To find the correct ID, I used Burp Intruder with the following settings:

- **Payload Position:** `name=§§`
- **Payload Type:** Numbers
- **Range:** 0 to 25
- **Step:** 1

After launching the attack, I observed the responses. All failed with the same rejection message — until request number **18**.

![Burp Intruder Results](/assets/img/picoctf/cookies/img4.png)

---

## Step 4: Success at ID 18

When the `name=18` cookie was sent, the response included the flag.

This confirmed the vulnerability was an **IDOR**, where internal object references (in this case, cookie IDs) were not properly protected.
![Burp Suite Setup](/assets/img/picoctf/cookies/img3.png)

---

## Conclusion

This was a simple but effective example of an **IDOR vulnerability** in a web application. Even though user-facing input seemed harmless, internal validation logic exposed a numeric identifier that could be brute-forced.

### Lessons:
- Never trust client-side identifiers — especially when tied to authorization.
- Always implement access controls and validation on the server side.
- Rate limiting and session validation can help prevent brute-force attacks.

**Flag:** `picoCTF{redacted_for_blog}`

