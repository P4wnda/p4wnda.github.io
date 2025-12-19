---
layout: post
title: "HackTheBox - Caps"
date: 2025-12-19 12:00:00 +0200
categories: [CTF, HackTheBox, Linux, Web, Privilege Escalation]
tags: [CTF, writeup, Linux, HTB, Easy]
description: "Writeup for HackTheBox Maschine 'Caps'"
image:
  path: /assets/img/hackthebox/caps/caps_logo.png
  alt: "HackTheBox Caps Logo"
toc: true
mermaid: false
math: true
comments: false
---

## Overview

This challenge involves chaining together web enumeration, network traffic analysis, credential reuse, and local privilege escalation to fully compromise a Linux system. Initial reconnaissance revealed a web service exposing indexed PCAP files, one of which contained cleartext credentials due to the use of insecure protocols. These credentials allowed access to multiple services, ultimately leading to a foothold on the system via SSH.

After gaining user-level access, local enumeration uncovered a misconfigured SUID-enabled Python interpreter. By abusing this configuration, it was possible to escalate privileges and obtain a root shell. The challenge highlights common real-world security issues such as exposed sensitive files, unencrypted network traffic, password reuse, and dangerous SUID permissions on scripting interpreters.

## Tools and Setup
For this Box we used: `nmap`,`ffuf`, `Wireshark`, `ftp/lftp`, `ssh`, `linpeas`, `python3`

## Initial Reconnaissance
I began with a full TCP port scan to identify exposed services:
```bash
nmap -p- -Pn $target -v -T5 --min-rate 1500 --max-retries 3 --open -oN nmap_ports.txt
```
the results then showed a few open ports which were interesting
```bash
PORT   STATE SERVICE
21/tcp open  ftp
22/tcp open  ssh
80/tcp open  http
```
Everytime there is port 80 (HTTP) open I think its probably a web-based entry point, so I focused my enumeration there first.

## Web Enumeration
At first I manually looked around the Site which showed me some interesting stuff. But I also thought of hidden Directories.
So I used ffuf to fuzz for hidden directories and endpoints:
```bash
ffuf -w /opt/dirsearch/small.txt -u http://$target/FUZZ
```
this revealed mostly the same results as the manual exploration.
![Fuzzing Results](/assets/img/hackthebox/caps/fuzz_result.png)

## PCAP File Analysis
Accessing the `/data/x` Endpoint was the most interesting as you were able to download a PCAP File there. I first downloaded the `/data/15` which showed nothing interesting. I then tried to access other PCAP Downloads via IDOR. This worked.

For this I then tested the lowest Index `0` and analyzed its PCAP File with Wireshark.
While inspecting the network traffic, I discovered cleartext FTP credentials:
![Wireshark](/assets/img/hackthebox/caps/pcap.png)
This highlights a common security issue: unencrypted protocols [CWE-319](https://cwe.mitre.org/data/definitions/319.html) leaking credentials in PCAPs.

## Access and User Flag
Using the recovered credentials, I logged into the FTP service via 
```bash
lftp -u nathan,<Password> $target:21
```
![FTP Access](/assets/img/hackthebox/caps/Access.png)

Since SSH was open and credentials often get reused, I tested the same credentials against SSH:
```bash
ssh nathan@$target
```
The login was successful.
> Switching from FTP to SSH provided a more stable and interactive shell for further enumeration.

## Privilege Escalation
I uploaded and executed [linpeas.sh](github.com/peass-ng/PEASS-ng/tree/master/linPEAS) to identify privilege escalation vectors.
One finding stood out:
* `python3` binary had the SUID bit set.

![Python Binary](/assets/img/hackthebox/caps/pythonbinary.png)

This was "Game Over" because that allows arbitrary code execution.
I used Python to set the effective UID to root and spawn a shell:
```bash
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```
This will result in a root shell.

## Root Flag
After escalating privileges, I was able to access the root directory and retrieve the final flag:
![Python Binary](/assets/img/hackthebox/caps/root.png)
(Yes I wrote car by accident...)

## Attack Chain / Summary
Attack flow:
* Port scan → HTTP identified
* Directory fuzzing → /data/{id} endpoint
* PCAP download → cleartext FTP credentials
* FTP access → user flag
* Credential reuse → SSH access
* linPEAS → SUID python3
* SUID abuse → root shell*

## TL;DR
> Fuzzed a web endpoint to download PCAPs, extracted FTP credentials in cleartext, reused them for SSH access, and escalated privileges via a SUID Python binary to gain root.