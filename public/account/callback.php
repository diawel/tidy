<?php
session_start();
const Consumer_Key = '[API Key]';
const Consumer_Secret = '[API Secret]';

require 'twitteroauth/autoload.php';
use Abraham\TwitterOAuth\TwitterOAuth;

$connection = new TwitterOAuth(Consumer_Key, Consumer_Secret, $_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);
$access_token = $connection->oauth('oauth/access_token', array('oauth_verifier' => $_GET['oauth_verifier'], 'oauth_token'=> $_GET['oauth_token']));
 
$user_connection = new TwitterOAuth(Consumer_Key, Consumer_Secret, $access_token['oauth_token'], $access_token['oauth_token_secret']);
$user_info = $user_connection->get('account/verify_credentials');	

$id = $user_info->id;
$screen_name = $user_info->screen_name;

$user_token = substr(str_shuffle(str_repeat('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16)), 0, 16);
if (file_exists("users/$id")) {
  $user_data = json_decode(file_get_contents("users/$id/user.json"), true);
  array_push($user_data['user_tokens'], $user_token);
  file_put_contents("users/$id/user.json", json_encode($user_data));
} else {
  mkdir("users/$id", 0705);
  file_put_contents("users/$id/user.json", json_encode([
    'screen_name' => $screen_name,
    'user_tokens' => [$user_token],
    'boards_token' => null
  ]));
  file_put_contents("users/$id/boards.json", json_encode([]));
}

$oath_info = [];
$oath_info['id'] = $id;
$oath_info['screen_name'] = $screen_name;
$oath_info['user_token'] = $user_token;

header("Location: /?action=login&id=$id&screen_name=$screen_name&user_token=$user_token");