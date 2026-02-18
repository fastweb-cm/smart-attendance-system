<?php

namespace App\Core;

class Router
{
    private array $routes = [];
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function get(string $uri, array $action): void
    {
        $this->routes['GET'][$this->normalize($uri)] = $action;
    }

    public function post(string $uri, array $action): void
    {
        $this->routes['POST'][$this->normalize($uri)] = $action;
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

        foreach ($this->routes[$method] ?? [] as $route => $action) {
            $pattern = preg_replace('#\{([^}]+)\}#', '([^/]+)', $route);

            if (preg_match("#^{$pattern}$#", $uri, $matches)) {
                array_shift($matches);

                [$controller, $method] = $action;
                call_user_func_array([new $controller, $method], $matches);
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
