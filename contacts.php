<?php 
if(isset($_POST['submit'])){
    $to = "stable@stablearchviz.com"; // this is your Email address
    $from = $_POST['email']; // this is the sender's Email address
    $first_name = $_POST['first_name'];
    // $last_name = $_POST['last_name'];
    $subject = "Form submission";
    // $subject2 = "Copy of your form submission";
    $message = $first_name . " wrote the following:" . "\n\n" . $_POST['message'];
    // $message2 = "Here is a copy of your message " . $first_name . "\n\n" . $_POST['message'];

    $headers = "From:" . $from;
    // $headers2 = "From:" . $to;
    mail($to,$subject,$message,$headers);
    // mail($from,$subject2,$message2,$headers2); // sends a copy of the message to the sender
    // echo "Mail Sent. Thank you " . $first_name . ", we will contact you shortly.";
    // You can also use header('Location: thank_you.php'); to redirect to another page.
    }
?>

<!DOCTYPE html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar" content="white">
	<meta name="theme-color" content="#FFFFFF">
	<link rel="apple-touch-icon" href="images/favicon/apple-touch-icon.png">
	<link rel="manifest" href="js/manifest.json">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;700;800&family=League+Spartan:wght@400;600;800&display=swap" rel="stylesheet">
	<link rel="stylesheet" type="text/css" href="css/style.css" />
	<script type="text/javascript" src="js/jquery.js"></script>
	<title>Contacts</title>
</head>
<style type="text/css">
	footer {
		background: #2e2e2e;
		left: 0;
		bottom: 0;
	}
	.icon, .email {
		filter: invert(100%);
	}
</style>
<body>
	<nav></nav>
	<div class="row_contacts">
		<div class="about">
			<div>Stable is a 3D studio based in Portugal and bridges the gap between architectural plans and realistic visualizations.</div>
			<div class="social_media">
				<a href="https://www.instagram.com/stablearchviz/">
					<img class="icon" src="images/icon_ig.svg">
				</a>
				<a href="https://www.behance.net/stablearchviz">
					<img class="icon" src="images/icon_behance.svg">
				</a>
			</div>
		</div>
		<div class="contacts">
			<form method="post" action="send-email.php">
				<div class="field">
					<label>Name</label>
					<input type="text" name="first_name" id="first_name" placeholder="Enter your name" required>
				</div>
				<div class="field">
					<label>E-mail</label>
					<input type="email" name="email" id="email" placeholder="Enter your e-mail" required>
				</div>
				<div class="field">
					<label>Message</label>
					<textarea name="message" id="message" rows="3" placeholder="Enter your message" required></textarea>
				</div>
				<div class="field">
					<button type="submit" name="submit" value="Submit">
				</div>
			</form>
			</div>
		</div>
	</div>
	<footer></footer>
	<script type="text/javascript">
		$("nav").load("nav.html");
		$("footer").load("footer.html");
	</script>
<!-- <form action="" method="post">
First Name: <input type="text" name="first_name"><br>
Last Name: <input type="text" name="last_name"><br>
Email: <input type="text" name="email"><br>
Message:<br><textarea rows="5" name="message" cols="30"></textarea><br>
<input type="submit" name="submit" value="Submit">
</form> -->

</body>
</html> 