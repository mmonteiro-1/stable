<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$mail = new PHPMailer(true);

$name = $_POST["name"];
$email = $_POST["email"];
$subject = $_POST["message"];
$message = $_POST["message"];

$mail->SMTPDebug = SMTP::DEBUG_SERVER;

$mail->isSMTP();
$mail->SMTPAuth = true;

$mail->Host = "smtp.gmail.com";
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;

$mail->Username = "mmonteiro.182@gmail.com";
$mail->Password = "zdxpmtsnijwrvjam";

$mail->setFrom($email, $name);
$mail->addAddress("mmonteiro.182@gmail.com", "Carlos Peixoto");

$mail->Subject = $message;
$mail->Body = $message;

$mail->send();

echo "email sentt";
// header("Location: sent.html");

// zdxpmtsnijwrvjam
