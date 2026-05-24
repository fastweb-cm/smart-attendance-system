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

    public function put(string $uri, array $action): void
    {
        $this->addRoute('PUT', $uri, $action);
    }

    public function patch(string $uri, array $action): void
    {
        $this->addRoute('PATCH', $uri, $action);
    }

    public function delete(string $uri, array $action): void
    {
        $this->addRoute('DELETE', $uri, $action);
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

        try {
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

                    // Pass dynamic URI segment wildcards to matching controller action
                    call_user_func_array(
                        [$instance, $methodName],
                        $matches
                    );

                    return;
                }
            }

            // Fallback if no matching routing map structural signatures were matched
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Route endpoint not found']);

        } catch (\Throwable $e) {
            // 1. Automatically trap and log the full exception to tbl_logs
            \App\Core\Logger::logException($e, 'error');

            // 2. Respond with a clean, unified JSON structure so the frontend doesn't hang
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'An internal execution sequence exception occurred.',
                'error'   => $e->getMessage(),
                'type'    => get_class($e)
            ]);
            exit();
        }
    }

    private function normalize(string $uri): string
    {
        return rtrim($uri, '/');
    }
}
