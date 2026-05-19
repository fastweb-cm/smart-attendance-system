<?php

namespace App\Modules\Exceptions\Controllers;

use App\Core\Controller;
use App\Modules\Exceptions\Models\ExceptionModel;
use Throwable;

class ExceptionController extends Controller
{
    private ExceptionModel $e;

    public function __construct()
    {
        $this->e = new ExceptionModel();
    }

    public function index()
    {
        $data = $this->getJsonInput();

        $exceptionId = (int) ($_GET['id'] ?? 0);

        try{
            $result = $this->e->findById($exceptionId);
            $this->json([
                "success"=> true,
                "data"=> $result
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

    public function store()
    {
        $data = $this->getJsonInput();

        $this->e->setId((int)($data["id"]));
        $this->e->setTitle($data["title"]);
        $this->e->setExceptionType($data["exception_type"]);
        $this->e->setDescription($data["description"] ?? null);
        $this->e->setStartDate($data["start_date"]);
        $this->e->setEndDate($data["end_date"]);
        $this->e->setCreatedBy((int)($data["created_by"] ?? 0));
        $this->e->setDateCreated(date("Y-m-d H:i:s"));

        if ((int)($data["created_by"] ?? 0) === 0) {
            $this->json([
                "success"=> false,
                "message"=> "created_by is required and must be an integer",
            ]);
            return;
        }

        try{
            $this->e->upsert();

            $message = isset($data["id"]) ? "Exception updated successfully" : "Exception created successfully";

            $this->json([
                "success" => true,
                "message"=> $message,
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

    public function delete(int $id)
    {
        $data = $this->getJsonInput();


        if ($id <= 0) {
            $this->json([
                "success"=> false,
                "message"=> "exception_id is required and must be an integer",
            ]);
            return;
        }

        try{
            $result = $this->e->delete($id);
             $this->json([
                "success"=> true,
                "message"=> "Exception deleted successfully",
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

    public function all()
    {
        $data = $this->getJsonInput();

        $exceptionType = $data["exception_type"] ?? "";
        try{
            $result = $this->e->findAll($exceptionType);
            $this->json([
                "success"=> true,
                "data"=> $result
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

}
