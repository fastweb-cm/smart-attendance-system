<?php
namespace App\Modules\Terminals\Controllers;

use App\Core\Controller;
use App\Modules\Terminals\Models\TerminalModel;
use Throwable;

class TerminalController extends Controller {
    private TerminalModel $t;
    public function __construct()
    {
        $this->t = new TerminalModel();
    }

    public function index()
    {
        $data = $this->getJsonInput();

        $branchId = (int)$data["branch_id"] ?? 0;
        $terminalId = (int)$data["terminal_id"] ?? 0;
        $status = $data["status"] ?? 'active';

        try{
            $result = $this->t->fetch($branchId, $terminalId, $status);
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


        $this->t->setSlug($data["slug"] ?? "");
        $this->t->setName($data["name"]);
        $this->t->setBranchId((int)($data["branch_id"] ?? 0));
        $this->t->setStatus($data["status"]);

        try{
            $this->t->save($data["auth_capabilities"], $data["access_policy"]);

            //let get the activation code
            $code = $this->t->getActivationCode();

            $this->json([
                "success" => true,
                "message"=> "Terminal created successfully",
                "activationCode" => $code,
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type" => get_class($e)
            ]);
        }
    }

    public function edit()
    {
        $data = $this->getJsonInput();
        $id = (int)($data["id"] ?? 0);

        if ($id < 0) {
            $this->json([
                "success" => false,
                "message"=> "Terminal ID is required"
            ]);
        }

        $this->t->setId($id);
        $this->t->setSlug($data["slug"] ?? "");
        $this->t->setName($data["name"]);
        $this->t->setBranchId((int)($data["branch_id"] ?? 0));
        $this->t->setStatus($data["status"]);

        try{
            $this->t->update($data["auth_capabilities"], $data["access_policy"]);

            $this->json([
                "success" => true,
                "message"=> "Terminal Updated successfully"
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type" => get_class($e)
            ]);
        }
    }

    public function delete(int $id)
    {
        $id = (int)($id ?? 0);

        if ($id < 0) {
            $this->json([
                "success"=> false,
                "message"=> "Invalid request"
            ]);
        }

        $this->t->setId($id);

        try {
            if ($this->t->delete()) { 
                $this->json([
                    "success"=> true,
                    "message"=> "Group ID ".$id." was successfully deleted"
                ]);
            }
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message"=> $e->getMessage(),
                "type" => get_class($e) // helpful for debugging
            ], $e->getCode() ? : 500);
        }
    }

    //activate terminal
    public function activate()
    {
        $data = $this->getJsonInput();

        $terminalId = $this->t->verifyActivationcode($data["code"]);
        if ($terminalId === 0) {
            $this->json([
                "success"=> false,
                "message"=> "Invalid activation code"
            ], 500);
        }

        try {
            // now let get the terminal details
            $data = $this->t->getTerminalData($terminalId);

            $this->json([
                "success" => true,
                "data" => $data
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }

    }

}
