<?php

namespace App\Core;

class Router
{
    private array $routes = [];
    private array $config;
    private array $groupStack = [];

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    /*
    |--------------------------------------------------------------------------
    | Route Methods
    |--------------------------------------------------------------------------
    */

    public function get(string $uri, array $action): void
    {
        $this->addRoute('GET', $uri, $action);
    }

    public function post(string $uri, array $action): void
    {
        $this->addRoute('POST', $uri, $action);
    }

    private function addRoute(string $method, string $uri, array $action): void
    {
        $uri = $this->normalize($uri);

        $middleware = $this->groupStack['middleware'] ?? [];

        $this->routes[$method][$uri] = [
            'action' => $action,
            'middleware' => $middleware
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Group Middleware
    |--------------------------------------------------------------------------
    */

    public function group(array $attributes, callable $callback): void
    {
        $parentMiddleware = $this->groupStack['middleware'] ?? [];

        $this->groupStack = [
            'middleware' => array_merge(
                $parentMiddleware,
                $attributes['middleware'] ?? []
            )
        ];

        $callback($this);

        $this->groupStack = [];
    }

    /*
    |--------------------------------------------------------------------------
    | Dispatch
    |--------------------------------------------------------------------------
    */

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

        foreach ($this->routes[$method] ?? [] as $route => $data) {
            $pattern = preg_replace('#\{([^}]+)\}#', '([^/]+)', $route);

            if (preg_match("#^{$pattern}$#", $uri, $matches)) {

                array_shift($matches);

                // Execute Middleware First
                $user = null;

                foreach ($data['middleware'] as $middleware) {
                    $user = $middleware::handle();
                }

                [$controller, $methodName] = $data['action'];
                $instance = new $controller;

                // Pass authenticated user to controller
                call_user_func_array(
                    [$instance, $methodName],
                    array_merge([$user], $matches)
                );

                return;
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }

    private function normalize(string $uri): string
    {
        return rtrim($uri, '/');
    }
}
