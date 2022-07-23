<?php
/*header("Access-Control-Allow-Origin: localhost:3000");
$response = [];
if (isset($_POST['id']) && isset($_POST['password'])) {
  if (preg_match('/\A(?=.*?[a-z]|[A-Z])(?=.*?\d)\w{3,16}\z/', $_POST['id'])) {
    if (preg_match('/\A(?=.*?[a-z]|[A-Z])(?=.*?\d)\w{6,32}\z/', $_POST['password'])) {
      if (!file_exists("users/{$_POST['id']}")) {
        mkdir("users/{$_POST['id']}", 0705);
        $user_token = substr(str_shuffle(str_repeat('abcdefghijklmnopqrstuvwxyz0123456789', 16)), 0, 16);
        file_put_contents("users/{$_POST['id']}/user.json", json_encode([
          'password_hash' => password_hash($_POST['password'], PASSWORD_DEFAULT),
          'user_tokens' => [$user_token],
          'boards_token' => null
        ]));
        file_put_contents("users/{$_POST['id']}/boards.json", json_encode([]));
        $response['id'] = $_POST['id'];
        $response['user_token'] = $user_token;
      } else {
        $response['error'] = 'the id is already used';
      }
    } else {
      $response['error'] = 'invalid password format';
    }
  } else {
    $response['error'] = 'invalid id format';
  }
} else {
  $response['error'] = 'lack of parameters';
}
*/