<?php
namespace App\Modules\Terminals\Controllers;

use App\Core\Controller;
use App\Modules\Terminals\Models\TerminalModel;
use DateTime;
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

        $branchId = (int) ($_GET['branch_id'] ?? 0);
        $terminalId = (int) ($_GET['terminal_id'] ?? 0);
        $status = $_GET['status'] ?? "";


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


        $this->t->setSlug($data["terminalDetails"]["slug"] ?? "");
        $this->t->setName($data["terminalDetails"]["name"]);
        $this->t->setBranchId((int)($data["terminalDetails"]["branch_id"] ?? 0));
        $this->t->setStatus($data["terminalDetails"]["status"]);

        try{
            $this->t->save($data["authCapabilities"], $data["authPolicies"]);

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
        $id = (int)($data["terminalDetails"]["id"] ?? 0);

        if ($id <= 0) {
            $this->json([
                "success" => false,
                "message"=> "Terminal ID is required"
            ]);
        }

        $date = new DateTime();
        $updated_at = $date->format('Y-m-d H:i:s');

        $this->t->setId($id);
        // $this->t->setSlug($data["terminalDetails"]["slug"] ?? "");
        $this->t->setName($data["terminalDetails"]["name"]);
        $this->t->setBranchId((int)($data["terminalDetails"]["branch_id"] ?? 0));
        $this->t->setStatus($data["terminalDetails"]["status"]);
        $this->t->setUpdatedAt($updated_at);

        try{
            $this->t->update($data["authCapabilities"], $data["authPolicies"]);

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
                    "message"=> "Terminal ID ".$id." was successfully deleted"
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

    if (empty($data["code"])) {
        $this->json([
            "success" => false,
            "message" => "Activation code is required"
        ], 400);
        return;
    }

    $terminalId = $this->t->verifyActivationcode(trim($data["code"]));
    
    if ($terminalId === 0) {
        $this->json([
            "success" => false,
            "message" => "Invalid or expired activation code"
        ], 400); 
        return;
    }

    try {
        $data = $this->t->getTerminalData($terminalId);

        $this->json([
            "success" => true,
            "data" => $data
        ]);
    } catch (\Throwable $e) {
        $this->json([
            "success" => false,
            "message" => $e->getMessage(),
            "type" => get_class($e)
        ], 500);
    }
}

    public function getAuthTypes()
    {
        $authTypes = $this->t->fetchAuthTypes();
        $this->json($authTypes);
    }

    public function getTerminalDetailsBySlug(string $slug)
    {
        try {
            $data = $this->t->fetchTerminalDetailsBySlug($slug);
            if ($data) {
                $this->json($data);
            } else {
                $this->json([
                    "success"=> false,
                    "message"=> "Terminal not found"
                ], 404);
            }
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

}
