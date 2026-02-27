<?php

return [
    'secret' => $_ENV['JWT_SECRET'],
    'issuer' => $_ENV['APP_URL'],
];
