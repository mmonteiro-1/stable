<?php 
if(isset($_POST['submit'])){
    $to = "mmonteiro.182@gmail.com"; // this is your Email address
    $from = $_POST['email']; // this is the sender's Email address
    $first_name = $_POST['first_name'];
    $subject = "Form submission";
    $message = $_POST['message'];

    $headers = "From:" . $from;
    mail($to,$subject,$message,$headers);
    // echo "Mail Sent. Thank you " . $first_name . ", we will contact you shortly.";
    // You can also use header('Location: thank_you.php'); to redirect to another page.
    // You cannot use header and echo together. It's one or the other.
    }
?>