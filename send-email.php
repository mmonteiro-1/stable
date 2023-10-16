<?php
    ini_set( 'display_errors', 1 );
    error_reporting( E_ALL );
    $from = $_POST['email']; // this is the sender's Email address
    $to = "mmonteiro.182@gmail.com";
    $name = $_POST['name'];
    $subject = "Website contact";
    $message = $_POST['message'];
    $headers = "From:" . $from;
    mail($to,$name,$subject,$message, $headers);
    echo "The email message was sent.";
?>