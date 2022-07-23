<?php
session_start();
const Consumer_Key = '[API Key]';
const Consumer_Secret = '[API Secret]';
const Callback = 'https://tidy.diawel.me/account/callback.php';

require 'twitteroauth/autoload.php';
use Abraham\TwitterOAuth\TwitterOAuth;

$connection = new TwitterOAuth(Consumer_Key, Consumer_Secret);
$request_token = $connection->oauth('oauth/request_token', ['oauth_callback' => Callback]);

$_SESSION['oauth_token'] = $request_token['oauth_token'];
$_SESSION['oauth_token_secret'] = $request_token['oauth_token_secret'];

$url = $connection->url('oauth/authorize', ['oauth_token' => $request_token['oauth_token']]);
header("Location: $url");