---
layout: post
title: "OverTheWire - Natas Solutions 6 - 10"
date: 2025-04-25 12:00:00 +0200
categories: [CTF, OverTheWire, Natas, Web, Decoding, Command-Injection]
tags: [CTF, writeup, web-security, natas]
description: "Solutions and walkthroughs for OverTheWire Natas levels 6–10."
image:
  path: /assets/img/overthewire/OverTheWire.png
  alt: "Natas level screenshots"
toc: true
mermaid: false
math: false
comments: false
---

# Natas Solutions

This page contains my solutions for the Natas wargame challenges 6 - 10 from OverTheWire.

## Overview
Natas teaches the basics of serverside web-security. Each level contains its own website that requires you to find a vulnerability to gain access to the next level.

## Solutions

### Level 6 --> Level 7
**URL**: http://natas6.natas.labs.overthewire.org  
**Username**: natas6  
**Password**: [REDACTED]]

#### Solution

1. Visit the URL and log in with the provided credentials.
2. You will be presented with a form that requires a secret to access the password for the next level.
   ![Secret Input](/assets/img/overthewire/natas6_10/natas6_1.png)
3. The secret is initially unknown. To ensure the form is functional, I tested it with a random value, confirming that it processes input.
   ![Test Input](/assets/img/overthewire/natas6_10/natas6_2.png)
4. To understand how the secret is verified, click the button to view the source code handling the key.
5. The source code reveals the following PHP script:
   ```php
   <?
   include "includes/secret.inc";

   if(array_key_exists("submit", $_POST)) {
       if($secret == $_POST['secret']) {
           print "Access granted. The password for natas7 is <censored>";
       } else {
           print "Wrong secret";
       }
   }
   ?>
   ```
6. The script compares the submitted secret with a value stored in `includes/secret.inc`.
7. Access the `includes/secret.inc` file to retrieve the `$secret` value.
   ![Secret File](/assets/img/overthewire/natas6_10/natas6_3.png)
8. Enter the retrieved secret into the form to gain access and reveal the password for natas7.
   ![Access Granted](/assets/img/overthewire/natas6_10/natas6_4.png)


**Password for Level 7**: [REDACTED]

---

### Level 7 --> Level 8
**URL**: http://natas7.natas.labs.overthewire.org  
**Username**: natas7  
**Password**: [REDACTED]

#### Solution

1. Visit the URL and log in with the provided credentials.
2. The page displays two links: "Home" and "About."
   ![Homepage](/assets/img/overthewire/natas6_10/natas7_1.png)
3. Inspect the HTML source code to find a comment indicating that the password for natas8 is located at `etc/natas_webpass/natas8`. This suggests a path traversal vulnerability.
   ![Comment](/assets/img/overthewire/natas6_10/natas7_2.png)
4. Path traversal attacks exploit vulnerabilities by manipulating file paths to access files and directories outside the intended directory. This is often done using sequences like `../` to navigate up the directory hierarchy.
5. Clicking on the "Home" or "About" links changes the URL, indicating that the page content is dynamically loaded based on the URL.
   ![URL Change](/assets/img/overthewire/natas6_10/natas7_3.png)
6. To exploit the path traversal vulnerability, modify the URL to access `etc/natas_webpass/natas8`. This successfully retrieves the password for the next level.
   ![Malicious Request](/assets/img/overthewire/natas6_10/natas7_4.png)

**Password for Level 8**: [REDACTED]

---

### Level 8 --> Level 9
**URL**: http://natas8.natas.labs.overthewire.org  
**Username**: natas8  
**Password**: [REDACTED]

#### Solution

1. Visit the URL and log in with the provided credentials.
2. The page again presents an input field where a secret must be entered.
   ![Input Field](/assets/img/overthewire/natas6_10/natas8_1.png)
3. Inspect the source code with the Link to the bottom right of it to find the PHP script responsible for handling the secret:
   ```php
   <?
   $encodedSecret = "3d3d516343746d4d6d6c315669563362";

   function encodeSecret($secret) {
       return bin2hex(strrev(base64_encode($secret)));
   }

   if(array_key_exists("submit", $_POST)) {
       if(encodeSecret($_POST['secret']) == $encodedSecret) {
           print "Access granted. The password for natas9 is <censored>";
       } else {
           print "Wrong secret";
       }
   }
   ?>
   ```
4. The script encodes the secret using a combination of `base64_encode`, `strrev`, and `bin2hex` functions. The encoded secret is then compared to a predefined value.
5. To find the correct secret, reverse the encoding process. Use a tool like CyberChef to decode the `encodedSecret` value.
   ![Decoded Secret](/assets/img/overthewire/natas6_10/natas8_3.png)
6. Enter the decoded secret into the input field to gain access and reveal the password for natas9.
   ![Access Granted](/assets/img/overthewire/natas6_10/natas8_2.png)

**Password for Level 9**: [REDACTED]

---

### Level 9 --> Level 10
**URL**: http://natas9.natas.labs.overthewire.org  
**Username**: natas9  
**Password**: [REDACTED]

#### Solution
1. Visit the URL and log in with the provided credentials. You will see an input field with a search button.
   ![Input Field With Search](/assets/img/overthewire/natas6_10/natas9_1.png)
2. Inspect the source code to understand how the input is processed:
   ```php
   <?
   $key = "";

   if(array_key_exists("needle", $_REQUEST)) {
       $key = $_REQUEST["needle"];
   }

   if($key != "") {
       passthru("grep -i $key dictionary.txt");
   }
   ?>
   ```
3. The code uses the `passthru` function to execute a `grep` command on `dictionary.txt` with the user-provided `needle` parameter. However, the input is not sanitized, leading to a command injection vulnerability.
4. Test the input field by entering a simple parameter to observe the behavior.
   ![Testing](/assets/img/overthewire/natas6_10/natas9_2.png)
5. Exploit the vulnerability by crafting a malicious input. Use a semicolon `;` to terminate the current command and inject a new command: `needle=test;cat%20/etc/natas_webpass/natas10`. This retrieves the password for the next level.
   ![Malicious Request](/assets/img/overthewire/natas6_10/natas9_3.png)

**Password for Level 10**: [REDACTED]

---


### Level 10 --> Level 11
**URL**: http://natas10.natas.labs.overthewire.org  
**Username**: natas10  
**Password**: [REDACTED]

#### Solution
1. Visit the URL and log in with the provided credentials. You will see a search field similar to the previous level.
2. Inspect the source code to understand the input processing:
   ```php
   <?
   $key = "";

   if(array_key_exists("needle", $_REQUEST)) {
       $key = $_REQUEST["needle"];
   }

   if($key != "") {
       if(preg_match('/[;|&]/', $key)) {
           print "Input contains an illegal character!";
       } else {
           passthru("grep -i $key dictionary.txt");
       }
   }
   ?>
   ```
3. The code uses the `passthru` function to execute a `grep` command on `dictionary.txt` with the user-provided `needle` parameter. However, characters such as `;`, `|`, and `&` are forbidden to prevent command injection.
4. Exploit the vulnerability by using a regex pattern. The payload `needle=.%20/etc/natas_webpass/natas11&submit=Search` is crafted to bypass the restrictions.
   ![Pwned](/assets/img/overthewire/natas6_10/natas10_1.png)
5. The `.` in regex matches any character, allowing `grep -i .` to output all lines containing at least one character, effectively printing the entire content of `/etc/natas_webpass/natas11`.

**Password for Level 11**: [REDACTED]

---
