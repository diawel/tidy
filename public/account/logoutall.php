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
      $user_data['user_tokens'] = [];
      file_put_contents("users/{$_POST['id']}/user.json", json_encode($user_data));
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