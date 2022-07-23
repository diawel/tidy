<?php
$response = [];

if (isset($_POST['id']) && isset($_POST['user_token'])) {
  if (file_exists("users/{$_POST['id']}")) {
    $user_data = json_decode(file_get_contents("users/{$_POST['id']}/user.json"), true);
    $match = false;
    for ($i = 0; $i < count($user_data['user_tokens']); $i++) { 
      if ($_POST['user_token'] == $user_data['user_tokens'][$i]) {
        $match = true;
        break;
      }
    }
    if ($match) {
      unlink("users/{$_POST['id']}/user.json");
      unlink("users/{$_POST['id']}/boards.json");
      rmdir("users/{$_POST['id']}");
    } else {
      $response['error'] = 'invalid token';
    }
  } else {
    $response['error'] = 'unknown user';
  }
} else {
  $response['error'] = 'lack of parameters';
}

header("Content-type: application/json");
echo json_encode($response);