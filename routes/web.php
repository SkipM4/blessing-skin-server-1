<?php

use App\Http\Middleware;

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/', 'HomeController@index');
Route::get('/index.php', 'HomeController@index');

Route::get('/locale/{lang}', 'HomeController@locale');

/*
 * Auth
 */
Route::group(['prefix' => 'auth'], function () {
    Route::group(['middleware' => 'guest'], function () {
        Route::get('/login', 'AuthController@login');
        Route::get('/register', 'AuthController@register');
        Route::get('/forgot', 'AuthController@forgot');
        Route::get('/reset/{uid}', 'AuthController@reset')->name('auth.reset')->middleware('signed');

        Route::get('/login/{driver}', 'AuthController@oauthLogin');
        Route::get('/login/{driver}/callback', 'AuthController@oauthCallback');
    });

    Route::post('/logout', 'AuthController@logout')->middleware('authorize');
    Route::any('/captcha', 'AuthController@captcha');

    Route::post('/login', 'AuthController@handleLogin');
    Route::post('/register', 'AuthController@handleRegister');
    Route::post('/forgot', 'AuthController@handleForgot');
    Route::post('/reset/{uid}', 'AuthController@handleReset')->middleware('signed');
    Route::view('/bind', 'auth.bind')->middleware(['authorize', Middleware\EnsureEmailFilled::class]);
    Route::post('/bind', 'AuthController@fillEmail')->middleware(['authorize', Middleware\EnsureEmailFilled::class]);
    Route::get('/verify/{uid}', 'AuthController@verify')->name('auth.verify')->middleware('signed');
});

/*
 * User Center
 */
Route::group([
    'middleware' => ['authorize', Middleware\RequireBindPlayer::class],
    'prefix' => 'user',
], function () {
    Route::any('', 'UserController@index');
    Route::get('/notifications/{id}', 'UserController@readNotification');
    Route::get('/score-info', 'UserController@scoreInfo');
    Route::post('/sign', 'UserController@sign');

    Route::view('/reports', 'user.report');
    Route::get('/report-list', 'ReportController@track');

    // Profile
    Route::get('/profile', 'UserController@profile');
    Route::post('/profile', 'UserController@handleProfile');
    Route::post('/profile/avatar', 'UserController@setAvatar');

    // Email Verification
    Route::post('/email-verification', 'UserController@sendVerificationEmail');

    // Player
    Route::group(['prefix' => 'player', 'middleware' => 'verified'], function () {
        Route::any('', 'PlayerController@index');
        Route::get('/list', 'PlayerController@listAll');
        Route::post('/add', 'PlayerController@add');
        Route::post('/set/{pid}', 'PlayerController@setTexture');
        Route::post('/texture/clear/{pid}', 'PlayerController@clearTexture');
        Route::post('/rename/{pid}', 'PlayerController@rename');
        Route::post('/delete/{pid}', 'PlayerController@delete');
        Route::view('/bind', 'user.bind');
        Route::post('/bind', 'PlayerController@bind');
    });

    // Closet
    Route::get('/closet', 'ClosetController@index');
    Route::get('/closet-data', 'ClosetController@getClosetData');
    Route::post('/closet/add', 'ClosetController@add');
    Route::post('/closet/remove/{tid}', 'ClosetController@remove');
    Route::post('/closet/rename/{tid}', 'ClosetController@rename');

    // OAuth2 Management
    Route::view('/oauth/manage', 'user.oauth')->middleware('verified');
});

/*
 * Skin Library
 */
Route::group(['prefix' => 'skinlib'], function () {
    Route::view('', 'skinlib.index');
    Route::any('/info/{tid}', 'SkinlibController@info');
    Route::any('/show/{tid}', 'SkinlibController@show');
    Route::any('/data', 'SkinlibController@getSkinlibFiltered');

    Route::group([
        'middleware' => ['authorize', 'verified'],
    ], function () {
        Route::get('/upload', 'SkinlibController@upload');
        Route::post('/upload', 'SkinlibController@handleUpload');
        Route::post('/model', 'SkinlibController@model');
        Route::post('/rename', 'SkinlibController@rename');
        Route::post('/privacy', 'SkinlibController@privacy');
        Route::post('/delete', 'SkinlibController@delete');
        Route::post('/report', 'ReportController@submit');
    });
});

/*
 * Admin Panel
 */
Route::group(['middleware' => ['authorize', 'admin'], 'prefix' => 'admin'], function () {
    Route::get('/', 'AdminController@index');
    Route::get('/chart', 'AdminController@chartData');
    Route::post('/notifications/send', 'AdminController@sendNotification');

    Route::any('/customize', 'AdminController@customize');
    Route::any('/score', 'AdminController@score');
    Route::any('/options', 'AdminController@options');
    Route::any('/resource', 'AdminController@resource');

    Route::get('/status', 'AdminController@status');

    Route::view('/users', 'admin.users');
    Route::post('/users', 'AdminController@userAjaxHandler');
    Route::any('/user-data', 'AdminController@getUserData');

    Route::view('/players', 'admin.players');
    Route::post('/players', 'AdminController@playerAjaxHandler');
    Route::any('/player-data', 'AdminController@getPlayerData');

    Route::view('/reports', 'admin.reports');
    Route::post('/reports', 'ReportController@review');
    Route::any('/report-data', 'ReportController@manage');

    Route::group(['prefix' => 'i18n'], function () {
        Route::view('', 'admin.i18n');
        Route::get('list', 'TranslationsController@list');
        Route::post('', 'TranslationsController@create');
        Route::put('', 'TranslationsController@update');
        Route::delete('', 'TranslationsController@delete');
    });

    Route::group(['prefix' => 'plugins', 'middleware' => 'super-admin'], function () {
        Route::get('/data', 'PluginController@getPluginData');

        Route::view('/manage', 'admin.plugins');
        Route::post('/manage', 'PluginController@manage');
        Route::any('/config/{name}', 'PluginController@config');
        Route::get('/readme/{name}', 'PluginController@readme');

        Route::view('/market', 'admin.market');
        Route::get('/market-data', 'MarketController@marketData');
        Route::get('/market/check', 'MarketController@checkUpdates');
        Route::post('/market/download', 'MarketController@download');
    });

    Route::group(['prefix' => 'update', 'middleware' => 'super-admin'], function () {
        Route::any('', 'UpdateController@showUpdatePage');
        Route::get('/check', 'UpdateController@checkUpdates');
        Route::any('/download', 'UpdateController@download');
    });
});

/*
 * Setup and Update
 */
Route::group(['prefix' => 'setup'], function () {
    Route::group(['middleware' => 'setup'], function () {
        Route::any('/', 'SetupController@welcome');
        Route::any('/database', 'SetupController@database');
        Route::view('/info', 'setup.wizard.info');
        Route::post('/finish', 'SetupController@finish');
    });

    Route::group(['middleware' => 'authorize'], function () {
        Route::view('/update', 'setup.updates.welcome')->middleware('setup');
        Route::any('/exec-update', 'UpdateController@update')->middleware('setup');
    });
});
