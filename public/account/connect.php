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
      $boards_token = bin2hex(random_bytes(16));
      $user_data['boards_token'] = $boards_token;
      file_put_contents("users/{$_POST['id']}/user.json", json_encode($user_data));
      $response['boards_token'] = $boards_token;
      $response['boards'] = json_decode(file_get_contents("users/{$_POST['id']}/boards.json"), true);
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