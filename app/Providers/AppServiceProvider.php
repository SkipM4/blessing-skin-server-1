<?php

namespace App\Providers;

use App\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('cipher', 'App\Services\Cipher\\'.config('secure.cipher'));
        $this->app->singleton(Services\Option::class);
        $this->app->alias(Services\Option::class, 'options');
        $this->app->singleton(Services\Webpack::class);
        $this->app->singleton('oauth.providers', function () {
            return new \Illuminate\Support\Collection();
        });
    }

    /**
     * Bootstrap any application services.
     *
     * @codeCoverageIgnore
     */
    public function boot(Request $request)
    {
        // Control the URL generated by url() function
        $this->configureUrlGenerator($request);

        try {
            if (option('enable_redis') && Redis::ping()) {
                config([
                    'cache.default' => 'redis',
                    'session.driver' => 'redis',
                    'queue.default' => 'redis',
                ]);
            }
        } catch (\Exception $e) {
        }
    }

    /**
     * Configure the \Illuminate\Routing\UrlGenerator.
     *
     * @codeCoverageIgnore
     */
    protected function configureUrlGenerator(Request $request): void
    {
        if (!option('auto_detect_asset_url')) {
            $rootUrl = option('site_url');

            // Replace HTTP_HOST with site_url set in options,
            // to prevent CDN source problems.
            if ($this->app['url']->isValidUrl($rootUrl)) {
                $this->app['url']->forceRootUrl($rootUrl);
            }
        }

        /**
         * Check whether the request is secure or not.
         * True is always returned when "X-Forwarded-Proto" header is set.
         *
         * We define this function because Symfony's "Request::isSecure()" method
         * needs "setTrustedProxies()" which sucks when load balancer is enabled.
         */
        $isRequestSecure = $request->server('HTTPS') === 'on'
            || $request->server('HTTP_X_FORWARDED_PROTO') === 'https'
            || $request->server('HTTP_X_FORWARDED_SSL') === 'on';

        if (option('force_ssl') || $isRequestSecure) {
            $this->app['url']->forceScheme('https');
        }
    }
}
