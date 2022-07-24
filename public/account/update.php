<?php
$response = [];

if (isset($_POST['id']) && isset($_POST['boards_token']) && isset($_POST['boards'])) {
  if (file_exists("users/{$_POST['id']}")) {
    $user_data = json_decode(file_get_contents("users/{$_POST['id']}/user.json"), true);
    if ($_POST['boards_token'] == $user_data['boards_token']) {
      file_put_contents("users/{$_POST['id']}/boards.json", $_POST['boards']);
      $boards_token = bin2hex(random_bytes(16));
      $user_data['boards_token'] = $boards_token;
      file_put_contents("users/{$_POST['id']}/user.json", json_encode($user_data));
      $response['boards_token'] = $boards_token;
      $response['boards'] = json_decode($_POST['boards'], true);
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